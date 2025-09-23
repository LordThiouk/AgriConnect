import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/appConfig';
import { Crop, Operation } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface CropFilters {
  search?: string;
  plot_id?: string;
  crop_type?: string;
  status?: 'planted' | 'growing' | 'harvested' | 'failed';
  season?: string;
  producer_id?: string;
  region?: string;
  cooperative_id?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CropsResponse {
  data: Crop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CropStats {
  totalCrops: number;
  activeCrops: number;
  harvestedCrops: number;
  failedCrops: number;
  totalArea: number;
  averageYield: number;
  cropsByType: Record<string, number>;
  cropsByStatus: Record<string, number>;
}

export class CropsService {
  static async getCrops(
    filters: CropFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<CropsResponse> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get total count with filters
      let countQuery = supabase
        .from('crops')
        .select('*', { count: 'exact', head: true });

      // Apply filters to count query
      if (filters.search) {
        countQuery = countQuery.or(`crop_type.ilike.%${filters.search}%,variety.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters.plot_id) {
        countQuery = countQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_type) {
        countQuery = countQuery.eq('crop_type', filters.crop_type);
      }

      if (filters.status) {
        countQuery = countQuery.eq('status', filters.status);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting crops:', countError);
        throw countError;
      }

      // Get the actual data with pagination
      let dataQuery = supabase
        .from('crops')
        .select(`
          *,
          plot:plots(
            id, 
            name, 
            area_hectares,
            producer_id,
            producer:producers(id, first_name, last_name, phone, region, cooperative_id)
          ),
          operations:operations(id, operation_type, operation_date, description, product_used, total_cost)
        `);

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`crop_type.ilike.%${filters.search}%,variety.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters.plot_id) {
        dataQuery = dataQuery.eq('plot_id', filters.plot_id);
      }

      if (filters.crop_type) {
        dataQuery = dataQuery.eq('crop_type', filters.crop_type);
      }

      if (filters.status) {
        dataQuery = dataQuery.eq('status', filters.status);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      dataQuery = dataQuery.range(from, to).order('planting_date', { ascending: false });

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
      console.error('Error fetching crops:', error);
      throw error;
    }
  }

  static async getCropById(id: string): Promise<Crop> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          plot:plots(
            id, 
            name, 
            area_hectares,
            producer_id,
            producer:producers(id, first_name, last_name, phone, region, cooperative_id)
          ),
          operations:operations(id, operation_type, operation_date, description, product_used, total_cost)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching crop:', error);
      throw error;
    }
  }

  static async createCrop(cropData: Partial<Crop>): Promise<Crop> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('crops')
        .insert([cropData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating crop:', error);
      throw error;
    }
  }

  static async updateCrop(id: string, cropData: Partial<Crop>): Promise<Crop> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('crops')
        .update(cropData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating crop:', error);
      throw error;
    }
  }

  static async deleteCrop(id: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting crop:', error);
      throw error;
    }
  }

  static async getCropStats(): Promise<CropStats> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get basic stats
      const { data: cropsData, error } = await supabase
        .from('crops')
        .select(`
          status, 
          crop_type, 
          estimated_yield_kg_ha,
          actual_yield_kg_ha,
          plot:plots(area_hectares)
        `);

      if (error) throw error;

      const totalCrops = cropsData?.length || 0;
      const activeCrops = cropsData?.filter(c => ['planted', 'growing'].includes(c.status)).length || 0;
      const harvestedCrops = cropsData?.filter(c => c.status === 'harvested').length || 0;
      const failedCrops = cropsData?.filter(c => c.status === 'failed').length || 0;

      // Calculate total area (sum of plot areas for all crops)
      const totalArea = cropsData?.reduce((sum, crop) => {
        return sum + (crop.plot?.area_hectares || 0);
      }, 0) || 0;

      // Calculate average yield
      const yields = cropsData?.map(crop => crop.actual_yield_kg_ha || crop.estimated_yield_kg_ha).filter(y => y) || [];
      const averageYield = yields.length > 0 ? yields.reduce((sum, y) => sum + y, 0) / yields.length : 0;

      // Group by crop type
      const cropsByType = cropsData?.reduce((acc, crop) => {
        if (crop.crop_type) {
          acc[crop.crop_type] = (acc[crop.crop_type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Group by status
      const cropsByStatus = cropsData?.reduce((acc, crop) => {
        acc[crop.status] = (acc[crop.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalCrops,
        activeCrops,
        harvestedCrops,
        failedCrops,
        totalArea,
        averageYield,
        cropsByType,
        cropsByStatus
      };
    } catch (error) {
      console.error('Error fetching crop stats:', error);
      throw error;
    }
  }

  static async getFilterOptions(): Promise<{
    cropTypes: string[];
    statuses: string[];
    regions: string[];
    cooperatives: { id: string; name: string }[];
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get unique crop types from crops
      const { data: cropTypesData } = await supabase
        .from('crops')
        .select('crop_type')
        .not('crop_type', 'is', null);

      const cropTypes = [...new Set(cropTypesData?.map(c => c.crop_type as string) || [])] as string[];

      // Get regions from plots -> producers
      const { data: regionsData } = await supabase
        .from('crops')
        .select(`
          plot:plots(
            producer:producers(region)
          )
        `);

      const regions = [...new Set(
        regionsData?.map(c => c.plot?.producer?.region as string).filter(r => r) || []
      )] as string[];

      // Get cooperatives
      const { data: cooperativesData } = await supabase
        .from('cooperatives')
        .select('id, name')
        .eq('is_active', true);

      const cooperatives = cooperativesData || [];

      return {
        cropTypes,
        statuses: ['planted', 'growing', 'harvested', 'failed'],
        regions,
        cooperatives
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}