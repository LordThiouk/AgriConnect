import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const useMockData = APP_CONFIG.USE_MOCK_DATA;

let supabase: any = null;
if (!useMockData && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface Operation {
  id: string;
  crop_id: string;
  plot_id: string;
  operation_type: 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance';
  operation_date: string;
  description?: string;
  product_used?: string;
  dose_per_hectare?: number;
  total_dose?: number;
  unit?: 'kg' | 'l' | 'pieces' | 'other';
  cost_per_hectare?: number;
  total_cost?: number;
  performer_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  crop?: {
    id: string;
    crop_type: string;
    variety: string;
  };
  plot?: {
    id: string;
    name: string;
  };
  performer?: string; // UUID of the user who performed the operation
}

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

export interface OperationsResponse {
  data: Operation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OperationsService {
  static async getOperations(
    filters: OperationFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
    producerId?: string
  ): Promise<OperationsResponse> {
    try {
      if (useMockData) {
        // Mock data for development
        const mockOperations: Operation[] = [
          {
            id: '1',
            crop_id: 'crop-1',
            plot_id: 'plot-1',
            operation_type: 'semis',
            operation_date: '2024-01-15',
            description: 'Semis de maïs',
            product_used: 'Graines de maïs',
            dose_per_hectare: 25,
            total_dose: 75,
            unit: 'kg',
            cost_per_hectare: 15000,
            total_cost: 45000,
            performer_id: 'agent-1',
            notes: 'Semis effectué avec succès',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          }
        ];

        return {
          data: mockOperations,
          total: mockOperations.length,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: 1
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get total count with filters
      let countQuery = supabase
        .from('operations')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`description.ilike.%${filters.search}%,product_used.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters.operation_type) {
        countQuery = countQuery.eq('operation_type', filters.operation_type);
      }

      if (filters.plot_id) {
        countQuery = countQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_id) {
        countQuery = countQuery.eq('crop_id', filters.crop_id);
      }

      if (filters.date_from) {
        countQuery = countQuery.gte('operation_date', filters.date_from);
      }

      if (filters.date_to) {
        countQuery = countQuery.lte('operation_date', filters.date_to);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting operations:', countError);
        throw countError;
      }

      // Get the actual data with pagination
      let dataQuery = supabase
        .from('operations')
        .select(`
          *,
          crop:crops(id, crop_type, variety),
          plot:plots(id, name)
        `);

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`description.ilike.%${filters.search}%,product_used.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters.operation_type) {
        dataQuery = dataQuery.eq('operation_type', filters.operation_type);
      }

      if (filters.plot_id) {
        dataQuery = dataQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_id) {
        dataQuery = dataQuery.eq('crop_id', filters.crop_id);
      }

      if (filters.date_from) {
        dataQuery = dataQuery.gte('operation_date', filters.date_from);
      }

      if (filters.date_to) {
        dataQuery = dataQuery.lte('operation_date', filters.date_to);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      dataQuery = dataQuery.range(from, to).order('operation_date', { ascending: false });

      const { data, error } = await dataQuery;

      if (error) throw error;

      const totalPages = Math.ceil((count || 0) / pagination.limit);

      return {
        data: data || [],
        total: count || 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching operations:', error);
      throw error;
    }
  }

  static async getOperationById(id: string): Promise<Operation> {
    try {
      if (useMockData) {
        // Return mock data
        return {
          id,
          crop_id: 'crop-1',
          plot_id: 'plot-1',
          operation_type: 'semis',
          operation_date: '2024-01-15',
          description: 'Semis de maïs',
          product_used: 'Graines de maïs',
          dose_per_hectare: 25,
          total_dose: 75,
          unit: 'kg',
          cost_per_hectare: 15000,
          total_cost: 45000,
          performer_id: 'agent-1',
          notes: 'Semis effectué avec succès',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('operations')
        .select(`
          *,
          crop:crops(id, crop_type, variety),
          plot:plots(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching operation:', error);
      throw error;
    }
  }

  static async createOperation(operationData: Partial<Operation>): Promise<Operation> {
    try {
      if (useMockData) {
        // Return mock created operation
        return {
          id: 'new-operation-id',
          ...operationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Operation;
      }

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
      if (useMockData) {
        // Return mock updated operation
        return {
          id,
          ...operationData,
          updated_at: new Date().toISOString()
        } as Operation;
      }

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
      if (useMockData) {
        // Mock deletion
        return;
      }

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

  static async getFilterOptions(): Promise<{ operation_types: string[]; units: string[] }> {
    try {
      if (useMockData) {
        return {
          operation_types: ['semis', 'fertilisation', 'irrigation', 'desherbage', 'phytosanitaire', 'recolte', 'labour', 'reconnaissance'],
          units: ['kg', 'l', 'pieces', 'other']
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      return {
        operation_types: ['semis', 'fertilisation', 'irrigation', 'desherbage', 'phytosanitaire', 'recolte', 'labour', 'reconnaissance'],
        units: ['kg', 'l', 'pieces', 'other']
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}
