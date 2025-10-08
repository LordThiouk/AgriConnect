import { supabase } from '../lib/supabase';
import { 
  Agent, 
  AgentFilters, 
  AgentPerformance, 
  AgentStats, 
  Producer,
  CreateAgentData,
  UpdateAgentData,
  AgentAssignment,
  CreateAgentAssignmentData,
  AgentAssignmentStats,
  AvailableAgent
} from '../types';
import { Database } from '../types/database';

type SupabaseClient = ReturnType<typeof supabase.rpc>;

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
      query = (query as any).or(`display_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters.region) {
      query = (query as any).eq('region', filters.region);
    }
    if (filters.department) {
      query = (query as any).eq('department', filters.department);
    }
    if (filters.commune) {
      query = (query as any).eq('commune', filters.commune);
    }
      // Note: cooperative filtering is now handled via agent_assignments table
      if (filters.is_active !== undefined) {
        query = (query as any).eq('is_active', filters.is_active);
      }
      if (filters.approval_status) {
        query = (query as any).eq('approval_status', filters.approval_status);
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
          user_id: agentData.user_id,
          display_name: agentData.display_name,
          phone: agentData.phone,
          region: agentData.region,
          department: agentData.department,
          commune: agentData.commune,
          role: 'agent',
          is_active: agentData.is_active ?? true,
          approval_status: agentData.approval_status ?? 'pending'
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating agent:', error);
        throw new Error(`Erreur lors de la création de l'agent: ${error.message}`);
      }

      return data as unknown as Agent;
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
      const allowedFields = {
        display_name: updateData.display_name,
        phone: updateData.phone,
        region: updateData.region,
        department: updateData.department,
        commune: updateData.commune,
        is_active: updateData.is_active,
        approval_status: updateData.approval_status
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

      // Use RPC function to bypass RLS restrictions
      const { data: updatedAgent, error: rpcError } = await (supabase as any).rpc('update_agent_profile', {
        agent_id_param: id,
        display_name_param: cleanData.display_name || null,
        phone_param: cleanData.phone || null,
        region_param: cleanData.region || null,
        department_param: cleanData.department || null,
        commune_param: cleanData.commune || null,
        is_active_param: cleanData.is_active ?? null,
        approval_status_param: cleanData.approval_status || null
      });

      console.log('RPC Update result:', { updatedAgent, rpcError });

      if (rpcError) {
        console.error('Error updating agent via RPC:', rpcError);
        throw new Error(`Erreur lors de la mise à jour de l'agent: ${rpcError.message}`);
      }

      if (!updatedAgent || updatedAgent.length === 0) {
        throw new Error(`Aucune donnée retournée après la mise à jour de l'agent ${id}`);
      }

      // Note: Cooperative assignments are now handled separately via agent_assignments table

      return updatedAgent[0] as unknown as Agent;
    } catch (error) {
      console.error('AgentsService.updateAgent error:', error);
      throw error;
    }
  }

  /**
   * Assigne un agent à une coopérative via la nouvelle table agent_assignments
   */
  static async assignAgentToCooperative(agentId: string, cooperativeId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('assign_agent_to_cooperative', {
        p_agent_id: agentId,
        p_cooperative_id: cooperativeId
      });

      if (error) {
        console.error('Error assigning agent to cooperative:', error);
        throw new Error(`Erreur lors de l'assignation à la coopérative: ${error.message}`);
      }

      return data === true;
    } catch (error) {
      console.error('AgentsService.assignAgentToCooperative error:', error);
      throw error;
    }
  }

  /**
   * Assigne un agent à un producteur via la nouvelle table agent_assignments
   */
  static async assignAgentToProducer(agentId: string, producerId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('assign_agent_to_producer', {
        p_agent_id: agentId,
        p_producer_id: producerId
      });

      if (error) {
        console.error('Error assigning agent to producer:', error);
        throw new Error(`Erreur lors de l'assignation au producteur: ${error.message}`);
      }

      return data === true;
    } catch (error) {
      console.error('AgentsService.assignAgentToProducer error:', error);
      throw error;
    }
  }

  /**
   * Supprime une assignation d'agent
   */
  static async removeAgentAssignment(assignmentId: string): Promise<boolean> {
    try {
      const { data, error } = await (supabase as any).rpc('remove_agent_assignment', {
        assignment_id_param: assignmentId
      });

      if (error) {
        console.error('Error removing agent assignment:', error);
        throw new Error(`Erreur lors de la suppression de l'assignation: ${error.message}`);
      }

      return data === true;
    } catch (error) {
      console.error('AgentsService.removeAgentAssignment error:', error);
      throw error;
    }
  }

  /**
   * Récupère les assignations d'un agent
   */
  static async getAgentAssignments(agentId: string): Promise<AgentAssignment[]> {
    try {
      const { data, error } = await (supabase as any).rpc('get_agent_assignments', {
        p_agent_id: agentId
      });

      if (error) {
        console.error('Error fetching agent assignments:', error);
        throw new Error(`Erreur lors de la récupération des assignations: ${error.message}`);
      }

      return (data || []).map((assignment: any) => ({
        id: assignment.id,
        agent_id: agentId,
        assigned_to_type: assignment.assigned_to_type,
        assigned_to_id: assignment.assigned_to_id,
        assigned_at: assignment.assigned_at,
        assigned_by: assignment.assigned_by,
        assigned_by_name: assignment.assigned_by_name,
        created_at: assignment.assigned_at,
        updated_at: assignment.assigned_at,
        assigned_to_name: assignment.assigned_to_name,
        // Champs supplémentaires pour l'affichage
        name: assignment.name,
        display_name: assignment.display_name,
        first_name: assignment.first_name,
        last_name: assignment.last_name,
        phone: assignment.phone,
        region: assignment.region
      }));
    } catch (error) {
      console.error('AgentsService.getAgentAssignments error:', error);
      throw error;
    }
  }

  /**
   * Récupère les coopératives d'un agent
   */
  static async getAgentCooperatives(agentId: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any).rpc('get_agent_cooperatives', {
        p_agent_id: agentId
      });

      if (error) {
        console.error('Error fetching agent cooperatives:', error);
        throw new Error(`Erreur lors de la récupération des coopératives: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AgentsService.getAgentCooperatives error:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des assignations
   */
  static async getAgentAssignmentStats(): Promise<AgentAssignmentStats> {
    try {
      const { data, error } = await (supabase as any).rpc('get_agent_assignments_stats');

      if (error) {
        console.error('Error fetching assignment stats:', error);
        throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
      }

      const stats = Array.isArray(data) && data.length > 0 ? data[0] : {
        total_assignments: 0,
        producer_assignments: 0,
        cooperative_assignments: 0,
        recent_assignments: 0
      };

      return {
        total_assignments: Number(stats.total_assignments) || 0,
        producer_assignments: Number(stats.producer_assignments) || 0,
        cooperative_assignments: Number(stats.cooperative_assignments) || 0,
        recent_assignments: Number(stats.recent_assignments) || 0
      };
    } catch (error) {
      console.error('AgentsService.getAgentAssignmentStats error:', error);
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
        total_operations: 0,
        total_observations: 0,
        visits_this_month: 0,
        avg_visits_per_producer: 0,
        last_visit_date: null,
        data_completion_rate: 0,
        photos_per_plot: 0,
        gps_accuracy_rate: 0,
        avg_visit_duration: 0,
        avg_data_entry_time: 0,
        sync_success_rate: 0,
        avg_visits_per_month: 0,
        data_quality_rate: 0
      };

      return {
        totalProducers: Number(performance.total_producers) || 0,
        totalVisits: Number(performance.total_visits) || 0,
        totalPlots: Number(performance.total_plots) || 0,
        totalOperations: Number(performance.total_operations) || 0,
        totalObservations: Number(performance.total_observations) || 0,
        visitsThisMonth: Number(performance.visits_this_month) || 0,
        avgVisitsPerProducer: Number(performance.avg_visits_per_producer) || 0,
        lastSyncDate: performance.last_visit_date ? new Date(performance.last_visit_date).toISOString() : null,
        dataCompletionRate: Number(performance.data_completion_rate) || 0,
        photosPerPlot: Number(performance.photos_per_plot) || 0,
        gpsAccuracyRate: Number(performance.gps_accuracy_rate) || 0,
        avgVisitDuration: Number(performance.avg_visit_duration) || 0,
        avgDataEntryTime: Number(performance.avg_data_entry_time) || 0,
        syncSuccessRate: Number(performance.sync_success_rate) || 0,
        avgVisitsPerMonth: Number(performance.avg_visits_per_month) || 0,
        dataQualityRate: Number(performance.data_quality_rate) || 0
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
   * Récupère les producteurs assignés à un agent (unifié)
   */
  static async getAgentProducers(agentId: string): Promise<{ data: any[]; total: number }> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_agent_producers_unified', { p_agent_id: agentId });

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
   * Récupère tous les producteurs disponibles (avec statut d'assignation)
   */
  static async getAvailableProducers(agentId?: string): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_available_producers_for_agent', { p_agent_id: agentId || null });

      if (error) {
        console.error('Error fetching available producers:', error);
        throw new Error(`Erreur lors de la récupération des producteurs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AgentsService.getAvailableProducers error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les coopératives disponibles
   */
  static async getAvailableCooperatives(agentId?: string): Promise<any[]> {
    try {
      // Pour l'instant, récupérer toutes les coopératives
      // TODO: Ajouter une RPC pour filtrer les coopératives déjà assignées
      const { data, error } = await supabase
        .from('cooperatives')
        .select('*');

      if (error) {
        console.error('Error fetching available cooperatives:', error);
        throw new Error(`Erreur lors de la récupération des coopératives: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('AgentsService.getAvailableCooperatives error:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les agents disponibles avec leurs assignations
   */
  static async getAvailableAgents(): Promise<AvailableAgent[]> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_available_agents');

      if (error) {
        console.error('Error fetching available agents:', error);
        throw new Error(`Erreur lors de la récupération des agents: ${error.message}`);
      }

      return (data || []).map((agent: any) => ({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        region: agent.region,
        cooperative_name: agent.cooperative_name,
        total_assigned_producers: Number(agent.total_assigned_producers) || 0
      }));
    } catch (error) {
      console.error('AgentsService.getAvailableAgents error:', error);
      throw error;
    }
  }

  /**
   * Récupère les agents assignés à un producteur (unifié)
   */
  static async getAssignedAgentsForProducer(producerId: string): Promise<Agent[]> {
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_assigned_agents_for_producer', {
          p_producer_id: producerId
        });

      if (error) {
        console.error('Error fetching assigned agents for producer:', error);
        throw new Error(`Erreur lors de la récupération des agents assignés: ${error.message}`);
      }

      // Transform the data to match Agent interface
      return (data || []).map((agent: any) => ({
        id: agent.agent_id,
        user_id: agent.user_id || '',
        display_name: agent.agent_name,
        phone: agent.phone || 'Non disponible',
        region: agent.region || '',
        department: agent.department || '',
        commune: agent.commune || '',
        is_active: agent.is_active || true,
        approval_status: agent.approval_status || 'approved',
        created_at: agent.created_at || '',
        updated_at: agent.updated_at || '',
        assigned_at: agent.assigned_at,
        assignment_type: agent.assignment_type
      })) as Agent[];
    } catch (error) {
      console.error('AgentsService.getAssignedAgentsForProducer error:', error);
      throw error;
    }
  }

  /**
   * Désassigne un producteur d'un agent (unifié)
   */
  static async unassignProducerFromAgent(producerId: string, agentId: string): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .rpc('remove_agent_assignment', {
          p_agent_id: agentId,
          p_assigned_to_type: 'producer',
          p_assigned_to_id: producerId
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
