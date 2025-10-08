import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseAnonKey) {
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
  // status: 'active' | 'inactive'; // Utilise is_active à la place
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
  }[];
  plots?: any[];
  recent_operations?: any[];
  recent_observations?: any[];
}

export interface ProducerFilters {
  search?: string;
  region?: string;
  // status?: 'active' | 'inactive'; // Utilise is_active à la place
  cooperative_id?: string;
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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get unique regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('producers')
        .select('region')
        .not('region', 'is', null);

      if (regionsError) {
        console.error('❌ Erreur lors de la récupération des régions:', regionsError);
        throw regionsError;
      }

      const regions = [...new Set(regionsData?.map((item: any) => item.region))] as string[];
      
      // Récupérer les cultures depuis la base de données
      const { data: cropsData } = await supabase
        .from('crops')
        .select('crop_type')
        .not('crop_type', 'is', null);
      
      const cultures = [...new Set(cropsData?.map((item: any) => item.crop_type))] as string[];

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
      console.log('🔍 Utilisation de Supabase pour récupérer les producteurs (v3)');
      
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

      if (filters.cooperative_id) {
        countQuery = countQuery.eq('cooperative_id', filters.cooperative_id);
      }

      // Filtre par statut actif/inactif - utiliser is_active directement
      // if (filters.status) {
      //   const isActive = filters.status === 'active';
      //   countQuery = countQuery.eq('is_active', isActive);
      // }

      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('❌ Erreur lors du comptage:', countError);
        throw countError;
      }

      console.log(`📊 Total des producteurs trouvés: ${count}`);

      // Now get the actual data with pagination
      let dataQuery = supabase
        .from('producers')
        .select(`
          *,
          cooperative:cooperatives(id, name, region)
        `);

      // Apply same filters to data query
      if (filters.search) {
        dataQuery = dataQuery.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters.region) {
        dataQuery = dataQuery.eq('region', filters.region);
      }

      if (filters.cooperative_id) {
        dataQuery = dataQuery.eq('cooperative_id', filters.cooperative_id);
      }

      // Filtre par statut actif/inactif - utiliser is_active directement
      // if (filters.status) {
      //   const isActive = filters.status === 'active';
      //   dataQuery = dataQuery.eq('is_active', isActive);
      // }

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
        
        // Load assigned agents using new unified RPC function
        let assignedAgents: any[] = [];
        try {
          const { data: agentsData } = await supabase
            .rpc('get_assigned_agents_for_producer', { p_producer_id: producer.id });
          assignedAgents = agentsData || [];
          console.log(`👥 Agents assignés pour ${producer.first_name}:`, assignedAgents);
        } catch (error) {
          console.error('Error loading assigned agents:', error);
        }

        // Load plots statistics
        let plotsCount = 0;
        let totalArea = 0;
        try {
          const { data: plotsData } = await supabase
            .from('plots')
            .select('area_hectares')
            .eq('producer_id', producer.id);
          
          plotsCount = plotsData?.length || 0;
          totalArea = plotsData?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0;
          console.log(`📊 Statistiques parcelles pour ${producer.first_name}: ${plotsCount} parcelles, ${totalArea} ha`);
          console.log(`📊 Données parcelles brutes:`, plotsData);
        } catch (error) {
          console.error('Error loading plots statistics:', error);
        }

        // Load farm files count
        let farmFilesCount = 0;
        try {
          console.log(`🔍 Recherche fiches pour producer.id: ${producer.id}`);
          const { data: farmFilesData, error: farmFilesError } = await supabase
            .from('farm_files')
            .select('id')
            .eq('responsible_producer_id', producer.id);
          
          if (farmFilesError) {
            console.error(`❌ Erreur requête fiches:`, farmFilesError);
          } else {
            farmFilesCount = farmFilesData?.length || 0;
            console.log(`📁 Fiches fermes pour ${producer.first_name}: ${farmFilesCount}`);
            console.log(`📁 Données fiches brutes:`, farmFilesData);
          }
        } catch (error) {
          console.error('Error loading farm files count:', error);
        }
        
        const transformedProducer = {
          ...producer,
          plots_count: plotsCount,
          total_area: totalArea,
          farm_files_count: farmFilesCount,
          last_visit: producer.updated_at, // This would need to be calculated from visits
          // status: producer.is_active ? 'active' : 'inactive', // Utilise is_active directement
          cooperative: producer.cooperative ? {
            id: producer.cooperative.id,
            name: producer.cooperative.name,
            region: producer.cooperative.region
          } : null,
          assigned_agents: assignedAgents.map(agent => ({
            id: agent.agent_id,
            display_name: agent.display_name,
            phone: agent.phone,
            assigned_at: agent.assigned_at
          })),
          farm_files: Array(farmFilesCount).fill(null).map((_, index) => ({
            id: `farm-file-${index}`,
            name: `Fiche ${index + 1}`
          })),
          plots: [], // This would need to be fetched from plots table
          recent_operations: [], // This would need to be fetched from operations table
          recent_observations: [] // This would need to be fetched from observations table
        };
        
        console.log(`✅ Producteur transformé ${producer.first_name}:`, {
          plots_count: transformedProducer.plots_count,
          total_area: transformedProducer.total_area,
          farm_files_count: transformedProducer.farm_files?.length
        });
        
        return transformedProducer;
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
      console.log('🔍 Récupération des régions depuis Supabase');
      
      const { data, error } = await supabase
        .from('producers')
        .select('region')
        .not('region', 'is', null);

      if (error) {
        console.error('❌ Erreur lors de la récupération des régions:', error);
        throw error;
      }

      const regions = [...new Set(data?.map((item: any) => item.region))] as string[];
      console.log(`📊 Régions trouvées: ${regions.join(', ')}`);
      
      return regions.sort();
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  static async getProducerById(id: string): Promise<Producer | null> {
    try {
      // Simplified query to avoid complex joins
      const { data, error } = await supabase
        .from('producers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Load additional data
      let assignedAgents: any[] = [];
      let plotsCount = 0;
      let totalArea = 0;
      let farmFilesCount = 0;

      try {
        // Load assigned agents using new unified RPC function
        const { data: agentsData } = await supabase
          .rpc('get_assigned_agents_for_producer', { p_producer_id: id });
        assignedAgents = agentsData || [];

        // Load plots statistics
        const { data: plotsData } = await supabase
          .from('plots')
          .select('area_hectares')
          .eq('producer_id', id);
        
        plotsCount = plotsData?.length || 0;
        totalArea = plotsData?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0;

        // Load farm files count
        const { data: farmFilesData } = await supabase
          .from('farm_files')
          .select('id')
          .eq('responsible_producer_id', id);
        
        farmFilesCount = farmFilesData?.length || 0;
      } catch (error) {
        console.error('Error loading additional data:', error);
      }

      // Load cooperative info
      let cooperative = null;
      if (data.cooperative_id) {
        try {
          const { data: cooperativeData } = await supabase
            .from('cooperatives')
            .select('id, name, region')
            .eq('id', data.cooperative_id)
            .single();
          
          cooperative = cooperativeData;
        } catch (error) {
          console.error('Error loading cooperative:', error);
        }
      }

      return {
        ...data,
        plots_count: plotsCount,
        total_area: totalArea,
        farm_files_count: farmFilesCount,
        last_visit: data.updated_at,
        // status: data.is_active ? 'active' : 'inactive', // Utilise is_active directement
        cooperative,
        assigned_agents: assignedAgents.map(agent => ({
          id: agent.agent_id,
          display_name: agent.display_name,
          phone: agent.phone,
          assigned_at: agent.assigned_at
        })),
        farm_files: Array(farmFilesCount).fill(null).map((_, index) => ({
          id: `farm-file-${index}`,
          name: `Fiche ${index + 1}`
        })),
        plots: [],
        recent_operations: [],
        recent_observations: []
      };
    } catch (error) {
      console.error('Error fetching producer by ID:', error);
      throw error;
    }
  }

  static async updateProducer(id: string, updates: Partial<Producer>): Promise<Producer> {
    try {
      console.log(`🔄 Mise à jour du producteur ${id}:`, updates);

      // Separate database fields from calculated fields and filter out empty UUID fields
      const dbUpdates = {
        ...updates,
        plots_count: undefined,
        total_area: undefined,
        last_visit: undefined,
        cooperative: undefined,
        assigned_agents: undefined,
        farm_files: undefined,
        plots: undefined,
        recent_operations: undefined,
        recent_observations: undefined
      };

      // Filter out empty UUID fields to prevent PostgreSQL errors
      const uuidFields = ['profile_id', 'cooperative_id'];
      uuidFields.forEach(field => {
        if (dbUpdates[field] === '' || dbUpdates[field] === null) {
          delete dbUpdates[field];
        }
      });

      const { data, error } = await supabase
        .from('producers')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Return updated producer with calculated fields
      return await this.getProducerById(id) as Producer;
    } catch (error) {
      console.error('Error updating producer:', error);
      throw error;
    }
  }

  static async createProducer(producerData: Partial<Producer>): Promise<Producer> {
    try {
      console.log('➕ Création d\'un nouveau producteur:', producerData);

      // Separate database fields from calculated fields
      const dbData = {
        ...producerData,
        plots_count: undefined,
        total_area: undefined,
        last_visit: undefined,
        cooperative: undefined,
        assigned_agents: undefined,
        farm_files: undefined,
        plots: undefined,
        recent_operations: undefined,
        recent_observations: undefined
      };

      const { data, error } = await supabase
        .from('producers')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      // Return created producer with calculated fields
      return await this.getProducerById(data.id) as Producer;
    } catch (error) {
      console.error('Error creating producer:', error);
      throw error;
    }
  }

  static async deleteProducer(id: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression du producteur ${id}`);

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

      // 2. Récupérer toutes les fiches fermes du producteur
      const { data: farmFiles, error: farmFilesError } = await supabase
        .from('farm_files')
        .select('id')
        .eq('responsible_producer_id', id);

      if (farmFilesError) {
        console.error('Erreur lors de la récupération des fiches fermes:', farmFilesError);
        throw farmFilesError;
      }

      if (farmFiles && farmFiles.length > 0) {
        console.log(`📋 ${farmFiles.length} fiches fermes trouvées pour le producteur`);

        // 3. Récupérer toutes les parcelles de fiches
        const { data: farmFilePlots, error: farmFilePlotsError } = await supabase
          .from('plots')
          .select('id')
          .in('farm_file_id', farmFiles.map(ff => ff.id));

        if (farmFilePlotsError) {
          console.error('Erreur lors de la récupération des parcelles de fiches:', farmFilePlotsError);
          throw farmFilePlotsError;
        }

        if (farmFilePlots && farmFilePlots.length > 0) {
          console.log(`🌾 ${farmFilePlots.length} parcelles de fiches trouvées`);

          // 4. Supprimer toutes les observations liées
          const { error: observationsDeleteError } = await supabase
            .from('observations')
            .delete()
            .in('plot_id', farmFilePlots.map(ffp => ffp.id));

          if (observationsDeleteError) {
            console.error('Erreur lors de la suppression des observations:', observationsDeleteError);
            throw observationsDeleteError;
          }

          // 5. Supprimer toutes les opérations liées
          const { error: operationsDeleteError } = await supabase
            .from('operations')
            .delete()
            .in('plot_id', farmFilePlots.map(ffp => ffp.id));

          if (operationsDeleteError) {
            console.error('Erreur lors de la suppression des opérations:', operationsDeleteError);
            throw operationsDeleteError;
          }

          // 6. Supprimer toutes les cultures liées
          const { error: cropsDeleteError } = await supabase
            .from('crops')
            .delete()
            .in('plot_id', farmFilePlots.map(ffp => ffp.id));

          if (cropsDeleteError) {
            console.error('Erreur lors de la suppression des cultures:', cropsDeleteError);
            throw cropsDeleteError;
          }

          // 7. Supprimer toutes les parcelles
          const { error: farmFilePlotsDeleteError } = await supabase
            .from('plots')
            .delete()
            .in('farm_file_id', farmFiles.map(ff => ff.id));

          if (farmFilePlotsDeleteError) {
            console.error('Erreur lors de la suppression des parcelles de fiches:', farmFilePlotsDeleteError);
            throw farmFilePlotsDeleteError;
          }
        }

        // 8. Supprimer toutes les fiches fermes
        const { error: farmFilesDeleteError } = await supabase
          .from('farm_files')
          .delete()
          .eq('responsible_producer_id', id);

        if (farmFilesDeleteError) {
          console.error('Erreur lors de la suppression des fiches fermes:', farmFilesDeleteError);
          throw farmFilesDeleteError;
        }
      }

      // 9. Enfin, supprimer le producteur
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ Producteur ${id} et toutes ses données liées supprimés avec succès`);
    } catch (error) {
      console.error('Error deleting producer:', error);
      throw error;
    }
  }
}