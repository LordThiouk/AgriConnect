/**
 * Service pour la gestion des assignations d'agents
 */

import { supabase } from '../../../../../lib/supabase/client';
import { agriConnectCache } from '../../core/cache';
import { AgentAssignmentsCache } from './agent-assignments.cache';
import {
  AgentAssignment,
  AgentAssignmentCreate,
  AgentAssignmentUpdate,
  AgentAssignmentFilters,
  AgentAssignmentStats,
  AgentAssignmentWithDetails,
  AgentWorkload,
  BulkAssignmentCreate
} from './agent-assignments.types';

export class AgentAssignmentsService {
  private cache: AgentAssignmentsCache;

  constructor() {
    this.cache = new AgentAssignmentsCache(agriConnectCache);
  }

  /**
   * Récupérer toutes les assignations avec filtres optionnels
   */
  async getAll(filters?: AgentAssignmentFilters): Promise<AgentAssignment[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste assignations');
        return cached;
      }

      console.log('👥 Récupération des assignations depuis la base');

      let query = supabase
        .from('agent_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (filters?.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }
      if (filters?.assigned_to_id) {
        query = query.eq('assigned_to_id', filters.assigned_to_id);
      }
      if (filters?.assigned_to_type) {
        query = query.eq('assigned_to_type', filters.assigned_to_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assigned_by) {
        query = query.eq('assigned_by', filters.assigned_by);
      }
      if (filters?.date_from) {
        query = query.gte('assigned_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('assigned_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des assignations:', error);
        throw error;
      }

      const assignments = data || [];
      
      // Mettre en cache
      await this.cache.setList(assignments, filters);
      
      console.log(`✅ ${assignments.length} assignations récupérées`);
      return assignments;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer les assignations d'un agent
   */
  async getByAgentId(agentId: string, filters?: AgentAssignmentFilters): Promise<AgentAssignment[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getAgentAssignments(agentId, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour assignations agent:', agentId);
        return cached;
      }

      console.log('👥 Récupération des assignations pour l\'agent:', agentId);

      const agentFilters = { ...filters, agent_id: agentId };
      const assignments = await this.getAll(agentFilters);

      // Mettre en cache spécifique à l'agent
      await this.cache.setAgentAssignments(agentId, assignments, filters);

      console.log(`✅ ${assignments.length} assignations récupérées pour l'agent`);
      return assignments;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getByAgentId:', error);
      throw error;
    }
  }

  /**
   * Récupérer une assignation par ID
   */
  async getById(id: string): Promise<AgentAssignment | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour assignation:', id);
        return cached;
      }

      console.log('👥 Récupération de l\'assignation:', id);

      const { data, error } = await supabase
        .from('agent_assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Assignation non trouvée:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de l\'assignation:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Assignation récupérée:', id);
      return data;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer une assignation avec ses détails
   */
  async getByIdWithDetails(id: string): Promise<AgentAssignmentWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour assignation avec détails:', id);
        return cached;
      }

      console.log('👥 Récupération de l\'assignation avec détails:', id);

      // Récupérer l'assignation
      const assignment = await this.getById(id);
      if (!assignment) {
        return null;
      }

      // Récupérer les détails des entités liées
      const [agentResult, assignedToResult, assignedByResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', assignment.agent_id)
          .single(),
        this.getAssignedToDetails(assignment.assigned_to_type, assignment.assigned_to_id),
        assignment.assigned_by ? supabase
          .from('profiles')
          .select('display_name')
          .eq('id', assignment.assigned_by)
          .single() : Promise.resolve({ data: null })
      ]);

      const result: AgentAssignmentWithDetails = {
        ...assignment,
        agent_name: agentResult.data?.display_name,
        assigned_to_name: assignedToResult.name,
        assigned_by_name: assignedByResult.data?.display_name,
        assignment_details: assignedToResult.details
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Assignation avec détails récupérée:', id);
      return result;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Récupérer les détails de l'entité assignée
   */
  private async getAssignedToDetails(type: string, id: string): Promise<{ name: string; details: any }> {
    try {
      let tableName = '';
      let nameField = 'name';
      
      switch (type) {
        case 'producer':
          tableName = 'producers';
          nameField = 'name';
          break;
        case 'cooperative':
          tableName = 'cooperatives';
          nameField = 'name';
          break;
        case 'plot':
          tableName = 'plots';
          nameField = 'name_season_snapshot';
          break;
        case 'farm_file':
          tableName = 'farm_files';
          nameField = 'name';
          break;
        default:
          return { name: 'Inconnu', details: {} };
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return { name: 'Inconnu', details: {} };
      }

      return {
        name: data[nameField] || 'Sans nom',
        details: data
      };

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails:', error);
      return { name: 'Erreur', details: {} };
    }
  }

  /**
   * Créer une nouvelle assignation
   */
  async create(data: AgentAssignmentCreate): Promise<AgentAssignment> {
    try {
      console.log('👥 Création d\'une nouvelle assignation:', data.agent_id);

      const { data: result, error } = await supabase
        .from('agent_assignments')
        .insert([{
          ...data,
          assigned_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de l\'assignation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateAgentAssignments(data.agent_id);
      await this.cache.invalidateByType(data.assigned_to_type);
      await this.cache.invalidateStats();

      console.log('✅ Assignation créée:', result.id);
      return result;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.create:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs assignations en lot
   */
  async createBulk(data: BulkAssignmentCreate): Promise<AgentAssignment[]> {
    try {
      console.log('👥 Création d\'assignations en lot:', data.agent_id);

      const assignments = data.assigned_to_ids.map(assignedToId => ({
        agent_id: data.agent_id,
        assigned_to_id: assignedToId,
        assigned_to_type: data.assigned_to_type,
        assigned_by: data.assigned_by,
        status: data.status || 'active',
        notes: data.notes,
        assigned_at: new Date().toISOString()
      }));

      const { data: result, error } = await supabase
        .from('agent_assignments')
        .insert(assignments)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la création des assignations:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateAgentAssignments(data.agent_id);
      await this.cache.invalidateByType(data.assigned_to_type);
      await this.cache.invalidateStats();

      console.log(`✅ ${result.length} assignations créées`);
      return result;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.createBulk:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une assignation
   */
  async update(id: string, data: AgentAssignmentUpdate): Promise<AgentAssignment> {
    try {
      console.log('👥 Mise à jour de l\'assignation:', id);

      const { data: result, error } = await supabase
        .from('agent_assignments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'assignation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateAgentAssignments(result.agent_id);
      await this.cache.invalidateStats();

      console.log('✅ Assignation mise à jour:', result.id);
      return result;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer une assignation
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('👥 Suppression de l\'assignation:', id);

      const { error } = await supabase
        .from('agent_assignments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'assignation:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStats();

      console.log('✅ Assignation supprimée:', id);

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer la charge de travail d'un agent
   */
  async getAgentWorkload(agentId: string): Promise<AgentWorkload> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getWorkload(agentId);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour charge de travail agent:', agentId);
        return cached;
      }

      console.log('👥 Récupération de la charge de travail pour l\'agent:', agentId);

      // Récupérer les assignations de l'agent
      const assignments = await this.getByAgentId(agentId, { status: 'active' });

      // Récupérer le nom de l'agent
      const { data: agentData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', agentId)
        .single();

      // Calculer les statistiques
      const producersCount = assignments.filter(a => a.assigned_to_type === 'producer').length;
      const plotsCount = assignments.filter(a => a.assigned_to_type === 'plot').length;
      const farmFilesCount = assignments.filter(a => a.assigned_to_type === 'farm_file').length;

      // Calculer le score de charge de travail (0-100)
      const totalAssignments = assignments.length;
      const workloadScore = Math.min(100, (totalAssignments / 50) * 100); // 50 assignations = 100%

      const workload: AgentWorkload = {
        agent_id: agentId,
        agent_name: agentData?.display_name || 'Agent inconnu',
        total_assignments: totalAssignments,
        active_assignments: assignments.length,
        producers_count: producersCount,
        plots_count: plotsCount,
        farm_files_count: farmFilesCount,
        last_activity: assignments[0]?.assigned_at,
        workload_score: Math.round(workloadScore)
      };

      // Mettre en cache
      await this.cache.setWorkload(agentId, workload);

      console.log(`✅ Charge de travail récupérée pour l'agent: ${workload.workload_score}%`);
      return workload;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getAgentWorkload:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des assignations
   */
  async getStats(): Promise<AgentAssignmentStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats assignations');
        return cached;
      }

      console.log('👥 Récupération des statistiques des assignations');

      const { data, error } = await supabase
        .from('agent_assignments')
        .select('agent_id, assigned_to_type, status');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const assignments = data || [];
      
      const stats: AgentAssignmentStats = {
        total_assignments: assignments.length,
        active_assignments: assignments.filter(a => a.status === 'active').length,
        inactive_assignments: assignments.filter(a => a.status === 'inactive').length,
        pending_assignments: assignments.filter(a => a.status === 'pending').length,
        cancelled_assignments: assignments.filter(a => a.status === 'cancelled').length,
        by_type: assignments.reduce((acc, a) => {
          acc[a.assigned_to_type] = (acc[a.assigned_to_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: assignments.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_agent: assignments.reduce((acc, a) => {
          acc[a.agent_id] = (acc[a.agent_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des assignations récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur AgentAssignmentsService.getStats:', error);
      throw error;
    }
  }
}

export const AgentAssignmentsServiceInstance = new AgentAssignmentsService();
