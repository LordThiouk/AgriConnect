import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const useMockData = APP_CONFIG.USE_MOCK_DATA;

let supabase: any = null;
if (!useMockData && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface Observation {
  id: string;
  crop_id: string;
  plot_id: string;
  observation_date: string;
  observation_type: 'levée' | 'maladie' | 'ravageur' | 'stress_hydrique' | 'stress_nutritionnel' | 'développement' | 'other';
  emergence_percent?: number;
  pest_disease_name?: string;
  severity?: number; // 1=low, 5=critical
  affected_area_percent?: number;
  description?: string;
  recommendations?: string;
  observed_by?: string;
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
  observer?: string; // UUID of the user who made the observation
}

export interface ObservationFilters {
  search?: string;
  observation_type?: string;
  plot_id?: string;
  crop_id?: string;
  date_from?: string;
  date_to?: string;
  severity?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ObservationsResponse {
  data: Observation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ObservationsService {
  static async getObservations(
    filters: ObservationFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ObservationsResponse> {
    try {
      if (useMockData) {
        // Mock data for development
        const mockObservations: Observation[] = [
          {
            id: '1',
            crop_id: 'crop-1',
            plot_id: 'plot-1',
            observation_date: '2024-01-15',
            observation_type: 'levée',
            emergence_percent: 85,
            description: 'Bonne levée du maïs',
            recommendations: 'Continuer le suivi',
            observed_by: 'agent-1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            crop_id: 'crop-1',
            plot_id: 'plot-1',
            observation_date: '2024-01-20',
            observation_type: 'maladie',
            pest_disease_name: 'Rouille du maïs',
            severity: 3,
            affected_area_percent: 15.5,
            description: 'Apparition de taches de rouille sur les feuilles',
            recommendations: 'Traiter avec fongicide approprié',
            observed_by: 'agent-1',
            created_at: '2024-01-20T14:30:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          }
        ];

        return {
          data: mockObservations,
          total: mockObservations.length,
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
        .from('observations')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`description.ilike.%${filters.search}%,pest_disease_name.ilike.%${filters.search}%,recommendations.ilike.%${filters.search}%`);
      }

      if (filters.observation_type) {
        countQuery = countQuery.eq('observation_type', filters.observation_type);
      }

      if (filters.plot_id) {
        countQuery = countQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_id) {
        countQuery = countQuery.eq('crop_id', filters.crop_id);
      }

      if (filters.date_from) {
        countQuery = countQuery.gte('observation_date', filters.date_from);
      }

      if (filters.date_to) {
        countQuery = countQuery.lte('observation_date', filters.date_to);
      }

      if (filters.severity) {
        countQuery = countQuery.eq('severity', filters.severity);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting observations:', countError);
        throw countError;
      }

      // Get the actual data with pagination
      let dataQuery = supabase
        .from('observations')
        .select(`
          *,
          crop:crops(id, crop_type, variety),
          plot:plots(id, name)
        `);

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`description.ilike.%${filters.search}%,pest_disease_name.ilike.%${filters.search}%,recommendations.ilike.%${filters.search}%`);
      }

      if (filters.observation_type) {
        dataQuery = dataQuery.eq('observation_type', filters.observation_type);
      }

      if (filters.plot_id) {
        dataQuery = dataQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_id) {
        dataQuery = dataQuery.eq('crop_id', filters.crop_id);
      }

      if (filters.date_from) {
        dataQuery = dataQuery.gte('observation_date', filters.date_from);
      }

      if (filters.date_to) {
        dataQuery = dataQuery.lte('observation_date', filters.date_to);
      }

      if (filters.severity) {
        dataQuery = dataQuery.eq('severity', filters.severity);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      dataQuery = dataQuery.range(from, to).order('observation_date', { ascending: false });

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
      console.error('Error fetching observations:', error);
      throw error;
    }
  }

  static async getObservationById(id: string): Promise<Observation> {
    try {
      if (useMockData) {
        // Return mock data
        return {
          id,
          crop_id: 'crop-1',
          plot_id: 'plot-1',
          observation_date: '2024-01-15',
          observation_type: 'levée',
          emergence_percent: 85,
          description: 'Bonne levée du maïs',
          recommendations: 'Continuer le suivi',
          observed_by: 'agent-1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('observations')
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
      console.error('Error fetching observation:', error);
      throw error;
    }
  }

  static async createObservation(observationData: Partial<Observation>): Promise<Observation> {
    try {
      if (useMockData) {
        // Return mock created observation
        return {
          id: 'new-observation-id',
          ...observationData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Observation;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('observations')
        .insert([observationData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating observation:', error);
      throw error;
    }
  }

  static async updateObservation(id: string, observationData: Partial<Observation>): Promise<Observation> {
    try {
      if (useMockData) {
        // Return mock updated observation
        return {
          id,
          ...observationData,
          updated_at: new Date().toISOString()
        } as Observation;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('observations')
        .update(observationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating observation:', error);
      throw error;
    }
  }

  static async deleteObservation(id: string): Promise<void> {
    try {
      if (useMockData) {
        // Mock deletion
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('observations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting observation:', error);
      throw error;
    }
  }

  static async getFilterOptions(): Promise<{ observation_types: string[]; severities: number[] }> {
    try {
      if (useMockData) {
        return {
          observation_types: ['levée', 'maladie', 'ravageur', 'stress_hydrique', 'stress_nutritionnel', 'développement', 'other'],
          severities: [1, 2, 3, 4, 5]
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      return {
        observation_types: ['levée', 'maladie', 'ravageur', 'stress_hydrique', 'stress_nutritionnel', 'développement', 'other'],
        severities: [1, 2, 3, 4, 5]
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}
