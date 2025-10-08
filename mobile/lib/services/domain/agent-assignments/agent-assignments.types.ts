import { Database, CacheTTL } from '../lib/types/core';

type Agentassignments = Database['public']['Tables']['agent_assignments']['Row'];
type AgentassignmentsInsert = Database['public']['Tables']['agent_assignments']['Insert'];
type AgentassignmentsUpdate = Database['public']['Tables']['agent_assignments']['Update'];

/**
 * Types pour le service AgentAssignments
 */

export interface AgentAssignment {
  id: string;
  agent_id: string;
  assigned_to_id: string;
  assigned_to_type: 'producer' | 'cooperative' | 'plot' | 'farm_file';
  assigned_at?: string;
  assigned_by?: string;
  status: 'active' | 'inactive' | 'pending' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AgentAssignmentCreate {
  agent_id: string;
  assigned_to_id: string;
  assigned_to_type: 'producer' | 'cooperative' | 'plot' | 'farm_file';
  assigned_by?: string;
  status?: 'active' | 'inactive' | 'pending' | 'cancelled';
  notes?: string;
}

export interface AgentAssignmentUpdate {
  assigned_to_id?: string;
  assigned_to_type?: 'producer' | 'cooperative' | 'plot' | 'farm_file';
  status?: 'active' | 'inactive' | 'pending' | 'cancelled';
  notes?: string;
}

export interface AgentAssignmentFilters {
  agent_id?: string;
  assigned_to_id?: string;
  assigned_to_type?: 'producer' | 'cooperative' | 'plot' | 'farm_file';
  status?: 'active' | 'inactive' | 'pending' | 'cancelled';
  assigned_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface AgentAssignmentStats {
  total_assignments: number;
  active_assignments: number;
  inactive_assignments: number;
  pending_assignments: number;
  cancelled_assignments: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_agent: Record<string, number>;
}

export interface AgentAssignmentWithDetails extends AgentAssignment {
  agent_name?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
  assignment_details?: {
    producer_name?: string;
    cooperative_name?: string;
    plot_name?: string;
    farm_file_name?: string;
  };
}

export interface AgentWorkload {
  agent_id: string;
  agent_name: string;
  total_assignments: number;
  active_assignments: number;
  producers_count: number;
  plots_count: number;
  farm_files_count: number;
  last_activity?: string;
  workload_score: number; // 0-100
}

export interface AssignmentHistory {
  id: string;
  assignment_id: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated' | 'cancelled';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  performed_by: string;
  performed_at: string;
  notes?: string;
}

export interface BulkAssignmentCreate {
  agent_id: string;
  assigned_to_ids: string[];
  assigned_to_type: 'producer' | 'cooperative' | 'plot' | 'farm_file';
  assigned_by?: string;
  status?: 'active' | 'inactive' | 'pending' | 'cancelled';
  notes?: string;
}
