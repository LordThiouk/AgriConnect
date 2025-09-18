import { supabase } from '../lib/supabase';
import { Database } from '../../../types/database';

type Operation = Database['public']['Tables']['operations']['Row'];
type OperationInsert = Database['public']['Tables']['operations']['Insert'];
type OperationUpdate = Database['public']['Tables']['operations']['Update'];

export interface OperationFilters {
  search?: string;
  operation_type?: string;
  plot_id?: string;
  crop_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OperationsRpcService {
  static async getOperations(
    filters: OperationFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
    producerId?: string
  ): Promise<PaginatedResponse<Operation>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const offset = (pagination.page - 1) * pagination.limit;

      // Use RPC function to get operations with details
      const { data, error } = await supabase.rpc('get_operations_with_details', {
        producer_uuid: producerId || null,
        limit_count: pagination.limit,
        offset_count: offset,
        search_term: filters.search || null,
        operation_type_filter: filters.operation_type || null
      });

      if (error) {
        console.error('Error fetching operations:', error);
        throw error;
      }

      // Get total count using RPC function
      const { data: countData, error: countError } = await supabase.rpc('count_operations_for_producer', {
        producer_uuid: producerId || null,
        search_term: filters.search || null,
        operation_type_filter: filters.operation_type || null
      });

      if (countError) {
        console.error('Error counting operations:', countError);
        throw countError;
      }

      const total = countData || 0;

      // Transform the data to match our Operation interface
      const operations: Operation[] = (data || []).map((op: any) => ({
        id: op.id,
        crop_id: op.crop_id,
        plot_id: op.plot_id,
        operation_type: op.operation_type,
        operation_date: op.operation_date,
        description: op.description,
        product_used: op.product_used,
        dose_per_hectare: op.dose_per_hectare,
        total_dose: op.total_dose,
        unit: op.unit,
        cost_per_hectare: op.cost_per_hectare,
        total_cost: op.total_cost,
        performed_by: op.performer_id,
        notes: op.notes,
        created_at: op.created_at,
        updated_at: op.updated_at,
        crop: op.crop_type ? {
          id: op.crop_id,
          crop_type: op.crop_type,
          variety: op.crop_variety
        } : undefined,
        plot: op.plot_name ? {
          id: op.plot_id,
          name: op.plot_name
        } : undefined
      }));

      return {
        data: operations,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      console.error('Error in getOperations:', error);
      throw error;
    }
  }

  static async getOperationById(id: string): Promise<Operation | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.rpc('get_operations_with_details', {
        producer_uuid: null,
        limit_count: 1,
        offset_count: 0,
        search_term: null,
        operation_type_filter: null
      });

      if (error) {
        console.error('Error fetching operation:', error);
        throw error;
      }

      const operation = data?.find((op: any) => op.id === id);
      if (!operation) return null;

      return {
        id: operation.id,
        crop_id: operation.crop_id,
        plot_id: operation.plot_id,
        operation_type: operation.operation_type,
        operation_date: operation.operation_date,
        description: operation.description,
        product_used: operation.product_used,
        dose_per_hectare: operation.dose_per_hectare,
        total_dose: operation.total_dose,
        unit: operation.unit,
        cost_per_hectare: operation.cost_per_hectare,
        total_cost: operation.total_cost,
        performer_id: operation.performer_id,
        notes: operation.notes,
        created_at: operation.created_at,
        updated_at: operation.updated_at,
        crop: operation.crop_type ? {
          id: operation.crop_id,
          crop_type: operation.crop_type,
          variety: operation.crop_variety
        } : undefined,
        plot: operation.plot_name ? {
          id: operation.plot_id,
          name: operation.plot_name
        } : undefined
      };
    } catch (error) {
      console.error('Error in getOperationById:', error);
      throw error;
    }
  }

  static async createOperation(operationData: Partial<Operation>): Promise<Operation> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('operations')
        .insert([operationData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  }

  static async updateOperation(id: string, operationData: Partial<Operation>): Promise<Operation> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('operations')
        .update(operationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating operation:', error);
      throw error;
    }
  }

  static async deleteOperation(id: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting operation:', error);
      throw error;
    }
  }
}
