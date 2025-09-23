import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/appConfig';
import { Plot, Crop, Operation, Producer } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export interface PlotFilters {
  search?: string;
  producer_id?: string;
  status?: 'active' | 'inactive' | 'abandoned';
  soil_type?: string;
  water_source?: string;
  region?: string;
  cooperative_id?: string;
}

export interface CropFilters {
  search?: string;
  plot_id?: string;
  farm_file_plot_id?: string;  // Ajout pour supporter farm_file_plots
  crop_type?: string;
  status?: 'planted' | 'growing' | 'harvested' | 'failed';
  season?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PlotsResponse {
  data: Plot[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CropsResponse {
  data: Crop[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlotStats {
  totalPlots: number;
  activePlots: number;
  totalArea: number;
  averageArea: number;
  plotsByStatus: Record<string, number>;
  plotsBySoilType: Record<string, number>;
}

export class PlotsService {
  // ===== PLOTS MANAGEMENT =====
  
  static async getPlots(
    filters: PlotFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PlotsResponse> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get count using RPC
      const { data: countData, error: countError } = await supabase
        .rpc('get_plots_with_geolocation_count', {
          search_param: filters.search || null,
          producer_id_param: filters.producer_id || null,
          status_param: filters.status || null,
          soil_type_param: filters.soil_type || null,
          water_source_param: filters.water_source || null,
          region_param: filters.region || null,
          cooperative_id_param: filters.cooperative_id || null
        });

      if (countError) throw countError;

      const total = countData || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      // Get data using RPC
      const { data, error } = await supabase
        .rpc('get_plots_with_geolocation', {
          search_param: filters.search || null,
          producer_id_param: filters.producer_id || null,
          status_param: filters.status || null,
          soil_type_param: filters.soil_type || null,
          water_source_param: filters.water_source || null,
          region_param: filters.region || null,
          cooperative_id_param: filters.cooperative_id || null,
          page_param: pagination.page,
          limit_param: pagination.limit
        });

      if (error) throw error;

           // Transform RPC response to match Plot interface
           const transformedData = (data || []).map((plot: any) => ({
             id: plot.id,
             farm_file_plot_id: plot.farm_file_plot_id, // Add farm_file_plot_id for crops/operations
             producer_id: plot.producer_id,
             name: plot.name,
             area_hectares: plot.area_hectares ? parseFloat(plot.area_hectares) : undefined,
             soil_type: plot.soil_type,
             soil_ph: plot.soil_ph ? parseFloat(plot.soil_ph) : undefined,
             water_source: plot.water_source,
             irrigation_type: plot.irrigation_type,
             slope_percent: plot.slope_percent ? parseFloat(plot.slope_percent) : undefined,
             elevation_meters: plot.elevation_meters ? parseFloat(plot.elevation_meters) : undefined,
             status: plot.status,
             notes: plot.notes,
             created_at: plot.created_at,
             updated_at: plot.updated_at,
             // Geographic data
             latitude: plot.latitude ? parseFloat(plot.latitude) : undefined,
             longitude: plot.longitude ? parseFloat(plot.longitude) : undefined,
             geom: plot.geom,
             center_point: plot.center_point,
             // Producer information
             producer: plot.producer_first_name ? {
               id: plot.producer_id,
               profile_id: plot.producer_id,
               first_name: plot.producer_first_name,
               last_name: plot.producer_last_name,
               phone: plot.producer_phone,
               gender: 'M' as const, // Default value
               is_active: true,
               created_at: plot.created_at,
               updated_at: plot.updated_at,
               region: plot.producer_region,
               cooperative_id: plot.producer_cooperative_id ? plot.producer_cooperative_id : null
             } : undefined
           }));

      return {
        data: transformedData,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching plots:', error);
      throw error;
    }
  }

  static async getPlotById(id: string): Promise<Plot> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('farm_file_plots')
        .select(`
          *,
          producer:producers(id, first_name, last_name, phone, region, cooperative_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching plot:', error);
      throw error;
    }
  }

  static async createPlot(plotData: Partial<Plot>): Promise<Plot> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('plots')
        .insert([plotData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating plot:', error);
      throw error;
    }
  }

  static async updatePlot(id: string, plotData: Partial<Plot>): Promise<Plot> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('plots')
        .update(plotData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating plot:', error);
      throw error;
    }
  }

  static async deletePlot(id: string): Promise<void> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      console.log('Starting deletion of plot using RPC:', id);

      // Use the new RPC function for safe cascade deletion
      const { data, error } = await supabase
        .rpc('delete_plot_cascade', { plot_id_param: id });

      if (error) {
        console.error('Error calling delete_plot_cascade RPC:', error);
        throw error;
      }

      if (!data || !data.success) {
        const errorMessage = data?.message || 'Unknown error during plot deletion';
        console.error('RPC deletion failed:', errorMessage);
        throw new Error(errorMessage);
      }

      console.log('Plot deletion completed successfully:', data);
    } catch (error) {
      console.error('Error deleting plot:', error);
      throw error;
    }
  }

  static async getPlotsStats(): Promise<PlotStats> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get total plots count
      const { count: totalPlots } = await supabase
        .from('plots')
        .select('*', { count: 'exact', head: true });

      // Get active plots count from farm_file_plots
      const { count: activePlots } = await supabase
        .from('farm_file_plots')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total area
      const { data: areaData } = await supabase
        .from('farm_file_plots')
        .select('area_hectares')
        .not('area_hectares', 'is', null);

      const totalArea = areaData?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0;
      const averageArea = totalPlots ? totalArea / totalPlots : 0;

      // Get plots by status
      const { data: statusData } = await supabase
        .from('farm_file_plots')
        .select('status')
        .not('status', 'is', null);

      const plotsByStatus = statusData?.reduce((acc, plot) => {
        acc[plot.status] = (acc[plot.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get plots by soil type
      const { data: soilData } = await supabase
        .from('farm_file_plots')
        .select('soil_type')
        .not('soil_type', 'is', null);

      const plotsBySoilType = soilData?.reduce((acc, plot) => {
        acc[plot.soil_type] = (acc[plot.soil_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalPlots: totalPlots || 0,
        activePlots: activePlots || 0,
        totalArea: Math.round(totalArea * 100) / 100,
        averageArea: Math.round(averageArea * 100) / 100,
        plotsByStatus,
        plotsBySoilType
      };
    } catch (error) {
      console.error('Error fetching plots stats:', error);
      throw error;
    }
  }

  // ===== CROPS MANAGEMENT =====

  static async getCrops(
    filters: CropFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<CropsResponse> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get count using RPC
      // Si farm_file_plot_id est fourni, l'utiliser à la place de plot_id
      const plotIdParam = filters.farm_file_plot_id || filters.plot_id;
      
      const { data: countData, error: countError } = await supabase
        .rpc('get_crops_count', {
          plot_id_param: plotIdParam || null,
          search_param: filters.search || null,
          crop_type_param: filters.crop_type || null,
          status_param: filters.status || null,
          season_param: filters.season || null,
          producer_id_param: (filters as any).producer_id || null,
          region_param: (filters as any).region || null,
          cooperative_id_param: (filters as any).cooperative_id || null
        });

      if (countError) throw countError;

      const total = countData || 0;
      const totalPages = Math.ceil(total / pagination.limit);

      // Get data using RPC
      const { data, error } = await supabase
        .rpc('get_crops_with_plot_info', {
          plot_id_param: plotIdParam || null,
          search_param: filters.search || null,
          crop_type_param: filters.crop_type || null,
          status_param: filters.status || null,
          season_param: filters.season || null,
          producer_id_param: (filters as any).producer_id || null,
          region_param: (filters as any).region || null,
          cooperative_id_param: (filters as any).cooperative_id || null,
          page_param: pagination.page,
          limit_param: pagination.limit
        });

      if (error) throw error;

      // Transform RPC response to match Crop interface
      const transformedData = (data || []).map((crop: any) => ({
        id: crop.id,
        plot_id: crop.plot_id,
        crop_type: crop.crop_type,
        variety: crop.variety,
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date,
        actual_harvest_date: crop.actual_harvest_date,
        estimated_yield_kg_ha: crop.expected_yield_kg,
        actual_yield_kg_ha: crop.actual_yield_kg,
        area_hectares: crop.area_hectares,
        status: crop.status,
        notes: crop.notes,
        season: crop.season_id, // We'll need to get season label separately if needed
        created_at: crop.created_at,
        updated_at: crop.updated_at,
        plot: {
          id: crop.farm_file_plot_id,
          name: crop.plot_name,
          producer_id: crop.plot_producer_id,
          status: 'active' as const,
          created_at: crop.created_at,
          updated_at: crop.updated_at
        },
        operations: [] // Operations will be fetched separately if needed
      }));

      return {
        data: transformedData,
        total,
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
        .rpc('get_crop_by_id_with_plot_info', {
          crop_id_param: id
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Crop not found');
      }

      const crop = data[0];

      // Transform RPC response to match Crop interface
      return {
        id: crop.id,
        plot_id: crop.plot_id,
        crop_type: crop.crop_type,
        variety: crop.variety,
        sowing_date: crop.sowing_date,
        expected_harvest_date: crop.expected_harvest_date,
        actual_harvest_date: crop.actual_harvest_date,
        estimated_yield_kg_ha: crop.expected_yield_kg,
        actual_yield_kg_ha: crop.actual_yield_kg,
        area_hectares: crop.area_hectares,
        status: crop.status,
        notes: crop.notes,
        season: crop.season_id,
        created_at: crop.created_at,
        updated_at: crop.updated_at,
        plot: {
          id: crop.farm_file_plot_id,
          name: crop.plot_name,
          producer_id: crop.plot_producer_id,
          status: 'active' as const,
          created_at: crop.created_at,
          updated_at: crop.updated_at
        },
        operations: [] // Operations will be fetched separately if needed
      };
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

  // ===== STATISTICS =====

  static async getPlotStats(): Promise<PlotStats> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get basic stats from plots table
      const { data: plotsData, error } = await supabase
        .from('plots')
        .select('id');

      if (error) throw error;

      const totalPlots = plotsData?.length || 0;

      // Get detailed stats from farm_file_plots table
      const { data: farmFilePlotsData, error: farmFileError } = await supabase
        .from('farm_file_plots')
        .select('status, soil_type, area_hectares');

      if (farmFileError) throw farmFileError;

      const activePlots = farmFilePlotsData?.filter(p => p.status === 'active').length || 0;
      const totalArea = farmFilePlotsData?.reduce((sum, p) => sum + (p.area_hectares || 0), 0) || 0;
      const averageArea = totalPlots > 0 ? totalArea / totalPlots : 0;

      // Group by status
      const plotsByStatus = farmFilePlotsData?.reduce((acc, plot) => {
        if (plot.status) {
          acc[plot.status] = (acc[plot.status] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Group by soil type
      const plotsBySoilType = farmFilePlotsData?.reduce((acc, plot) => {
        if (plot.soil_type) {
          acc[plot.soil_type] = (acc[plot.soil_type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalPlots,
        activePlots,
        totalArea,
        averageArea,
        plotsByStatus,
        plotsBySoilType
      };
    } catch (error) {
      console.error('Error fetching plot stats:', error);
      throw error;
    }
  }

  // ===== FILTER OPTIONS =====

  static async getFilterOptions(): Promise<{
    soilTypes: string[];
    waterSources: string[];
    irrigationTypes: string[];
    cropTypes: string[];
    regions: string[];
    cooperatives: { id: string; name: string }[];
  }> {
    try {

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get unique soil types from farm_file_plots
      const { data: soilTypesData } = await supabase
        .from('farm_file_plots')
        .select('soil_type')
        .not('soil_type', 'is', null);

      const soilTypes = [...new Set(soilTypesData?.map(p => p.soil_type as string) || [])] as string[];

      // Get unique water sources from farm_file_plots
      const { data: waterSourcesData } = await supabase
        .from('farm_file_plots')
        .select('water_source')
        .not('water_source', 'is', null);

      const waterSources = [...new Set(waterSourcesData?.map(p => p.water_source as string) || [])] as string[];

      // Get unique irrigation types from farm_file_plots
      const { data: irrigationTypesData } = await supabase
        .from('farm_file_plots')
        .select('irrigation_type')
        .not('irrigation_type', 'is', null);

      const irrigationTypes = [...new Set(irrigationTypesData?.map(p => p.irrigation_type as string) || [])] as string[];

      // Get unique crop types from crops
      const { data: cropTypesData } = await supabase
        .from('crops')
        .select('crop_type')
        .not('crop_type', 'is', null);

      const cropTypes = [...new Set(cropTypesData?.map(c => c.crop_type as string) || [])] as string[];

      // Get regions from producers
      const { data: regionsData } = await supabase
        .from('producers')
        .select('region')
        .not('region', 'is', null);

      const regions = [...new Set(regionsData?.map(p => p.region as string) || [])] as string[];

      // Get cooperatives
      const { data: cooperativesData } = await supabase
        .from('cooperatives')
        .select('id, name');

      const cooperatives = cooperativesData || [];

      return {
        soilTypes,
        waterSources,
        irrigationTypes,
        cropTypes,
        regions,
        cooperatives
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}
