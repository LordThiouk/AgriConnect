/**
 * Service de gestion des intervenants - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';  
import { IntervenantsCache } from './intervenants.cache';
import {
  Intervenant,
  IntervenantDisplay,
  IntervenantUpdateData,
  IntervenantInsert,
  IntervenantServiceOptions
} from './intervenants.types';

class IntervenantsService {
  private supabase: SupabaseClient = supabase;
  private cache = new IntervenantsCache();

  /**
   * Récupère tous les intervenants d'une parcelle avec cache
   */
  async getIntervenantsByPlotId(
    plotId: string,
    options: IntervenantServiceOptions = {}
  ): Promise<IntervenantDisplay[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('👥 [IntervenantsService] Récupération des intervenants pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedIntervenants = await this.cache.getPlotIntervenants(plotId);
      if (cachedIntervenants) {
        console.log(`⚡ [IntervenantsService] Cache HIT: ${cachedIntervenants.length} intervenants pour la parcelle ${plotId}`);
        // Convertir en display format
        return cachedIntervenants.map(intervenant => this.formatIntervenantDisplay(intervenant));
      }
      console.log(`❌ [IntervenantsService] Cache MISS pour les intervenants de la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('participants')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [IntervenantsService] Erreur lors de la récupération des intervenants:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [IntervenantsService] ${data?.length || 0} intervenants récupérés en ${responseTime}ms`);

      const intervenants = (data || []).map((intervenant: any) => this.formatIntervenantData(intervenant));
      const intervenantsDisplay = intervenants.map(intervenant => this.formatIntervenantDisplay(intervenant));

      // Mettre en cache si activé
      if (useCache && intervenants.length > 0) {
        await this.cache.setPlotIntervenants(plotId, intervenants, typeof cacheTTL === 'string' ? undefined : cacheTTL);
      }

      return intervenantsDisplay;
    } catch (error) {
      console.error('❌ [IntervenantsService] Erreur lors de la récupération des intervenants:', error);
      throw error;
    }
  }

  /**
   * Récupère un intervenant par son ID avec cache
   */
  async getIntervenantById(
    intervenantId: string,
    options: IntervenantServiceOptions = {}
  ): Promise<Intervenant | null> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🔍 [IntervenantsService] Récupération de l\'intervenant:', intervenantId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedIntervenant = await this.cache.getIntervenant(intervenantId);
      if (cachedIntervenant) {
        console.log(`⚡ [IntervenantsService] Cache HIT pour l'intervenant ${intervenantId}`);
        return cachedIntervenant;
      }
      console.log(`❌ [IntervenantsService] Cache MISS pour l'intervenant ${intervenantId}`);
    }

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('participants')
        .select('*')
        .eq('id', intervenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ [IntervenantsService] Intervenant ${intervenantId} non trouvé`);
          return null;
        }
        console.error('❌ [IntervenantsService] Erreur lors de la récupération de l\'intervenant:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [IntervenantsService] Intervenant récupéré en ${responseTime}ms`);

      const intervenant = this.formatIntervenantData(data);

      // Mettre en cache si activé
      if (useCache && intervenant) {
        await this.cache.setIntervenant(intervenantId, intervenant, typeof cacheTTL === 'string' ? undefined : cacheTTL);
      }

      return intervenant;
    } catch (error) {
      console.error('❌ [IntervenantsService] Erreur lors de la récupération de l\'intervenant:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel intervenant et invalide le cache
   */
  async createIntervenant(
    intervenantData: IntervenantInsert,
    options: IntervenantServiceOptions = {}
  ): Promise<Intervenant> {
    console.log('➕ [IntervenantsService] Création d\'un nouvel intervenant:', intervenantData);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('participants')
        .insert(intervenantData)
        .select()
        .single();

      if (error) {
        console.error('❌ [IntervenantsService] Erreur lors de la création de l\'intervenant:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la création de l\'intervenant');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [IntervenantsService] Intervenant créé en ${responseTime}ms`);

      const intervenant = this.formatIntervenantData(data);

      // Invalider le cache
      await this.cache.invalidatePlotCache(intervenant.plot_id);
      await this.cache.invalidateAgentCache(intervenant.created_by || '');

      return intervenant;
    } catch (error) {
      console.error('❌ [IntervenantsService] Erreur lors de la création de l\'intervenant:', error);
      throw error;
    }
  }

  /**
   * Met à jour un intervenant et invalide le cache
   */
  async updateIntervenant(
    intervenantId: string,
    updateData: IntervenantUpdateData,
    options: IntervenantServiceOptions = {}
  ): Promise<Intervenant> {
    console.log('✏️ [IntervenantsService] Mise à jour de l\'intervenant:', intervenantId);

    try {
      const startTime = Date.now();
      
      const { data, error } = await this.supabase
        .from('participants')
        .update(updateData)
        .eq('id', intervenantId)
        .select()
        .single();

      if (error) {
        console.error('❌ [IntervenantsService] Erreur lors de la mise à jour de l\'intervenant:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la mise à jour de l\'intervenant');
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [IntervenantsService] Intervenant mis à jour en ${responseTime}ms`);

      const intervenant = this.formatIntervenantData(data);

      // Invalider le cache
      await this.cache.invalidateIntervenantCache(intervenantId);
      await this.cache.invalidatePlotCache(intervenant.plot_id);
      await this.cache.invalidateAgentCache(intervenant.created_by || '');

      return intervenant;
    } catch (error) {
      console.error('❌ [IntervenantsService] Erreur lors de la mise à jour de l\'intervenant:', error);
      throw error;
    }
  }

  /**
   * Supprime un intervenant et invalide le cache
   */
  async deleteIntervenant(
    intervenantId: string,
    options: IntervenantServiceOptions = {}
  ): Promise<void> {
    console.log('🗑️ [IntervenantsService] Suppression de l\'intervenant:', intervenantId);

    try {
      // Récupérer l'intervenant avant suppression pour invalider le cache
      const { data: intervenantData } = await this.supabase
        .from('participants')
        .select('plot_id, created_by')
        .eq('id', intervenantId)
        .single();

      const startTime = Date.now();
      
      const { error } = await this.supabase
        .from('participants')
        .delete()
        .eq('id', intervenantId);

      if (error) {
        console.error('❌ [IntervenantsService] Erreur lors de la suppression de l\'intervenant:', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [IntervenantsService] Intervenant supprimé en ${responseTime}ms`);

      // Invalider le cache
      await this.cache.invalidateIntervenantCache(intervenantId);
      if (intervenantData) {
        await this.cache.invalidatePlotCache(intervenantData.plot_id);
        await this.cache.invalidateAgentCache(intervenantData.created_by || '');
      }
    } catch (error) {
      console.error('❌ [IntervenantsService] Erreur lors de la suppression de l\'intervenant:', error);
      throw error;
    }
  }

  /**
   * Formate les données d'un intervenant
   */
  private formatIntervenantData(data: any): Intervenant {
    return {
      id: data.id,
      plot_id: data.plot_id,
      name: data.name,
      role: data.role,
      created_at: data.created_at,
      updated_at: data.updated_at,
      created_by: data.created_by,
      birthdate: data.birthdate,
      cni: data.cni,
      is_young: data.is_young,
      languages: data.languages,
      literacy: data.literacy,
      sex: data.sex
    };
  }

  /**
   * Formate les données d'un intervenant pour l'affichage
   */
  private formatIntervenantDisplay(intervenant: Intervenant): IntervenantDisplay {
    return {
      id: intervenant.id,
      plot_id: intervenant.plot_id,
      name: intervenant.name,
      role: intervenant.role,
      created_at: intervenant.created_at,
      updated_at: intervenant.updated_at,
      created_by: intervenant.created_by,
      birthdate: intervenant.birthdate,
      is_young: intervenant.is_young,
      languages: intervenant.languages,
      literacy: intervenant.literacy,
      sex: intervenant.sex
    };
  }

  /**
   * Invalide le cache des intervenants d'une parcelle
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    console.log('🗑️ [IntervenantsService] Invalidation du cache pour la parcelle:', plotId);
    await this.cache.invalidatePlotCache(plotId);
  }

  /**
   * Invalide le cache des intervenants d'un agent
   */
  async invalidateAgentCache(agentId: string): Promise<void> {
    console.log('🗑️ [IntervenantsService] Invalidation du cache pour l\'agent:', agentId);
    await this.cache.invalidateAgentCache(agentId);
  }

  /**
   * Invalide tout le cache des intervenants
   */
  async invalidateAllCache(): Promise<void> {
    console.log('🗑️ [IntervenantsService] Invalidation de tout le cache des intervenants');
    await this.cache.invalidateAllCache();
  }
}

export const IntervenantsServiceInstance = new IntervenantsService();
