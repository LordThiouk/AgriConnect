import { createClient } from '@supabase/supabase-js';
import { mockProducers } from '../data/mockProducers';
import { APP_CONFIG } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use configuration to determine data source
const useMockData = APP_CONFIG.USE_MOCK_DATA;

let supabase: any = null;
if (!useMockData && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface Producer {
  id: string;
  cooperative_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  region: string;
  department: string;
  commune: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plots_count?: number;
  total_area?: number;
  last_visit?: string;
  status: 'active' | 'inactive';
}

export interface ProducerFilters {
  search?: string;
  region?: string;
  culture?: string;
  status?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProducersResponse {
  data: Producer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ProducersService {
  static async getProducers(
    filters: ProducerFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<ProducersResponse> {
    try {
      if (useMockData) {
        // Use mock data
        let filteredData = [...mockProducers];

        // Apply filters
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredData = filteredData.filter(producer => 
            producer.first_name.toLowerCase().includes(searchLower) ||
            producer.last_name.toLowerCase().includes(searchLower) ||
            producer.phone.includes(searchLower)
          );
        }

        if (filters.region) {
          filteredData = filteredData.filter(producer => producer.region === filters.region);
        }

        if (filters.status) {
          const isActive = filters.status === 'active';
          filteredData = filteredData.filter(producer => producer.is_active === isActive);
        }

        // Apply pagination
        const total = filteredData.length;
        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit;
        const paginatedData = filteredData.slice(from, to);

        const totalPages = Math.ceil(total / pagination.limit);

        return {
          data: paginatedData,
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages
        };
      }

      // Original Supabase logic
      console.log('🔍 Utilisation de Supabase pour récupérer les producteurs');
      
      // First, get total count with filters applied
      let countQuery = supabase
        .from('producers')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters.region) {
        countQuery = countQuery.eq('region', filters.region);
      }

      if (filters.status) {
        const isActive = filters.status === 'active';
        countQuery = countQuery.eq('is_active', isActive);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('❌ Erreur lors du comptage:', countError);
        throw countError;
      }

      console.log(`📊 Total des producteurs trouvés: ${count}`);

      // Now get the actual data with pagination
      let dataQuery = supabase
        .from('producers')
        .select('*');

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters.region) {
        dataQuery = dataQuery.eq('region', filters.region);
      }

      if (filters.status) {
        const isActive = filters.status === 'active';
        dataQuery = dataQuery.eq('is_active', isActive);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      console.log(`📄 Pagination: page ${pagination.page}, éléments ${from}-${to}`);
      
      dataQuery = dataQuery.range(from, to).order('created_at', { ascending: false });

      const { data, error } = await dataQuery;

      if (error) throw error;

      // Transform data to include calculated fields
      const transformedData: Producer[] = (data || []).map(producer => {
        const plotsCount = producer.plots?.[0]?.count || 0;
        const totalArea = 0; // This would need to be calculated from plots data
        
        return {
          ...producer,
          plots_count: plotsCount,
          total_area: totalArea,
          last_visit: producer.updated_at, // This would need to be calculated from visits
          status: producer.is_active ? 'active' : 'inactive'
        };
      });

      const totalPages = Math.ceil((count || 0) / pagination.limit);

      return {
        data: transformedData,
        total: count || 0,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching producers:', error);
      throw error;
    }
  }

  static async getRegions(): Promise<string[]> {
    try {
      if (useMockData) {
        const regions = [...new Set(mockProducers.map(producer => producer.region))];
        return regions.sort();
      }

      console.log('🔍 Récupération des régions depuis Supabase');
      
      const { data, error } = await supabase
        .from('producers')
        .select('region')
        .not('region', 'is', null);

      if (error) {
        console.error('❌ Erreur lors de la récupération des régions:', error);
        throw error;
      }

      const regions = [...new Set(data?.map(item => item.region) || [])];
      console.log(`📍 Régions trouvées: ${regions.length}`);
      return regions.sort();
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  static async getCultures(): Promise<string[]> {
    try {
      if (useMockData) {
        return ['Maïs', 'Riz', 'Arachide', 'Millet', 'Sorgho', 'Coton'];
      }

      const { data, error } = await supabase
        .from('crops')
        .select('crop_type')
        .not('crop_type', 'is', null);

      if (error) throw error;

      const cultures = [...new Set(data?.map(item => item.crop_type) || [])];
      return cultures.sort();
    } catch (error) {
      console.error('Error fetching cultures:', error);
      throw error;
    }
  }

  static async getProducerById(id: string): Promise<Producer | null> {
    try {
      const { data, error } = await supabase
        .from('producers')
        .select(`
          *,
          plots:plots(count),
          cooperative:cooperatives(name, region)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) return null;

      return {
        ...data,
        plots_count: data.plots?.[0]?.count || 0,
        total_area: 0,
        last_visit: data.updated_at,
        status: data.is_active ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error fetching producer:', error);
      throw error;
    }
  }

  static async updateProducer(id: string, updates: Partial<Producer>): Promise<Producer> {
    try {
      const { data, error } = await supabase
        .from('producers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        plots_count: 0,
        total_area: 0,
        last_visit: data.updated_at,
        status: data.is_active ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error updating producer:', error);
      throw error;
    }
  }

  static async createProducer(producerData: Partial<Producer>): Promise<Producer> {
    try {
      const { data, error } = await supabase
        .from('producers')
        .insert([producerData])
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        plots_count: 0,
        total_area: 0,
        last_visit: data.updated_at,
        status: data.is_active ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error creating producer:', error);
      throw error;
    }
  }

  static async deleteProducer(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting producer:', error);
      throw error;
    }
  }
}
