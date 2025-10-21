import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { Database } from '../../types/database';

export interface MediaFile {
  id: string;
  owner_profile_id: string;
  entity_type: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
  entity_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes?: number;
  gps_coordinates?: {
    lat: number;
    lon: number;
  };
  taken_at?: string;
  description?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  url?: string; // URL signée pour l'affichage
}

export interface UploadMediaParams {
  file: File | Blob | ArrayBuffer | Uint8Array;
  entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
  entityId: string;
  fileName: string;
  description?: string;
  tags?: string[];
  gpsCoordinates?: {
    lat: number;
    lon: number;
  };
  takenAt?: Date;
}

export class MediaService {
  static supabase: SupabaseClient<Database> = supabase;

  /**
   * Upload une photo vers Supabase Storage et enregistre les métadonnées
   */
  static async uploadMedia(params: UploadMediaParams): Promise<MediaFile> {
    try {
      console.log('📸 [MEDIA] Début upload photo:', {
        entityType: params.entityType,
        entityId: params.entityId,
        fileName: params.fileName,
        fileSize: params.file instanceof File ? params.file.size : 'Blob'
      });

      // 1. Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileExtension = params.fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${params.entityType}_${params.entityId}_${timestamp}.${fileExtension}`;
      
      // Vérifier que l'utilisateur est authentifié pour obtenir son ID
      const { data: { user }, error: authError } = await MediaService.supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Structure du chemin : media/{user_id}/{entity_type}/{entity_id}/{filename}
      const filePath = `media/${user.id}/${params.entityType}/${params.entityId}/${uniqueFileName}`;

      console.log('📁 [MEDIA] Chemin de stockage:', filePath);

      // 2. Upload vers Supabase Storage
      // Déterminer le type MIME et la taille
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
        fileSize = params.file.byteLength || params.file.length;
      }

      const { data: uploadData, error: uploadError } = await MediaService.supabase.storage
        .from('media')
        .upload(filePath, params.file, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [MEDIA] Erreur upload storage:', uploadError);
        throw new Error(`Erreur upload: ${uploadError.message}`);
      }

      console.log('✅ [MEDIA] Upload storage réussi:', uploadData.path);

      // 3. Récupérer l'URL publique (en supprimant le préfixe "media/" pour éviter le double)
      const pathForUrl = filePath.replace(/^media\//, '');
      const { data: urlData } = MediaService.supabase.storage
        .from('media')
        .getPublicUrl(pathForUrl);

      console.log('🔗 [MEDIA] URL publique générée:', urlData.publicUrl);

      // 4. Enregistrer les métadonnées en base
      const { data: mediaData, error: dbError } = await MediaService.supabase
        .from('media')
        .insert({
          owner_profile_id: user.id, // Utiliser auth.uid() via l'utilisateur authentifié
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
        console.error('❌ [MEDIA] Erreur enregistrement BDD:', dbError);
        // Nettoyer le fichier uploadé en cas d'erreur
        await MediaService.supabase.storage
          .from('media')
          .remove([filePath]);
        throw new Error(`Erreur enregistrement: ${dbError.message}`);
      }

      console.log('✅ [MEDIA] Métadonnées enregistrées:', mediaData.id);

      // 5. Retourner les données complètes
      const result: MediaFile = {
        ...mediaData,
        url: urlData.publicUrl,
        gps_coordinates: mediaData.gps_coordinates ? {
          lat: (mediaData.gps_coordinates as any).coordinates[1],
          lon: (mediaData.gps_coordinates as any).coordinates[0]
        } : undefined
      };

      console.log('🎉 [MEDIA] Upload complet réussi:', result.id);
      return result;

    } catch (error) {
      console.error('❌ [MEDIA] Erreur générale upload:', error);
      throw error;
    }
  }

  /**
   * Récupère les médias liés à une entité
   */
  static async getMediaByEntity(
    entityType: 'plot' | 'crop' | 'operation' | 'observation' | 'producer',
    entityId: string
  ): Promise<MediaFile[]> {
    try {
      console.log('📸 [MEDIA] Récupération médias:', { entityType, entityId });

      const { data, error } = await MediaService.supabase
        .from('media')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [MEDIA] Erreur récupération:', error);
        throw error;
      }

      console.log('📸 [MEDIA] Données brutes récupérées:', data?.length || 0, 'médias');
      console.log('📸 [MEDIA] Détails des médias:', data);

      // Générer les URLs publiques
      const mediaWithUrls = data.map(media => {
        const { data: urlData } = MediaService.supabase.storage
          .from('media')
          .getPublicUrl(media.file_path);

        return {
          ...media,
          url: urlData.publicUrl,
          gps_coordinates: media.gps_coordinates ? {
            lat: (media.gps_coordinates as any).coordinates[1],
            lon: (media.gps_coordinates as any).coordinates[0]
          } : undefined
        };
      });

      console.log(`✅ [MEDIA] ${mediaWithUrls.length} médias récupérés`);
      return mediaWithUrls;

    } catch (error) {
      console.error('❌ [MEDIA] Erreur récupération médias:', error);
      throw error;
    }
  }

  /**
   * Supprime un média (fichier + métadonnées)
   */
  static async deleteMedia(mediaId: string): Promise<void> {
    try {
      console.log('🗑️ [MEDIA] Suppression média:', mediaId);

      // 1. Récupérer les métadonnées
      const { data: mediaData, error: fetchError } = await MediaService.supabase
        .from('media')
        .select('file_path')
        .eq('id', mediaId)
        .single();

      if (fetchError) {
        console.error('❌ [MEDIA] Erreur récupération métadonnées:', fetchError);
        throw fetchError;
      }

      // 2. Supprimer le fichier du storage
      const { error: storageError } = await MediaService.supabase.storage
        .from('media')
        .remove([mediaData.file_path]);

      if (storageError) {
        console.error('❌ [MEDIA] Erreur suppression storage:', storageError);
        // Continue même si le fichier n'existe pas
      }

      // 3. Supprimer les métadonnées
      const { error: dbError } = await MediaService.supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        console.error('❌ [MEDIA] Erreur suppression BDD:', dbError);
        throw dbError;
      }

      console.log('✅ [MEDIA] Média supprimé avec succès');

    } catch (error) {
      console.error('❌ [MEDIA] Erreur suppression média:', error);
      throw error;
    }
  }

  /**
   * Génère une URL signée pour un accès privé
   */
  static async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await MediaService.supabase.storage
        .from('media')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('❌ [MEDIA] Erreur URL signée:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ [MEDIA] Erreur génération URL signée:', error);
      throw error;
    }
  }

  /**
   * Récupère un média par son ID
   */
  static async getMediaById(mediaId: string): Promise<MediaFile | null> {
    try {
      const { data, error } = await MediaService.supabase
        .from('media')
        .select('*')
        .eq('id', mediaId)
        .single();

      if (error) {
        return null;
      }

      const { data: urlData } = MediaService.supabase.storage
        .from('media')
        .getPublicUrl(data.file_path);

      return {
        ...data,
        url: urlData.publicUrl,
        gps_coordinates: data.gps_coordinates ? {
          lat: (data.gps_coordinates as any).coordinates[1],
          lon: (data.gps_coordinates as any).coordinates[0]
        } : undefined
      };
    } catch {
      return null;
    }
  }

  /**
   * Récupère les médias d'un agent (tous types confondus)
   */
  static async getAgentMedia(agentId: string, limit: number = 50): Promise<MediaFile[]> {
    try {
      console.log('📸 [MEDIA] Récupération médias agent:', agentId);

      const { data, error } = await MediaService.supabase
        .from('media')
        .select('*')
        .eq('owner_profile_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [MEDIA] Erreur récupération médias agent:', error);
        throw error;
      }

      // Générer les URLs publiques
      const mediaWithUrls = data.map(media => {
        const { data: urlData } = MediaService.supabase.storage
          .from('media')
          .getPublicUrl(media.file_path);

        return {
          ...media,
          url: urlData.publicUrl,
          gps_coordinates: media.gps_coordinates ? {
            lat: (media.gps_coordinates as any).coordinates[1],
            lon: (media.gps_coordinates as any).coordinates[0]
          } : undefined
        };
      });

      console.log(`✅ [MEDIA] ${mediaWithUrls.length} médias agent récupérés`);
      return mediaWithUrls;

    } catch (error) {
      console.error('❌ [MEDIA] Erreur récupération médias agent:', error);
      throw error;
    }
  }
}
