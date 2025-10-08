/**
 * Service pour la gestion des participants
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { ParticipantsCache } from './participants.cache';
import {
  Participant,
  ParticipantCreate,
  ParticipantUpdate,
  ParticipantFilters,
  ParticipantStats,
  ParticipantWithDetails,
  ParticipantWorkload
} from './participants.types';

export class ParticipantsService {
  private cache: ParticipantsCache;

  constructor() {
    this.cache = new ParticipantsCache(agriConnectCache);
  }

  /**
   * Récupérer tous les participants avec filtres optionnels
   */
  async getAll(filters?: ParticipantFilters): Promise<Participant[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste participants');
        return cached;
      }

      console.log('👥 Récupération des participants depuis la base');

      let query = supabase
        .from('participants')
        .select('*')
        .order('name', { ascending: true });

      // Appliquer les filtres
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.plot_id) {
        query = query.eq('plot_id', filters.plot_id);
      }
      if (filters?.farm_file_id) {
        query = query.eq('farm_file_id', filters.farm_file_id);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters?.education_level) {
        query = query.eq('education_level', filters.education_level);
      }
      if (filters?.age_min) {
        query = query.gte('age', filters.age_min);
      }
      if (filters?.age_max) {
        query = query.lte('age', filters.age_max);
      }
      if (filters?.experience_min) {
        query = query.gte('experience_years', filters.experience_min);
      }
      if (filters?.experience_max) {
        query = query.lte('experience_years', filters.experience_max);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des participants:', error);
        throw error;
      }

      const participants = data || [];
      
      // Mettre en cache
      await this.cache.setList(participants, filters);
      
      console.log(`✅ ${participants.length} participants récupérés`);
      return participants;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer les participants d'une parcelle
   */
  async getByPlotId(plotId: string, filters?: ParticipantFilters): Promise<Participant[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getPlotParticipants(plotId, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participants parcelle:', plotId);
        return cached;
      }

      console.log('👥 Récupération des participants pour la parcelle:', plotId);

      const plotFilters = { ...filters, plot_id: plotId };
      const participants = await this.getAll(plotFilters);

      // Mettre en cache spécifique à la parcelle
      await this.cache.setPlotParticipants(plotId, participants, filters);

      console.log(`✅ ${participants.length} participants récupérés pour la parcelle`);
      return participants;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getByPlotId:', error);
      throw error;
    }
  }

  /**
   * Récupérer les participants d'une fiche producteur
   */
  async getByFarmFileId(farmFileId: string, filters?: ParticipantFilters): Promise<Participant[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getFarmFileParticipants(farmFileId, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participants fiche producteur:', farmFileId);
        return cached;
      }

      console.log('👥 Récupération des participants pour la fiche producteur:', farmFileId);

      const farmFileFilters = { ...filters, farm_file_id: farmFileId };
      const participants = await this.getAll(farmFileFilters);

      // Mettre en cache spécifique à la fiche producteur
      await this.cache.setFarmFileParticipants(farmFileId, participants, filters);

      console.log(`✅ ${participants.length} participants récupérés pour la fiche producteur`);
      return participants;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getByFarmFileId:', error);
      throw error;
    }
  }

  /**
   * Récupérer un participant par ID
   */
  async getById(id: string): Promise<Participant | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participant:', id);
        return cached;
      }

      console.log('👥 Récupération du participant:', id);

      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Participant non trouvé:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération du participant:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Participant récupéré:', data?.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer un participant avec ses détails
   */
  async getByIdWithDetails(id: string): Promise<ParticipantWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participant avec détails:', id);
        return cached;
      }

      console.log('👥 Récupération du participant avec détails:', id);

      // Récupérer le participant
      const participant = await this.getById(id);
      if (!participant) {
        return null;
      }

      // Récupérer les détails des entités liées
      const [plotResult, farmFileResult, createdByResult] = await Promise.all([
        participant.plot_id ? supabase
          .from('plots')
          .select('name_season_snapshot')
          .eq('id', participant.plot_id)
          .single() : Promise.resolve({ data: null }),
        participant.farm_file_id ? supabase
          .from('farm_files')
          .select('name')
          .eq('id', participant.farm_file_id)
          .single() : Promise.resolve({ data: null }),
        participant.created_by ? supabase
          .from('profiles')
          .select('display_name')
          .eq('id', participant.created_by)
          .single() : Promise.resolve({ data: null })
      ]);

      // Récupérer le résumé d'activité
      const activitySummary = await this.getParticipantActivitySummary(id);

      const result: ParticipantWithDetails = {
        ...participant,
        plot_name: plotResult.data?.name_season_snapshot,
        farm_file_name: farmFileResult.data?.name,
        created_by_name: createdByResult.data?.display_name,
        activity_summary: activitySummary
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Participant avec détails récupéré:', participant.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Récupérer le résumé d'activité d'un participant
   */
  private async getParticipantActivitySummary(participantId: string): Promise<any> {
    try {
      // Récupérer les opérations et observations liées au participant
      const [operationsResult, observationsResult] = await Promise.all([
        supabase
          .from('operations')
          .select('id, operation_date')
          .eq('performer_id', participantId)
          .order('operation_date', { ascending: false })
          .limit(10),
        supabase
          .from('observations')
          .select('id, observation_date')
          .eq('observed_by', participantId)
          .order('observation_date', { ascending: false })
          .limit(10)
      ]);

      const operations = operationsResult.data || [];
      const observations = observationsResult.data || [];
      const lastActivity = operations[0]?.operation_date || observations[0]?.observation_date;

      return {
        total_operations: operations.length,
        total_observations: observations.length,
        last_activity: lastActivity
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du résumé d\'activité:', error);
      return {
        total_operations: 0,
        total_observations: 0,
        last_activity: undefined
      };
    }
  }

  /**
   * Créer un nouveau participant
   */
  async create(data: ParticipantCreate): Promise<Participant> {
    try {
      console.log('👥 Création d\'un nouveau participant:', data.name);

      const { data: result, error } = await supabase
        .from('participants')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création du participant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      if (result.plot_id) {
        await this.cache.invalidatePlotParticipants(result.plot_id);
      }
      if (result.farm_file_id) {
        await this.cache.invalidateFarmFileParticipants(result.farm_file_id);
      }
      await this.cache.invalidateByRole(result.role);
      await this.cache.invalidateActive();
      await this.cache.invalidateStats();

      console.log('✅ Participant créé:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.create:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un participant
   */
  async update(id: string, data: ParticipantUpdate): Promise<Participant> {
    try {
      console.log('👥 Mise à jour du participant:', id);

      const { data: result, error } = await supabase
        .from('participants')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du participant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      if (result.plot_id) {
        await this.cache.invalidatePlotParticipants(result.plot_id);
      }
      if (result.farm_file_id) {
        await this.cache.invalidateFarmFileParticipants(result.farm_file_id);
      }
      await this.cache.invalidateByRole(result.role);
      await this.cache.invalidateActive();
      await this.cache.invalidateStats();

      console.log('✅ Participant mis à jour:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer un participant
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('👥 Suppression du participant:', id);

      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression du participant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Participant supprimé:', id);

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer les participants actifs
   */
  async getActive(filters?: ParticipantFilters): Promise<Participant[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getActive(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participants actifs');
        return cached;
      }

      console.log('👥 Récupération des participants actifs');

      const activeFilters = { ...filters, is_active: true };
      const participants = await this.getAll(activeFilters);

      // Mettre en cache
      await this.cache.setActive(participants, filters);

      console.log(`✅ ${participants.length} participants actifs récupérés`);
      return participants;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getActive:', error);
      throw error;
    }
  }

  /**
   * Récupérer les participants par rôle
   */
  async getByRole(role: string, filters?: ParticipantFilters): Promise<Participant[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByRole(role, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour participants par rôle:', role);
        return cached;
      }

      console.log('👥 Récupération des participants par rôle:', role);

      const roleFilters = { ...filters, role: role as any };
      const participants = await this.getAll(roleFilters);

      // Mettre en cache par rôle
      await this.cache.setByRole(role, participants, filters);

      console.log(`✅ ${participants.length} participants de rôle ${role} récupérés`);
      return participants;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getByRole:', error);
      throw error;
    }
  }

  /**
   * Récupérer la charge de travail d'un participant
   */
  async getParticipantWorkload(participantId: string): Promise<ParticipantWorkload> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getWorkload(participantId);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour charge de travail participant:', participantId);
        return cached;
      }

      console.log('👥 Récupération de la charge de travail pour le participant:', participantId);

      // Récupérer le participant
      const participant = await this.getById(participantId);
      if (!participant) {
        throw new Error('Participant non trouvé');
      }

      // Récupérer les activités récentes
      const activitySummary = await this.getParticipantActivitySummary(participantId);

      // Calculer le score de charge de travail (0-100)
      const totalActivities = activitySummary.total_operations + activitySummary.total_observations; // Utilis� dans workloadScore
      const workloadScore = Math.min(100, (totalActivities / 20) * 100); // 20 activités = 100%

      const workload: ParticipantWorkload = {
        participant_id: participantId,
        participant_name: participant.name,
        role: participant.role,
        total_activities: totalActivities,
        recent_activities: totalActivities,
        workload_score: Math.round(workloadScore),
        skills_utilization: participant.skills || [],
        performance_rating: Math.min(5, Math.max(1, workloadScore / 20)) // 1-5 basé sur la charge
      };

      // Mettre en cache
      await this.cache.setWorkload(participantId, workload);

      console.log(`✅ Charge de travail récupérée pour le participant: ${workload.workload_score}%`);
      return workload;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getParticipantWorkload:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des participants
   */
  async getStats(): Promise<ParticipantStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats participants');
        return cached;
      }

      console.log('👥 Récupération des statistiques des participants');

      const { data, error } = await supabase
        .from('participants')
        .select('role, gender, education_level, age, experience_years, plot_id, farm_file_id, is_active');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const participants = data || [];
      
      const stats: ParticipantStats = {
        total_participants: participants.length,
        active_participants: participants.filter(p => p.is_active).length,
        inactive_participants: participants.filter(p => !p.is_active).length,
        by_role: participants.reduce((acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_gender: participants.reduce((acc, p) => {
          if (p.gender) {
            acc[p.gender] = (acc[p.gender] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        by_education: participants.reduce((acc, p) => {
          if (p.education_level) {
            acc[p.education_level] = (acc[p.education_level] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        by_plot: participants.reduce((acc, p) => {
          if (p.plot_id) {
            acc[p.plot_id] = (acc[p.plot_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        by_farm_file: participants.reduce((acc, p) => {
          if (p.farm_file_id) {
            acc[p.farm_file_id] = (acc[p.farm_file_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        average_age: participants.reduce((acc, p) => acc + (p.age || 0), 0) / participants.length || 0,
        average_experience: participants.reduce((acc, p) => acc + (p.experience_years || 0), 0) / participants.length || 0
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des participants récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur ParticipantsService.getStats:', error);
      throw error;
    }
  }

  /**
   * Récupère les participants (intervenants) pour une parcelle (méthode manquante de CollecteService)
   */
  async getParticipantsByPlotId(plotId: string): Promise<any[]> {
    try {
      console.log('👥 [ParticipantsService] Récupération des intervenants pour la parcelle:', plotId);
      
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [ParticipantsService] Erreur lors de la récupération des intervenants:', error);
        throw error;
      }
      
      if (!data) return [];
      
      const participantsDisplay: any[] = data.map(p => {
        const tags: string[] = [];
        if (p.literacy) tags.push('Alphabétisé(e)');
        if (p.languages && p.languages.length > 0) tags.push(...p.languages);
        
        let age: number | undefined;
        if (p.birthdate) {
          age = new Date().getFullYear() - new Date(p.birthdate).getFullYear();
        }

        return {
          id: p.id,
          name: p.name,
          role: p.role,
          age: age,
          tags: tags,
        };
      });

      console.log('✅ [ParticipantsService] Intervenants récupérés:', participantsDisplay.length);
      return participantsDisplay;

    } catch (error) {
      console.error('❌ [ParticipantsService] Erreur générale dans getParticipantsByPlotId:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const ParticipantsServiceInstance = new ParticipantsService();
