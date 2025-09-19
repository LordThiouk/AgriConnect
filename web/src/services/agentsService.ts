import { supabase } from '../lib/supabase';
import { Agent, AgentFilters, AgentPerformance, AgentStats, Producer } from '../types';
import { Database } from '../types/database';

type SupabaseClient = ReturnType<typeof supabase.rpc>;

export interface CreateAgentData {
  display_name: string;
  phone: string;
  email?: string;
  region?: string;
  department?: string;
  commune?: string;
  cooperative_id?: string;
  is_active?: boolean;
}

export interface UpdateAgentData extends Partial<CreateAgentData> {
  id: string;
}

export class AgentsService {
  /**
   * Récupère la liste des agents avec filtres et pagination
   */
  static async getAgents(
    filters: AgentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Agent[]; total: number; totalPages: number }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'agent');

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(`display_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.commune) {
        query = query.eq('commune', filters.commune);
      }
      if (filters.cooperative_id) {
        query = query.eq('cooperative', filters.cooperative_id);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.approval_status) {
        query = query.eq('approval_status', filters.approval_status);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Tri par nom
      query = query.order('display_name', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching agents:', error);
        throw new Error(`Erreur lors de la récupération des agents: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: (data || []) as unknown as Agent[],
        total: count || 0,
        totalPages
      };
    } catch (error) {
      console.error('AgentsService.getAgents error:', error);
      throw error;
    }
  }

  /**
   * Récupère un agent par son ID
   */
  static async getAgentById(id: string): Promise<Agent> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'agent')
        .single();

      if (error) {
        console.error('Error fetching agent:', error);
        throw new Error(`Erreur lors de la récupération de l'agent: ${error.message}`);
      }

      return data as unknown as Agent;
    } catch (error) {
      console.error('AgentsService.getAgentById error:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel agent
   */
  static async createAgent(agentData: CreateAgentData): Promise<Agent> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          display_name: agentData.display_name,
          phone: agentData.phone,
          email: agentData.email,
          region: agentData.region,
          role: 'agent'
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating agent:', error);
        throw new Error(`Erreur lors de la création de l'agent: ${error.message}`);
      }

      return { ...data, is_active: true, approval_status: 'pending' } as unknown as Agent;
    } catch (error) {
      console.error('AgentsService.createAgent error:', error);
      throw error;
    }
  }

  /**
   * Met à jour un agent
   */
  static async updateAgent(agentData: UpdateAgentData): Promise<Agent> {
    try {
      const { id, ...updateData } = agentData;
      
      // Only update fields that are allowed by RLS
      // Note: cooperative is not a direct field in profiles, it's managed via agent_producer_assignments
      const allowedFields = {
        display_name: updateData.display_name,
        phone: updateData.phone,
        email: updateData.email,
        region: updateData.region
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
      );
      
      // First check if the agent exists (without .single() to avoid error)
      const { data: existingAgents, error: checkError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', id);

      console.log('Checking agent existence:', { id, existingAgents, checkError });

      if (checkError) {
        throw new Error(`Erreur lors de la vérification de l'agent: ${checkError.message}`);
      }

      if (!existingAgents || existingAgents.length === 0) {
        throw new Error(`Agent avec l'ID ${id} non trouvé`);
      }

      if (existingAgents[0].role !== 'agent') {
        throw new Error(`L'utilisateur avec l'ID ${id} n'est pas un agent (rôle: ${existingAgents[0].role})`);
      }

      console.log('Updating agent with data:', { id, cleanData });

      // Use RPC function to bypass RLS restrictions (email column doesn't exist in profiles table)
      const { data: updatedAgent, error: rpcError } = await (supabase as any).rpc('update_agent_profile', {
        agent_id_param: id,
        display_name_param: cleanData.display_name || null,
        phone_param: cleanData.phone || null,
        region_param: cleanData.region || null
      });

      console.log('RPC Update result:', { updatedAgent, rpcError });

      if (rpcError) {
        console.error('Error updating agent via RPC:', rpcError);
        throw new Error(`Erreur lors de la mise à jour de l'agent: ${rpcError.message}`);
      }

      if (!updatedAgent || updatedAgent.length === 0) {
        throw new Error(`Aucune donnée retournée après la mise à jour de l'agent ${id}`);
      }

      // If cooperative assignment was provided, handle it separately
      if (updateData.cooperative && updateData.cooperative !== 'none') {
        await this.assignAgentToCooperative(id, updateData.cooperative);
      }

      return updatedAgent[0] as unknown as Agent;
    } catch (error) {
      console.error('AgentsService.updateAgent error:', error);
      throw error;
    }
  }

  /**
   * Assigne un agent à une coopérative
   */
  static async assignAgentToCooperative(agentId: string, cooperativeId: string): Promise<void> {
    try {
      // Check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from('agent_producer_assignments')
        .select('id')
        .eq('agent_id', agentId)
        .eq('cooperative_id', cooperativeId)
        .single();

      if (!existingAssignment) {
        // Create new assignment
        const { error } = await supabase
          .from('agent_producer_assignments')
          .insert({
            agent_id: agentId,
            cooperative_id: cooperativeId,
            assigned_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error assigning agent to cooperative:', error);
          throw new Error(`Erreur lors de l'assignation à la coopérative: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('AgentsService.assignAgentToCooperative error:', error);
      throw error;
    }
  }

  /**
   * Supprime un agent
   */
  static async deleteAgent(id: string): Promise<void> {
    try {
      // Use RPC function to handle cascade deletion properly
      const { data, error } = await (supabase as any)
        .rpc('delete_agent_profile', { agent_id_param: id });

      if (error) {
        console.error('Error deleting agent via RPC:', error);
        throw new Error(`Erreur lors de la suppression de l'agent: ${error.message}`);
      }

      if (!data) {
        throw new Error('La suppression de l\'agent a échoué');
      }

      console.log('Agent deleted successfully:', id);
    } catch (error) {
      console.error('AgentsService.deleteAgent error:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques globales des agents
   */
  static async getAgentsStats(): Promise<AgentStats> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_agents_stats');

      if (error) {
        console.error('Error fetching agents stats:', error);
        throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
      }

      // La fonction RPC retourne un tableau, on prend le premier élément
      const stats = Array.isArray(data) && data.length > 0 ? data[0] : {
        totalAgents: 0,
        activeAgents: 0,
        totalProducers: 0,
        totalVisits: 0,
        avgVisitsPerAgent: 0,
        dataQualityRate: 0
      };

      return stats ? {
        totalAgents: Number(stats.total_agents) || 0,
        activeAgents: Number(stats.active_agents) || 0,
        totalProducers: Number(stats.total_producers) || 0,
        totalVisits: Number(stats.total_visits) || 0,
        avgVisitsPerAgent: Number(stats.avg_visits_per_agent) || 0,
        dataQualityRate: Number(stats.data_quality_rate) || 0
      } : {
        totalAgents: 0,
        activeAgents: 0,
        totalProducers: 0,
        totalVisits: 0,
        avgVisitsPerAgent: 0,
        dataQualityRate: 0
      };
    } catch (error) {
      console.error('AgentsService.getAgentsStats error:', error);
      throw error;
    }
  }

  /**
   * Récupère les performances d'un agent
   */
  static async getAgentPerformance(agentId: string): Promise<AgentPerformance> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_agent_performance', { agent_id_param: agentId });

      if (error) {
        console.error('Error fetching agent performance:', error);
        throw new Error(`Erreur lors de la récupération des performances: ${error.message}`);
      }

      // La fonction RPC retourne un tableau, on prend le premier élément
      const performance = Array.isArray(data) && data.length > 0 ? data[0] : {
        total_visits: 0,
        total_producers: 0,
        total_plots: 0,
        avg_visits_per_month: 0,
        data_quality_rate: 0
      };

      return performance ? {
        totalProducers: Number(performance.total_producers) || 0,
        totalVisits: Number(performance.total_visits) || 0,
        totalPlots: Number(performance.total_plots) || 0,
        totalOperations: Number(performance.total_operations) || 0,
        totalObservations: Number(performance.total_observations) || 0,
        visitsThisMonth: Number(performance.visits_this_month) || 0,
        avgVisitsPerProducer: Number(performance.avg_visits_per_producer) || 0,
        lastSyncDate: performance.last_sync_date ? new Date(performance.last_sync_date).toISOString() : null,
        dataCompletionRate: Number(performance.data_completion_rate) || 0,
        photosPerPlot: Number(performance.photos_per_plot) || 0,
        gpsAccuracyRate: Number(performance.gps_accuracy_rate) || 0,
        avgVisitDuration: Number(performance.avg_visit_duration) || 0,
        avgDataEntryTime: Number(performance.avg_data_entry_time) || 0,
        syncSuccessRate: Number(performance.sync_success_rate) || 0,
        avgVisitsPerMonth: Number(performance.avg_visits_per_month) || 0,
        dataQualityRate: Number(performance.data_quality_rate) || 0
      } : {
        totalProducers: 0,
        totalVisits: 0,
        totalPlots: 0,
        totalOperations: 0,
        totalObservations: 0,
        visitsThisMonth: 0,
        avgVisitsPerProducer: 0,
        lastSyncDate: null,
        dataCompletionRate: 0,
        photosPerPlot: 0,
        gpsAccuracyRate: 0,
        avgVisitDuration: 0,
        avgDataEntryTime: 0,
        syncSuccessRate: 0,
        avgVisitsPerMonth: 0,
        dataQualityRate: 0
      };
    } catch (error) {
      console.error('AgentsService.getAgentPerformance error:', error);
      throw error;
    }
  }

  /**
   * Approuve ou rejette un agent
   */
  static async updateAgentApproval(agentId: string, approvalStatus: 'approved' | 'rejected'): Promise<Agent> {
    try {
      console.log('updateAgentApproval - Updating agent with ID:', agentId, 'to status:', approvalStatus);

      // Use RPC function to update agent approval status
      const { data, error } = await (supabase as any)
        .rpc('update_agent_approval_status', {
          agent_id_param: agentId,
          approval_status_param: approvalStatus
        });

      if (error) {
        console.error('Error updating agent approval via RPC:', error);
        throw new Error(`Erreur lors de la mise à jour du statut d'approbation: ${error.message}`);
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Agent avec l'ID ${agentId} non trouvé ou n'est pas un agent`);
      }

      console.log('Update successful via RPC:', data[0]);
      return data[0] as Agent;
    } catch (error) {
      console.error('AgentsService.updateAgentApproval error:', error);
      throw error;
    }
  }

  /**
   * Récupère les options de filtres
   */
  static async getFilterOptions(): Promise<{
    regions: string[];
    departments: string[];
    communes: string[];
    cooperatives: { id: string; name: string }[];
  }> {
    try {
      const [regionsResult, cooperativesResult] = await Promise.all([
        supabase.from('profiles').select('region').eq('role', 'agent').not('region', 'is', null),
        supabase.from('cooperatives').select('id, name')
      ]);

      const regions = [...new Set(regionsResult.data?.map(r => r.region).filter(Boolean) || [])];
      const departments: string[] = []; // Colonne n'existe pas dans profiles
      const communes: string[] = []; // Colonne n'existe pas dans profiles
      const cooperatives = cooperativesResult.data || [];

      return {
        regions: regions.sort(),
        departments: departments.sort(),
        communes: communes.sort(),
        cooperatives
      };
    } catch (error) {
      console.error('AgentsService.getFilterOptions error:', error);
      throw error;
    }
  }

  /**
   * Récupère les producteurs assignés à un agent
   */
  static async getAgentProducers(agentId: string): Promise<{ data: any[]; total: number }> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_agent_producers', { agent_id_param: agentId });

      if (error) {
        console.error('Error fetching agent producers:', error);
        throw new Error(`Erreur lors de la récupération des producteurs: ${error.message}`);
      }

      return {
        data: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0
      };
    } catch (error) {
      console.error('AgentsService.getAgentProducers error:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les producteurs disponibles (non assignés)
   */
  static async getAvailableProducers(): Promise<Producer[]> {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('is_active', true)
        .order('first_name');

      if (error) {
        console.error('Error fetching available producers:', error);
        throw new Error(`Erreur lors de la récupération des producteurs: ${error.message}`);
      }

      return (data || []) as unknown as Producer[];
    } catch (error) {
      console.error('AgentsService.getAvailableProducers error:', error);
      throw error;
    }
  }

  /**
   * Assigne un producteur à un agent
   */
  static async assignProducerToAgent(producerId: string, agentId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .rpc('assign_producer_to_agent', {
          producer_id_param: producerId,
          agent_id_param: agentId
        });

      if (error) {
        console.error('Error assigning producer to agent:', error);
        throw new Error(`Erreur lors de l'assignation: ${error.message}`);
      }
    } catch (error) {
      console.error('AgentsService.assignProducerToAgent error:', error);
      throw error;
    }
  }

  /**
   * Désassigne un producteur d'un agent
   */
  static async unassignProducerFromAgent(producerId: string, agentId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .rpc('unassign_producer_from_agent', {
          producer_id_param: producerId,
          agent_id_param: agentId
        });

      if (error) {
        console.error('Error unassigning producer from agent:', error);
        throw new Error(`Erreur lors de la désassignation: ${error.message}`);
      }
    } catch (error) {
      console.error('AgentsService.unassignProducerFromAgent error:', error);
      throw error;
    }
  }

  /**
   * Récupère les coopératives pour les formulaires
   */
  static async getCooperatives(): Promise<Array<{id: string, name: string}>> {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching cooperatives:', error);
        throw new Error(`Erreur lors de la récupération des coopératives: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AgentsService.getCooperatives error:', error);
      throw error;
    }
  }
}
