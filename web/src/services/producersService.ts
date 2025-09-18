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
  village?: string;
  address?: string;
  birth_date?: string;
  gender?: string;
  education_level?: string;
  farming_experience_years?: number;
  household_size?: number;
  primary_language?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plots_count?: number;
  total_area?: number;
  last_visit?: string;
  status: 'active' | 'inactive';
  // Relations
  cooperative?: {
    id: string;
    name: string;
    region: string;
  };
  assigned_agents?: {
    id: string;
    display_name: string;
    phone: string;
    assigned_at: string;
  }[];
  farm_files?: {
    id: string;
    name: string;
    status: string;
    completion_percent: number;
    plot_count: number;
    created_at: string;
  }[];
  plots?: {
    id: string;
    name: string;
    area_hectares: number;
    status: string;
    created_at: string;
  }[];
  recent_operations?: {
    id: string;
    operation_type: string;
    operation_date: string;
    description: string;
    performer_id: string;
  }[];
  recent_observations?: {
    id: string;
    observation_type: string;
    observation_date: string;
    description: string;
    severity: number;
    observed_by: string;
  }[];
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
  static async getFilterOptions(): Promise<{ regions: string[]; cultures: string[] }> {
    try {
      if (useMockData) {
        // Extract unique regions and cultures from mock data
        const regions = [...new Set(mockProducers.map(p => p.region))];
        const cultures = ['Maïs', 'Riz', 'Arachide', 'Millet', 'Sorgho']; // Mock cultures
        return { regions, cultures };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get unique regions
      const { data: regionsData } = await supabase
        .from('producers')
        .select('region')
        .not('region', 'is', null);

      const regions = [...new Set(regionsData?.map(r => r.region) || [])];

      // Mock cultures for now
      const cultures = ['Maïs', 'Riz', 'Arachide', 'Millet', 'Sorgho'];

      return { regions, cultures };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

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

      // Transform data to include calculated fields and load assigned agents
      const transformedData: Producer[] = await Promise.all((data || []).map(async (producer) => {
        console.log('Transforming producer:', producer);
        console.log('Producer ID:', producer.id);
        
        // Load assigned agents using RPC function
        let assignedAgents: any[] = [];
        try {
          const { data: agentsData } = await supabase
            .rpc('get_producer_assigned_agents', { producer_uuid: producer.id });
          assignedAgents = agentsData || [];
          console.log(`👥 Agents assignés pour ${producer.first_name}:`, assignedAgents);
        } catch (error) {
          console.error('Error loading assigned agents:', error);
        }
        
        return {
          ...producer,
          plots_count: 0, // This would need to be calculated from plots data
          total_area: 0, // This would need to be calculated from plots data
          last_visit: producer.updated_at, // This would need to be calculated from visits
          status: producer.is_active ? 'active' : 'inactive',
          cooperative: producer.cooperative_id ? {
            id: producer.cooperative_id,
            name: 'Coopérative Mock', // This would need to be fetched from cooperatives table
            region: producer.region
          } : null,
          assigned_agents: assignedAgents.map(agent => ({
            id: agent.agent_id,
            display_name: agent.display_name,
            phone: agent.phone,
            assigned_at: agent.assigned_at
          })),
          farm_files: [], // This would need to be fetched from farm_files table
          plots: [], // This would need to be fetched from plots table
          recent_operations: [], // This would need to be fetched from operations table
          recent_observations: [] // This would need to be fetched from observations table
        };
      }));

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

  static async getAvailableAgents(): Promise<Array<{id: string, display_name: string, phone: string}>> {
    try {
      // Utiliser la fonction RPC pour récupérer les agents avec leur téléphone
      const { data, error } = await supabase
        .rpc('get_available_agents');

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching available agents:', error);
      throw error;
    }
  }

  static async assignAgentToProducer(producerId: string, agentId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('assign_agent_to_producer', {
          producer_uuid: producerId,
          agent_uuid: agentId
        });

      if (error) throw error;
      
      if (!data) {
        throw new Error('Agent déjà assigné à ce producteur');
      }
    } catch (error) {
      console.error('Error assigning agent to producer:', error);
      throw error;
    }
  }

  static async unassignAgentFromProducer(producerId: string, agentId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('unassign_agent_from_producer', {
          producer_uuid: producerId,
          agent_uuid: agentId
        });

      if (error) throw error;
      
      if (!data) {
        throw new Error('Agent non trouvé dans les assignations');
      }
    } catch (error) {
      console.error('Error unassigning agent from producer:', error);
      throw error;
    }
  }

  static async getProducerById(id: string): Promise<Producer | null> {
    try {
      if (useMockData) {
        const producer = mockProducers.find(p => p.id === id);
        if (!producer) return null;
        
        return {
          ...producer,
          plots_count: 0,
          total_area: 0,
          last_visit: producer.updated_at,
          status: producer.is_active ? 'active' : 'inactive',
          cooperative: {
            id: producer.cooperative_id,
            name: 'Coopérative Mock',
            region: producer.region
          },
          assigned_agents: [],
          farm_files: [],
          plots: [],
          recent_operations: [],
          recent_observations: []
        };
      }

      // Simplified query to avoid complex joins
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching producer:', error);
        throw error;
      }

      if (!data) return null;

      // Get cooperative info separately
      let cooperative = null;
      if (data.cooperative_id) {
        const { data: coopData } = await supabase
          .from('cooperatives')
          .select('id, name, region')
          .eq('id', data.cooperative_id)
          .single();
        cooperative = coopData;
      }

      // Get assigned agents using RPC function
      const { data: agentsData } = await supabase
        .rpc('get_producer_assigned_agents', { producer_uuid: id });

      // Get farm files separately
      const { data: farmFilesData } = await supabase
        .from('farm_files')
        .select('id, name, status, created_at')
        .eq('responsible_producer_id', id);

      // Get plots separately
      const { data: plotsData } = await supabase
        .from('plots')
        .select('id, name, created_at')
        .eq('producer_id', id);

      return {
        ...data,
        plots_count: plotsData?.length || 0,
        total_area: 0, // This would need to be calculated from plots
        last_visit: data.updated_at,
        status: data.is_active ? 'active' : 'inactive',
        cooperative: cooperative ? {
          id: cooperative.id,
          name: cooperative.name,
          region: cooperative.region
        } : null,
            assigned_agents: agentsData?.map(agent => ({
              id: agent.agent_id,
              display_name: agent.display_name,
              phone: agent.phone,
              assigned_at: agent.assigned_at
            })) || [],
        farm_files: farmFilesData?.map(file => ({
          id: file.id,
          name: file.name,
          status: file.status,
          completion_percent: 0, // This would need to be calculated
          plot_count: 0, // This would need to be calculated
          created_at: file.created_at
        })) || [],
        plots: plotsData?.map(plot => ({
          id: plot.id,
          name: plot.name,
          area_hectares: 0, // This would need to be calculated
          status: 'active',
          created_at: plot.created_at
        })) || [],
        recent_operations: [], // Simplified for now
        recent_observations: [] // Simplified for now
      };
    } catch (error) {
      console.error('Error fetching producer:', error);
      throw error;
    }
  }

  static async updateProducer(id: string, updates: Partial<Producer>): Promise<Producer> {
    try {
      // Filter out computed fields that don't exist in the database
      const { status, plots_count, total_area, last_visit, cooperative, assigned_agents, farm_files, plots, recent_operations, recent_observations, ...dbUpdates } = updates;

      console.log('Updating producer with data:', dbUpdates);
      console.log('Producer ID:', id);

      const { data, error } = await supabase
        .from('producers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

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
      // Filter out computed fields that don't exist in the database
      const { status, plots_count, total_area, last_visit, cooperative, assigned_agents, farm_files, plots, recent_operations, recent_observations, ...dbData } = producerData;

      const { data, error } = await supabase
        .from('producers')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Supabase create error:', error);
        throw error;
      }

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
      console.log('Attempting to delete producer with ID:', id);
      
      // First, check if the producer exists and get their details
      const { data: producer, error: fetchError } = await supabase
        .from('producers')
        .select('id, first_name, last_name, profile_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching producer:', fetchError);
        throw new Error(`Producteur non trouvé: ${fetchError.message}`);
      }

      console.log('Producer found:', producer);
      
      // Try to delete the producer
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
      }
      
      console.log('Producer deleted successfully');
    } catch (error) {
      console.error('Error deleting producer:', error);
      throw error;
    }
  }
}
