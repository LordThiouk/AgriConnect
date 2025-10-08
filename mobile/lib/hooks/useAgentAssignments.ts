/**
 * Hook pour la gestion des assignations d'agents
 */

import { useState, useEffect, useCallback } from 'react';
import { AgentAssignmentsServiceInstance as agentAssignmentsService } from '../services/domain/agent-assignments';
import { AgentAssignment, AgentAssignmentFilters } from '../services/domain/agent-assignments/agent-assignments.types';

export interface UseAgentAssignmentsOptions {
  agentId?: string;
  filters?: AgentAssignmentFilters;
  enabled?: boolean;
  refetchOnMount?: boolean;
}

export interface UseAgentAssignmentsReturn {
  assignments: AgentAssignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  producersCount: number;
  cooperativesCount: number;
  totalAssignments: number;
}

/**
 * Hook pour récupérer les assignations d'un agent
 */
export function useAgentAssignments(options: UseAgentAssignmentsOptions = {}): UseAgentAssignmentsReturn {
  const { agentId, filters, enabled = true, refetchOnMount = true } = options;
  
  const [assignments, setAssignments] = useState<AgentAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!agentId || !enabled) {
      console.log('👥 [useAgentAssignments] AgentId ou enabled manquant:', { agentId, enabled });
      setAssignments([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('👥 [useAgentAssignments] Récupération des assignations pour l\'agent:', agentId);
      
      const data = await agentAssignmentsService.getByAgentId(agentId, filters);
      setAssignments(data);
      
      console.log('✅ [useAgentAssignments] Assignations récupérées:', data.length);
      console.log('📊 [useAgentAssignments] Détails des assignations:', data.slice(0, 3));
    } catch (err: any) {
      console.error('❌ [useAgentAssignments] Erreur:', err);
      setError(err.message || 'Erreur lors de la récupération des assignations');
    } finally {
      setLoading(false);
    }
  }, [agentId, filters, enabled]);

  // Calculer les statistiques
  const producersCount = assignments.filter(a => a.assigned_to_type === 'producer').length;
  const cooperativesCount = assignments.filter(a => a.assigned_to_type === 'cooperative').length;
  const totalAssignments = assignments.length;

  // Effet pour charger les données
  useEffect(() => {
    if (refetchOnMount) {
      fetchAssignments();
    }
  }, [fetchAssignments, refetchOnMount]);

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    producersCount,
    cooperativesCount,
    totalAssignments
  };
}

/**
 * Hook pour récupérer les statistiques des assignations d'un agent
 */
export function useAgentAssignmentStats(agentId?: string) {
  const { assignments, loading, error, refetch } = useAgentAssignments({ 
    agentId, 
    enabled: !!agentId 
  });

  const stats = {
    totalAssignments: assignments.length,
    producersCount: assignments.filter(a => a.assigned_to_type === 'producer').length,
    cooperativesCount: assignments.filter(a => a.assigned_to_type === 'cooperative').length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
    inactiveAssignments: assignments.filter(a => a.status === 'inactive').length
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
}