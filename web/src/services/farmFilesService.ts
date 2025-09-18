import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/appConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const useMockData = APP_CONFIG.USE_MOCK_DATA;

let supabase: any = null;
if (!useMockData && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface FarmFile {
  id: string;
  name: string;
  region: string;
  department: string;
  commune: string;
  village: string;
  sector: string;
  cooperative_id: string;
  gpc?: string;
  census_date: string;
  responsible_producer_id?: string;
  material_inventory: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'validated';
  // Relations
  cooperative?: {
    id: string;
    name: string;
    region: string;
  };
  responsible_producer?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  plots_count?: number;
  completion_percentage?: number;
}

export interface FarmFileFilters {
  search?: string;
  region?: string;
  status?: string;
  cooperative_id?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FarmFilesResponse {
  data: FarmFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class FarmFilesService {
  static async getFarmFiles(
    filters: FarmFileFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 }
  ): Promise<FarmFilesResponse> {
    try {
      if (useMockData) {
        // Mock data for development
        const mockFarmFiles: FarmFile[] = [
          {
            id: '1',
            name: 'Fiche Exploitation Alpha',
            region: 'Kaolack',
            department: 'Kaolack',
            commune: 'Kaolack',
            village: 'Ndiaganiao',
            sector: 'Secteur A',
            cooperative_id: 'coop-1',
            gpc: 'GPC001',
            census_date: '2024-01-15',
            responsible_producer_id: 'prod-1',
            material_inventory: { seeds: 50, fertilizer: 25 },
            created_by: 'agent-1',
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            status: 'draft',
            plots_count: 3,
            completion_percentage: 75
          }
        ];

        return {
          data: mockFarmFiles,
          total: mockFarmFiles.length,
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
        .from('farm_files')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`name.ilike.%${filters.search}%,village.ilike.%${filters.search}%,sector.ilike.%${filters.search}%`);
      }

      if (filters.region) {
        countQuery = countQuery.eq('region', filters.region);
      }

      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      if (filters.cooperative_id) {
        countQuery = countQuery.eq('cooperative_id', filters.cooperative_id);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting farm files:', countError);
        throw countError;
      }

      // Get the actual data with pagination
      let dataQuery = supabase
        .from('farm_files')
        .select(`
          *,
          cooperative:cooperatives(id, name, region),
          responsible_producer:producers(id, first_name, last_name, phone)
        `);

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`name.ilike.%${filters.search}%,village.ilike.%${filters.search}%,sector.ilike.%${filters.search}%`);
      }

      if (filters.region) {
        dataQuery = dataQuery.eq('region', filters.region);
      }

      if (filters.status) {
        dataQuery = dataQuery.eq('status', filters.status);
      }

      if (filters.cooperative_id) {
        dataQuery = dataQuery.eq('cooperative_id', filters.cooperative_id);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      dataQuery = dataQuery.range(from, to).order('created_at', { ascending: false });

      const { data, error } = await dataQuery;

      if (error) throw error;

      // Transform data to include calculated fields
      const transformedData: FarmFile[] = (data || []).map(farmFile => ({
        ...farmFile,
        plots_count: 0, // This would need to be calculated from farm_file_plots
        completion_percentage: 0 // This would need to be calculated based on completion status
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
      console.error('Error fetching farm files:', error);
      throw error;
    }
  }

  static async getFarmFileById(id: string): Promise<FarmFile> {
    try {
      if (useMockData) {
        // Return mock data
        return {
          id,
          name: 'Fiche Exploitation Alpha',
          region: 'Kaolack',
          department: 'Kaolack',
          commune: 'Kaolack',
          village: 'Ndiaganiao',
          sector: 'Secteur A',
          cooperative_id: 'coop-1',
          gpc: 'GPC001',
          census_date: '2024-01-15',
          responsible_producer_id: 'prod-1',
          material_inventory: { seeds: 50, fertilizer: 25 },
          created_by: 'agent-1',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          status: 'draft',
          plots_count: 3,
          completion_percentage: 75
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('farm_files')
        .select(`
          *,
          cooperative:cooperatives(id, name, region),
          responsible_producer:producers(id, first_name, last_name, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        plots_count: 0,
        completion_percentage: 0
      };
    } catch (error) {
      console.error('Error fetching farm file:', error);
      throw error;
    }
  }

  static async createFarmFile(farmFileData: Partial<FarmFile>): Promise<FarmFile> {
    try {
      if (useMockData) {
        // Return mock created farm file
        return {
          id: 'new-farm-file-id',
          ...farmFileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'draft'
        } as FarmFile;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('farm_files')
        .insert([farmFileData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating farm file:', error);
      throw error;
    }
  }

  static async updateFarmFile(id: string, farmFileData: Partial<FarmFile>): Promise<FarmFile> {
    try {
      if (useMockData) {
        // Return mock updated farm file
        return {
          id,
          ...farmFileData,
          updated_at: new Date().toISOString()
        } as FarmFile;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('farm_files')
        .update(farmFileData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating farm file:', error);
      throw error;
    }
  }

  static async deleteFarmFile(id: string): Promise<void> {
    try {
      if (useMockData) {
        // Mock deletion
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('farm_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting farm file:', error);
      throw error;
    }
  }

  static async getFilterOptions(): Promise<{ regions: string[]; statuses: string[] }> {
    try {
      if (useMockData) {
        return {
          regions: ['Kaolack', 'Thiès', 'Dakar', 'Saint-Louis'],
          statuses: ['draft', 'validated']
        };
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get unique regions
      const { data: regionsData } = await supabase
        .from('farm_files')
        .select('region')
        .not('region', 'is', null);

      const regions = [...new Set(regionsData?.map(r => r.region) || [])];

      return {
        regions,
        statuses: ['draft', 'validated']
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}
