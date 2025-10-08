import { Database, CacheTTL } from '../../../../lib/types/core';

type Operations = Database['public']['Tables']['operations']['Row'];
type OperationsInsert = Database['public']['Tables']['operations']['Insert'];
type OperationsUpdate = Database['public']['Tables']['operations']['Update'];

/**
 * Types pour le service des opérations
 */



export interface OperationDisplay extends Operations {
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  operator_name?: string;
}

export interface OperationFilters {
  plot_id?: string;
  crop_id?: string;
  operation_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface OperationSort {
  field: 'operation_type' | 'operation_date' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface OperationCreateData {
  plot_id: string;
  crop_id?: string;
  operation_type: string;
  operation_date: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  status: string;
  created_by: string | null;
}

export interface OperationUpdateData {
  operation_type?: string;
  operation_date?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  status?: string;
}

export interface OperationCacheKey {
  plot: `operations:plot:${string}`;
  crop: `operations:crop:${string}`;
  operation: `operation:${string}`;
  latest: `latestoperations:plot:${string}`;
}

export interface OperationServiceOptions {
  useCache?: boolean;
  cacheTTL?: CacheTTL;
  refreshCache?: boolean;
}
