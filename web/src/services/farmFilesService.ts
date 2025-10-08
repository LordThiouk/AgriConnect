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
  responsible_producer_id?: string;
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

export interface ProducerPlot {
  id: string;
  name_season_snapshot: string;
  area_hectares: number;
  soil_type?: string;
  status: string;
  farm_file_id: string;
}

export interface ProducerCrop {
  id: string;
  crop_type: string;
  variety: string;
  plot_id: string;
  status: string;
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

      if (filters.responsible_producer_id) {
        countQuery = countQuery.eq('responsible_producer_id', filters.responsible_producer_id);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error counting farm files:', countError);
        throw countError;
      }

      // Use RPC function for all queries to get statistics
      console.log(`📊 Utilisation de la fonction RPC pour récupérer les fiches avec statistiques`);
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_farm_files_with_stats', {
          p_search: filters.search || null,
          p_region: filters.region || null,
          p_status: filters.status || null,
          p_responsible_producer_id: filters.responsible_producer_id || null,
          p_cooperative_id: filters.cooperative_id || null,
          p_limit: pagination.limit,
          p_offset: (pagination.page - 1) * pagination.limit
        });

      if (rpcError) {
        console.error('Error fetching farm files via RPC:', rpcError);
        throw rpcError;
      }

      // Transform RPC data to match expected format
      const data = (rpcData || []).map((file: any) => ({
        ...file,
        plots_count: file.plot_count,
        completion_percentage: file.completion_percentage,
        cooperative: file.cooperative_id ? {
          id: file.cooperative_id,
          name: file.cooperative_name,
          region: file.region
        } : null,
        responsible_producer: file.responsible_producer_id ? {
          id: file.responsible_producer_id,
          first_name: file.producer_name?.split(' ')[0] || '',
          last_name: file.producer_name?.split(' ').slice(1).join(' ') || '',
          phone: null // Not available in RPC
        } : null
      }));

      // Data is already processed with statistics from RPC, no additional transformation needed
      const transformedData: FarmFile[] = data;

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

  // Récupérer les parcelles d'un producteur spécifique
  static async getProducerPlots(producerId: string): Promise<ProducerPlot[]> {
    try {
      if (useMockData) {
        // Données de test
        return [
          {
            id: 'd5d5d2fa-3aef-417e-8e00-cd913a4d38bd',
            name_season_snapshot: 'Parcelle Test 1',
            area_hectares: 1.2,
            soil_type: 'Sableux',
            status: 'active',
            farm_file_id: 'test-farm-file-1'
          },
          {
            id: 'test-plot-2',
            name_season_snapshot: 'Parcelle Test 2',
            area_hectares: 0.8,
            soil_type: 'Argileux',
            status: 'active',
            farm_file_id: 'test-farm-file-1'
          }
        ];
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Récupérer les fiches d'exploitation du producteur (draft et validated)
      const { data: farmFiles, error: farmFilesError } = await supabase
        .from('farm_files')
        .select('id')
        .eq('responsible_producer_id', producerId)
        .in('status', ['draft', 'validated']);

      if (farmFilesError) {
        throw farmFilesError;
      }

      if (!farmFiles || farmFiles.length === 0) {
        return [];
      }

      const farmFileIds = farmFiles.map(ff => ff.id);

      // Récupérer les parcelles des fiches d'exploitation
      const { data: plots, error: plotsError } = await supabase
        .from('plots')
        .select('id, name_season_snapshot, area_hectares, soil_type, status, farm_file_id')
        .in('farm_file_id', farmFileIds);

      if (plotsError) {
        throw plotsError;
      }

      return plots || [];
    } catch (error) {
      console.error('Error fetching producer plots:', error);
      throw error;
    }
  }

  // Récupérer les cultures d'une parcelle spécifique
  static async getPlotCrops(plotId: string): Promise<ProducerCrop[]> {
    try {
      if (useMockData) {
        // Données de test
        return [
          {
            id: 'f02f9cd0-9df3-44ae-a832-6d4c5fcdd270',
            crop_type: 'Other',
            variety: 'tomates',
            plot_id: plotId,
            status: 'en_cours'
          },
          {
            id: '0bbb60ab-3c2e-4521-9d6a-450c4b41bbc3',
            crop_type: 'Maize',
            variety: 'variété test',
            plot_id: plotId,
            status: 'en_cours'
          }
        ];
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data: crops, error: cropsError } = await supabase
        .from('crops')
        .select('id, crop_type, variety, plot_id, status')
        .eq('plot_id', plotId);

      if (cropsError) {
        throw cropsError;
      }

      return crops || [];
    } catch (error) {
      console.error('Error fetching plot crops:', error);
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
      console.log(`🗑️ Suppression de la fiche d'exploitation ${id}`);

      if (useMockData) {
        console.log(`Deleting farm file ${id} (mock)`);
        return;
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // 1. D'abord, nettoyer tous les crops avec farm_file_plot_id NULL (problématiques)
      console.log('🧹 Nettoyage des crops problématiques...');
      const { error: cleanupError } = await supabase
        .from('crops')
        .delete()
        .is('plot_id', null);

      if (cleanupError) {
        console.error('Erreur lors du nettoyage des crops problématiques:', cleanupError);
        throw cleanupError;
      }

      // 2. Récupérer toutes les parcelles liées
      const { data: farmFilePlots, error: farmFilePlotsError } = await supabase
        .from('plots')
        .select('id')
        .eq('farm_file_id', id);

      if (farmFilePlotsError) {
        console.error('Erreur lors de la récupération des parcelles de fiches:', farmFilePlotsError);
        throw farmFilePlotsError;
      }

      if (farmFilePlots && farmFilePlots.length > 0) {
        console.log(`🌾 ${farmFilePlots.length} parcelles de fiches trouvées`);

        // 3. Supprimer toutes les observations liées
        const { error: observationsDeleteError } = await supabase
          .from('observations')
          .delete()
          .in('plot_id', farmFilePlots.map(ffp => ffp.id));

        if (observationsDeleteError) {
          console.error('Erreur lors de la suppression des observations:', observationsDeleteError);
          throw observationsDeleteError;
        }

        // 4. Supprimer toutes les opérations liées
        const { error: operationsDeleteError } = await supabase
          .from('operations')
          .delete()
          .in('plot_id', farmFilePlots.map(ffp => ffp.id));

        if (operationsDeleteError) {
          console.error('Erreur lors de la suppression des opérations:', operationsDeleteError);
          throw operationsDeleteError;
        }

        // 5. Supprimer toutes les cultures liées
        const { error: cropsDeleteError } = await supabase
          .from('crops')
          .delete()
          .in('plot_id', farmFilePlots.map(ffp => ffp.id));

        if (cropsDeleteError) {
          console.error('Erreur lors de la suppression des cultures:', cropsDeleteError);
          throw cropsDeleteError;
        }

        // 6. Supprimer toutes les parcelles
        const { error: farmFilePlotsDeleteError } = await supabase
          .from('plots')
          .delete()
          .eq('farm_file_id', id);

        if (farmFilePlotsDeleteError) {
          console.error('Erreur lors de la suppression des parcelles de fiches:', farmFilePlotsDeleteError);
          throw farmFilePlotsDeleteError;
        }
      }

      // 7. Enfin, supprimer la fiche d'exploitation
      const { error } = await supabase
        .from('farm_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ Fiche d'exploitation ${id} et toutes ses données liées supprimées avec succès`);
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

      const regions: string[] = [...new Set(regionsData?.map(r => r.region).filter(Boolean) as string[] || [])];

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
