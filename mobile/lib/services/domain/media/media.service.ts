/**
 * Service de gestion des médias - AgriConnect
 * Extrait du MediaService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { MediaCache } from './media.cache';
import {
  MediaFile,
  UploadMediaParams,
  MediaServiceOptions
} from './media.types';

class MediaService {
  private supabase: SupabaseClient = supabase;
  private cache = new MediaCache();

  /**
   * Upload une photo vers Supabase Storage et enregistre les métadonnées avec cache
   */
  async uploadMedia(
    params: UploadMediaParams,
    options: MediaServiceOptions = {}
  ): Promise<MediaFile> {
    console.log('📸 [MediaService] Début upload photo:', {
      entityType: params.entityType,
      entityId: params.entityId,
      fileName: params.fileName,
      fileSize: params.file instanceof File ? params.file.size : 'Blob'
    });

    try {
      // 1. Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileExtension = params.fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${params.entityType}_${params.entityId}_${timestamp}.${fileExtension}`;
      
      // Vérifier que l'utilisateur est authentifié pour obtenir son ID
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Structure du chemin : media/{user_id}/{entity_type}/{entity_id}/{filename}
      const filePath = `media/${user.id}/${params.entityType}/${params.entityId}/${uniqueFileName}`;

      console.log('📁 [MediaService] Chemin de stockage:', filePath);

      // 2. Upload vers Supabase Storage
      let mimeType = 'image/jpeg';
      let fileSize = 0;
      
      if (params.file instanceof File) {
        mimeType = params.file.type;
        fileSize = params.file.size;
      } else if (params.file instanceof Blob) {
        mimeType = params.file.type || 'image/jpeg';
        fileSize = params.file.size;
      } else if (params.file instanceof ArrayBuffer || params.file instanceof Uint8Array) {
        mimeType = 'image/jpeg'; // Par défaut pour React Native
        fileSize = (params.file as ArrayBuffer).byteLength || (params.file as Uint8Array).length;
      }

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('media')
        .upload(filePath, params.file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [MediaService] Erreur upload storage:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      console.log('✅ [MediaService] Upload storage réussi:', uploadData.path);

      // 3. Récupérer l'URL publique
      const pathForUrl = filePath.replace(/^media\//, '');
      const { data: urlData } = this.supabase.storage
        .from('media')
        .getPublicUrl(pathForUrl);

      console.log('🔗 [MediaService] URL publique générée:', urlData.publicUrl);

      // 4. Enregistrer les métadonnées en base
      const { data: mediaData, error: dbError } = await this.supabase
        .from('media')
        .insert({
          owner_profile_id: user.id,
          entity_type: params.entityType,
          entity_id: params.entityId,
          file_path: filePath,
          file_name: params.fileName,
          mime_type: mimeType,
          file_size_bytes: fileSize || undefined,
          gps_coordinates: params.gpsCoordinates ? 
            `POINT(${params.gpsCoordinates.lon} ${params.gpsCoordinates.lat})` : null,
          taken_at: params.takenAt?.toISOString() || new Date().toISOString(),
          description: params.description,
          tags: params.tags
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ [MediaService] Erreur enregistrement BDD:', dbError);
        // Nettoyer le fichier uploadé en cas d'erreur
        await this.supabase.storage
          .from('media')
          .remove([filePath]);
        throw new Error(`Erreur enregistrement: ${dbError.message}`);
      }

      console.log('✅ [MediaService] Métadonnées enregistrées:', mediaData.id);

      // 5. Formater les données
      const result: MediaFile = {
        ...mediaData,
        url: urlData.publicUrl,
        gps_coordinates: mediaData.gps_coordinates ? {
          lat: 0, // À parser depuis POINT si nécessaire
          lon: 0
        } : undefined
      };

      // 6. Invalider le cache de l'entité
      await this.cache.invalidateEntityCache(params.entityType, params.entityId);
      await this.cache.invalidateOwnerCache(user.id);

      return result;
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Récupère les médias d'une entité avec cache
   */
  async getMediaByEntity(
    entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent',
    entityId: string,
    options: MediaServiceOptions = {}
  ): Promise<MediaFile[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('📸 [MediaService] Récupération des médias pour:', { entityType, entityId });

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedMedia = await this.cache.getEntityMedia(entityType, entityId);
      if (cachedMedia) {
        console.log(`⚡ [MediaService] Cache HIT: ${cachedMedia.length} médias pour ${entityType}:${entityId}`);
        return cachedMedia;
      }
      console.log(`❌ [MediaService] Cache MISS pour les médias de ${entityType}:${entityId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('media')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [MediaService] Erreur lors de la récupération des médias:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [MediaService] ${data?.length || 0} médias récupérés en ${responseTime}ms`);

      const mediaFiles = (data || []).map((media: any) => this.formatMediaData(media));

      // Mettre en cache si activé
      if (useCache && mediaFiles.length > 0) {
        await this.cache.setEntityMedia(entityType, entityId, mediaFiles, cacheTTL);
      }

      return mediaFiles;
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de la récupération des médias:', error);
      throw error;
    }
  }

  /**
   * Récupère un média par son ID avec cache
   */
  async getMediaById(
    mediaId: string,
    options: MediaServiceOptions = {}
  ): Promise<MediaFile | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [MediaService] Récupération du média:', mediaId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedMedia = await this.cache.getMedia(mediaId);
      if (cachedMedia) {
        console.log(`⚡ [MediaService] Cache HIT pour le média ${mediaId}`);
        return cachedMedia;
      }
      console.log(`❌ [MediaService] Cache MISS pour le média ${mediaId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ [MediaService] Média ${mediaId} non trouvé`);
          return null;
        }
        console.error('❌ [MediaService] Erreur lors de la récupération du média:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [MediaService] Média récupéré en ${responseTime}ms`);

      const media = this.formatMediaData(data);

      // Mettre en cache si activé
      if (useCache && media) {
        await this.cache.setMedia(mediaId, media, cacheTTL);
      }

      return media;
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de la récupération du média:', error);
      throw error;
    }
  }

  /**
   * Supprime un média et invalide le cache
   */
  async deleteMedia(
    mediaId: string,
    options: MediaServiceOptions = {}
  ): Promise<void> {
    console.log('🗑️ [MediaService] Suppression du média:', mediaId);

    try {
      // Récupérer les informations du média avant suppression
      const { data: mediaData } = await this.supabase
        .from('media')
        .select('entity_type, entity_id, file_path, owner_profile_id')
        .eq('id', mediaId)
        .single();

      const startTime = Date.now();
      
      // Supprimer de la base de données
      const { error: dbError } = await this.supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        console.error('❌ [MediaService] Erreur lors de la suppression en BDD:', dbError);
        throw dbError;
      }

      // Supprimer du storage
      if (mediaData?.file_path) {
        const { error: storageError } = await this.supabase.storage
          .from('media')
          .remove([mediaData.file_path]);

        if (storageError) {
          console.warn('⚠️ [MediaService] Erreur lors de la suppression du fichier:', storageError);
        }
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [MediaService] Média supprimé en ${responseTime}ms`);

      // Invalider le cache
      await this.cache.invalidateMediaCache(mediaId);
      if (mediaData) {
        await this.cache.invalidateEntityCache(mediaData.entity_type, mediaData.entity_id);
        await this.cache.invalidateOwnerCache(mediaData.owner_profile_id);
      }
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de la suppression du média:', error);
      throw error;
    }
  }

  /**
   * Génère une URL signée pour un média
   */
  async getSignedUrl(
    filePath: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('media')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('❌ [MediaService] Erreur lors de la génération de l\'URL signée:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de la génération de l\'URL signée:', error);
      throw error;
    }
  }

  /**
   * Formate les données d'un média
   */
  private formatMediaData(data: any): MediaFile {
    return {
      id: data.id,
      owner_profile_id: data.owner_profile_id,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      file_path: data.file_path,
      file_name: data.file_name,
      mime_type: data.mime_type,
      file_size_bytes: data.file_size_bytes,
      gps_coordinates: data.gps_coordinates ? {
        lat: 0, // À parser depuis POINT si nécessaire
        lon: 0
      } : undefined,
      taken_at: data.taken_at,
      description: data.description,
      tags: data.tags,
      created_at: data.created_at,
      updated_at: data.updated_at,
      url: data.url
    };
  }

  /**
   * Invalide le cache des médias d'une entité
   */
  async invalidateEntityCache(entityType: string, entityId: string): Promise<void> {
    console.log('🗑️ [MediaService] Invalidation du cache pour:', { entityType, entityId });
    await this.cache.invalidateEntityCache(entityType, entityId);
  }

  /**
   * Invalide le cache des médias d'un propriétaire
   */
  async invalidateOwnerCache(ownerId: string): Promise<void> {
    console.log('🗑️ [MediaService] Invalidation du cache pour le propriétaire:', ownerId);
    await this.cache.invalidateOwnerCache(ownerId);
  }

  /**
   * Met à jour l'entité associée à un média
   */
  async updateMediaEntity(
    mediaId: string,
    newEntityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer' | 'agent',
    newEntityId: string
  ): Promise<void> {
    console.log('🔄 [MediaService] Mise à jour de l\'entité du média:', { mediaId, newEntityType, newEntityId });

    try {
      const { error } = await this.supabase
        .from('media')
        .update({
          entity_type: newEntityType,
          entity_id: newEntityId,
          updated_at: new Date().toISOString()
        })
        .eq('id', mediaId);

      if (error) {
        console.error('❌ [MediaService] Erreur lors de la mise à jour de l\'entité:', error);
        throw error;
      }

      console.log('✅ [MediaService] Entité du média mise à jour');

      // Invalider le cache
      await this.cache.invalidateMediaCache(mediaId);
    } catch (error) {
      console.error('❌ [MediaService] Erreur lors de la mise à jour de l\'entité du média:', error);
      throw error;
    }
  }

  /**
   * Invalide tout le cache des médias
   */
  async invalidateAllCache(): Promise<void> {
    console.log('🗑️ [MediaService] Invalidation de tout le cache des médias');
    await this.cache.invalidateAllCache();
  }
}

export const MediaServiceInstance = new MediaService();
