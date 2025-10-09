/**
 * @deprecated Service de collecte de données terrain - AgriConnect
 * ⚠️  LEGACY SERVICE - DO NOT USE ⚠️
 * 
 * Ce service a été remplacé par des services domain spécialisés :
 * - FarmFilesService pour les fiches d'exploitation
 * - PlotsService pour les parcelles
 * - CropsService pour les cultures
 * - OperationsService pour les opérations
 * - ObservationsService pour les observations
 * - InputsService pour les intrants
 * - ParticipantsService pour les participants
 * - VisitsService pour les visites
 * - RecommendationsService pour les recommandations
 * 
 * Utilisez les services domain correspondants à la place.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';
import { Database } from '../../types/database';
import { 
  FarmFile, 
  FarmFileDisplay, 
  ProducerDisplay, 
  PlotDisplay,
  ParticipantDisplay,
  RecommendationDisplay,
  OperationDisplay,
  Crop,
  InputDisplay,
  CollecteFilters,
  CollecteSort,
  GlobalObservationDisplay,
  calculateCompletionStatus,
  calculateCompletionPercent,
  getSyncStatus,
  formatLocation,
  formatProducerName,
  Recommendation,
  RecommendationInsert,
  Observation,
  ObservationInsert,
  Operation,
  OperationInsert,
  Input,
  InputInsert,
  ObservationDisplay
} from '../../types/collecte';

export class CollecteService {
  static supabase: SupabaseClient<Database> = supabase;

  /**
   * Récupère toutes les fiches d'exploitation pour un agent via RPC
   */
  static async getFarmFiles(agentId: string, filters?: CollecteFilters, sort?: CollecteSort): Promise<FarmFileDisplay[]> {
    try {
      console.log('📋 Récupération des fiches d\'exploitation via RPC pour l\'agent:', agentId);

      // Appel de la fonction RPC
      const { data, error } = await (this.supabase as any)
        .rpc('get_farm_files', { p_agent_user_id: agentId });

      if (error) {
        console.error('❌ Erreur lors de la récupération des fiches via RPC:', error);
        throw error;
      }

      console.log('✅ Données RPC brutes récupérées:', data?.length || 0);
      
      // Le mappage doit utiliser les noms de colonnes exacts du RPC (snake_case)
      const farmFilesDisplay: FarmFileDisplay[] = (data || []).map((rpcRow: any) => {
        return {
          id: rpcRow.id,
          name: rpcRow.farm_file_name,
          producerName: rpcRow.producer_name,
          location: rpcRow.location,
          plotsCount: rpcRow.plot_count,
          completionPercent: rpcRow.completion_percent,
          status: rpcRow.status,
          completionStatus: rpcRow.completion_percent === 100 ? 'completed' : 
                            rpcRow.completion_percent > 0 ? 'in_progress' : 'draft',
          syncStatus: 'synced',
          lastUpdated: new Date().toISOString(),
        };
      });

      // Le filtrage et le tri peuvent rester, mais basés sur les nouvelles données
      let filteredFiles = farmFilesDisplay;
      
      if (filters?.status && filters.status.length > 0) {
        filteredFiles = filteredFiles.filter(file => filters.status!.includes(file.completionStatus));
      }

      if (filters?.search) {
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          file.producerName.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }

      if (sort) {
        // La logique de tri peut nécessiter une adaptation si les champs ont changé
      }

      console.log('✅ Fiches d\'exploitation transformées pour affichage:', filteredFiles.length);
      return filteredFiles;

    } catch (error) {
      console.error('❌ Erreur générale dans getFarmFiles:', error);
      throw error;
    }
  }

  /**
   * Récupère une fiche d'exploitation par ID
   */
  static async getFarmFileById(farmFileId: string): Promise<FarmFileDisplay | null> {
    try {
      console.log('📋 Récupération de la fiche d\'exploitation:', farmFileId);

      const { data, error } = await this.supabase
        .from('farm_files')
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name,
            phone,
            commune,
            department,
            region
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          ),
          plots (
            id,
            name,
            area_hectares
          )
        `)
        .eq('id', farmFileId)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération de la fiche:', error);
        throw error;
      }

      if (!data) return null;

      const producer = data.producers;
      const plots = data.plots || [];

      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: plots.length,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation récupérée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getFarmFileById:', error);
      throw error;
    }
  }

  /**
   * Récupère les producteurs pour un agent (version avec user_id)
   */
  static async getProducersByUserId(userId: string): Promise<ProducerDisplay[]> {
    try {
      console.log('👥 Récupération des producteurs pour l\'user_id:', userId);

      // D'abord récupérer le profile.id de l'agent
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'agent')
        .single();

      if (profileError || !profile) {
        console.error('❌ Profil agent non trouvé:', profileError);
        return [];
      }

      console.log('✅ Profil agent trouvé:', profile.id);
      return await this.getProducers(profile.id);

    } catch (error) {
      console.error('❌ Erreur générale dans getProducersByUserId:', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle opération
   */
  static async addOperation(operationData: any): Promise<any> {
    try {
      console.log('🚜 Ajout d\'une nouvelle opération:', operationData);
      
      const { data, error } = await this.supabase
        .from('operations')
        .insert(operationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'opération:', error);
        throw error;
      }

      console.log('✅ Opération ajoutée avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Met à jour une opération existante
   */
  static async updateOperation(operationId: string, operationData: any): Promise<any> {
    try {
      console.log('🚜 Mise à jour de l\'opération:', operationId, operationData);
      
      const { data, error } = await this.supabase
        .from('operations')
        .update(operationData)
        .eq('id', operationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'opération:', error);
        throw error;
      }

      console.log('✅ Opération mise à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Supprime une opération
   */
  static async deleteOperation(operationId: string): Promise<void> {
    try {
      console.log('🚜 Suppression de l\'opération:', operationId);
      
      const { error } = await this.supabase
        .from('operations')
        .delete()
        .eq('id', operationId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'opération:', error);
        throw error;
      }

      console.log('✅ Opération supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Ajoute un nouvel intrant
   */
  static async addInput(inputData: any): Promise<any> {
    try {
      console.log('🌾 Ajout d\'un nouvel intrant:', inputData);
      
      const { data, error } = await this.supabase
        .from('agricultural_inputs')
        .insert(inputData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'intrant:', error);
        throw error;
      }

      console.log('✅ Intrant ajouté avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'intrant:', error);
      throw error;
    }
  }

  /**
   * Met à jour un intrant existant
   */
  static async updateInput(inputId: string, inputData: any): Promise<any> {
    try {
      console.log('🌾 Mise à jour de l\'intrant:', inputId, inputData);
      
      const { data, error } = await this.supabase
        .from('agricultural_inputs')
        .update(inputData)
        .eq('id', inputId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'intrant:', error);
        throw error;
      }

      console.log('✅ Intrant mis à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'intrant:', error);
      throw error;
    }
  }

  /**
   * Supprime un intrant
   */
  static async deleteInput(inputId: string): Promise<void> {
    try {
      console.log('🌾 Suppression de l\'intrant:', inputId);
      
      const { error } = await this.supabase
        .from('agricultural_inputs')
        .delete()
        .eq('id', inputId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'intrant:', error);
        throw error;
      }

      console.log('✅ Intrant supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'intrant:', error);
      throw error;
    }
  }

  /**
   * Récupère les producteurs pour un agent
   */
  static async getProducers(agentId: string): Promise<ProducerDisplay[]> {
    try {
      console.log('👥 Récupération des producteurs pour l\'agent:', agentId);
      console.log('🔍 Type de agentId:', typeof agentId);
      console.log('🔍 Longueur de agentId:', agentId?.length);

      // Récupérer les producteurs assignés à l'agent
      const { data: assignments, error: assignErr } = await this.supabase
        .from('agent_assignments')
        .select('assigned_to_id')
        .eq('agent_id', agentId)
        .eq('assigned_to_type', 'producer');

      if (assignErr) {
        console.error('❌ Erreur lors de la récupération des affectations:', assignErr);
        throw assignErr;
      }

      console.log('📊 Assignments récupérées:', assignments?.length || 0);
      console.log('📋 Premières assignations:', assignments?.slice(0, 3));

      const producerIds = (assignments || []).map(a => a.assigned_to_id);
      console.log('🔍 Producer IDs extraits:', producerIds.slice(0, 5));
      
      if (producerIds.length === 0) {
        console.warn('⚠️ Aucun producteur assigné, retour liste vide');
        return [];
      }

      const { data, error } = await this.supabase
        .from('producers')
        .select(`
          *,
          cooperatives!producers_cooperative_id_fkey (
            name
          )
        `)
        .in('id', producerIds)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des producteurs:', error);
        throw error;
      }

      console.log('📊 Producteurs récupérés de la base:', data?.length || 0);
      console.log('📋 Premiers producteurs:', data?.slice(0, 3));

      const producersDisplay: ProducerDisplay[] = (data || []).map(producer => ({
        id: producer.id,
        name: formatProducerName(producer.first_name, producer.last_name),
        phone: producer.phone,
        location: formatLocation(producer.commune || '', producer.department || '', producer.region || ''),
        cooperativeName: producer.cooperatives?.name || 'Non assigné',
        isActive: producer.is_active || false,
        plotsCount: producer.plots?.length || 0,
        lastVisit: undefined // TODO: Implémenter la logique de dernière visite
      }));

      console.log('✅ Producteurs récupérés:', producersDisplay.length);
      return producersDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getProducers:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles pour un agent (version avec user_id)
   */
  static async getPlotsByUserId(userId: string): Promise<PlotDisplay[]> {
    try {
      console.log('🏞️ Récupération des parcelles pour l\'user_id:', userId);

      // D'abord récupérer le profile.id de l'agent
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'agent')
        .single();

      if (profileError || !profile) {
        console.error('❌ Profil agent non trouvé:', profileError);
        return [];
      }

      console.log('✅ Profil agent trouvé:', profile.id);
      return await this.getPlots(profile.id);

    } catch (error) {
      console.error('❌ Erreur générale dans getPlotsByUserId:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles pour un agent
   */
  static async getPlots(agentId: string): Promise<PlotDisplay[]> {
    try {
      console.log('🌾 Récupération des parcelles pour l\'agent:', agentId);

      // Plots liés à des producteurs assignés à l'agent (liste simple)
      const { data: assignments, error: assignErr } = await this.supabase
        .from('agent_assignments')
        .select('assigned_to_id')
        .eq('agent_id', agentId)
        .eq('assigned_to_type', 'producer');

      if (assignErr) {
        console.error('❌ Erreur lors de la récupération des affectations:', assignErr);
        throw assignErr;
      }

      const producerIds = (assignments || []).map(a => a.assigned_to_id);
      console.log('🔍 Producer IDs pour la requête farm_files:', producerIds.slice(0, 5));
      
      if (producerIds.length === 0) {
        console.warn('⚠️ Aucun producteur assigné, retour liste vide');
        return [];
      }

      const { data, error } = await this.supabase
        .from('plots')
        .select(`
          id,
          name_season_snapshot,
          area_hectares,
          cotton_variety,
          soil_type,
          water_source,
          status,
          center_point,
          producer_id
        `)
        .in('producer_id', producerIds)
        .order('name_season_snapshot', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des parcelles:', error);
        throw error;
      }

      console.log('📊 Parcelles récupérées de la base:', data?.length || 0);
      console.log('📋 Premières parcelles:', data?.slice(0, 3));

      if (!data || data.length === 0) {
        console.warn('⚠️ Aucune parcelle trouvée');
        return [];
      }

      // Récupérer les informations des producteurs séparément
      const { data: producersData, error: producersError } = await this.supabase
        .from('producers')
        .select('id, first_name, last_name')
        .in('id', producerIds);

      if (producersError) {
        console.error('❌ Erreur lors de la récupération des producteurs:', producersError);
        // Continuer sans les noms des producteurs
      }

      // Créer un map des producteurs pour un accès rapide
      const producersMap = new Map();
      if (producersData) {
        producersData.forEach(producer => {
          producersMap.set(producer.id, producer);
        });
      }

      const plotsDisplay: PlotDisplay[] = (data as any[] | null || []).map((row: any) => {
        let lat: number | undefined;
        let lon: number | undefined;
        if (row.center_point && typeof row.center_point === 'object' && 'coordinates' in row.center_point) {
          try {
            const coords = (row.center_point as any).coordinates;
            if (Array.isArray(coords) && coords.length >= 2) {
              lon = Number(coords[0]);
              lat = Number(coords[1]);
            }
          } catch {}
        }

        const producer = producersMap.get(row.producer_id);
        return {
          id: row.id,
          name: row.name_season_snapshot,
          area: row.area_hectares,
          producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
          variety: row.cotton_variety || undefined,
          location: undefined, // Pas de commune/village dans farm_file_plots
          soilType: row.soil_type || undefined,
          waterSource: row.water_source || undefined,
          status: (row.status as 'preparation' | 'cultivated' | 'fallow') || 'preparation',
          cropsCount: 0,
          lastOperation: undefined,
          hasGps: !!row.center_point && lat !== undefined && lon !== undefined,
          lat,
          lon,
        };
      });

      console.log('✅ Parcelles récupérées:', plotsDisplay.length);
      return plotsDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getPlots:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles d'une fiche
   */
  static async getFarmFilePlots(farmFileId: string) {
    try {
      const { data, error } = await this.supabase
        .from('plots')
        .select(`id, name_season_snapshot, area_hectares, cotton_variety`)
        .eq('farm_file_id', farmFileId)
        .order('name_season_snapshot', { ascending: true });

      if (error) {
        console.error('❌ Erreur récupération parcelles fiche:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('❌ Erreur générale dans getFarmFilePlots:', error);
      throw error;
    }
  }

  /**
   * Récupère les parcelles suivies par un agent (via coop de l'agent)
   * Source: plots (table principale des parcelles)
   * Utilise get_agent_plots_with_geolocation pour filtrage par assignments agent et calcul géolocalisation côté serveur
   */
  static async getAgentPlots(agentId: string, filters?: { query?: string, village?: string, crop?: string, status?: string }): Promise<PlotDisplay[]> {
    try {
      console.log('🌾 Récupération des parcelles via RPC pour l\'agent:', agentId, 'avec filtres:', filters);

      // Utiliser la nouvelle fonction RPC get_agent_plots_with_geolocation qui combine filtrage par assignments + géolocalisation serveur
      const { data: plots, error: rpcError } = await (this.supabase as any)
        .rpc('get_agent_plots_with_geolocation', {
          p_agent_user_id: agentId
        });

      if (rpcError) {
        console.error('❌ Erreur lors de l\'appel RPC get_agent_plots_with_geolocation:', rpcError);
        throw rpcError;
      }

      console.log('📋 Parcelles récupérées via RPC avec géolocalisation et filtrage agent:', plots?.length || 0, 'parcelles');
      console.log('📋 Détails des parcelles:', plots);

      if (!plots || plots.length === 0) {
        console.warn('⚠️ Aucune parcelle trouvée via RPC, retour liste vide');
        return [];
      }

      // Transformer les données RPC en format PlotDisplay
      const plotsDisplay: PlotDisplay[] = plots
        .map((plot: any) => {
          // Extraire les coordonnées du center_point JSON
          let lat: number | undefined;
          let lon: number | undefined;
          
          if (plot.center_point && plot.center_point.coordinates) {
            lon = plot.center_point.coordinates[0]; // longitude en premier
            lat = plot.center_point.coordinates[1]; // latitude en second
          }
          
          // Constructions du nom du producteur
          const producerName = plot.producer_name || '—';
          
          return {
            id: plot.id,
            name: plot.name_season_snapshot || plot.name || 'Parcelle sans nom',
            area: plot.area_hectares || 0,
            producerName,
            location: plot.location || 'Localisation non renseignée',
            variety: '', // À remplir via getCropsByPlotId
            soilType: plot.soil_type || '', // Maintenant disponible directement
            waterSource: plot.water_source || '', // Maintenant disponible directement
            status: (plot.status as 'preparation' | 'cultivated' | 'fallow') || 'preparation',
            cropsCount: 0,
            lastOperation: undefined,
            hasGps: plot.has_gps || false, // Utiliser le champ has_gps du RPC
            lat,
            lon,
          };
        })
        .filter((plot: PlotDisplay) => 
          // Ne garder que les parcelles avec coordonnées valides si GPS requis
          !plot.hasGps || (plot.lat !== undefined && plot.lon !== undefined)
        );

      console.log('✅ Parcelles transformées pour affichage avec GPS réel (filtrage agent assignations):', plotsDisplay.length);
      return plotsDisplay;
    } catch (error) {
      console.error('❌ Erreur générale dans getAgentPlots (RPC filtrée):', error);
      throw error;
    }
  }

  /**
   * Récupère les conseils (recommandations) pour une parcelle
   */
  static async getRecommendationsByPlotId(plotId: string): Promise<RecommendationDisplay[]> {
    try {
      console.log('💡 Récupération des conseils pour la parcelle:', plotId);

      // D'abord récupérer le producer_id depuis plots
      const { data: plotData, error: plotError } = await this.supabase
        .from('plots')
        .select('producer_id')
        .eq('id', plotId)
        .single();

      if (plotError || !plotData) {
        console.log('   ⚠️ Parcelle non trouvée, recherche sans producer_id filtré');
        const { data: noFilters, error: noFiltersError } = await this.supabase
          .from('recommendations')
          .select('*')
          .eq('plot_id', plotId)
          .order('created_at', { ascending: false });

        if (noFiltersError) {
          console.error('❌ Erreur lors de la récupération des conseils:', noFiltersError);
          throw noFiltersError;
        }

        return !noFilters ? [] : noFilters.map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          date: new Date(r.created_at || Date.now()).toLocaleDateString('fr-FR'),
          status: (r.status || 'pending') as string,
          type: r.recommendation_type,
        }));
      }

      const producerId = plotData.producer_id;
      console.log('   📋 Producer ID récupéré:', producerId);

      // Recherche les recommandations avec ce producer_id et optionnellement matching ideal plotId ou null
      let dataQuery = this.supabase
        .from('recommendations')
        .select('*')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false });

      const { data, error } = await dataQuery;

      if (error) {
        console.error('❌ Erreur lors de la récupération des conseils:', error);
        throw error;
      }

      if (!data) return [];

      return data
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          date: new Date(r.created_at || Date.now()).toLocaleDateString('fr-FR'),
          status: (r.status || 'pending') as string,
          type: r.recommendation_type,
        }));
    } catch (error) {
      console.error('❌ Erreur générale dans getRecommendationsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Récupère les 3 derniers conseils pour une parcelle
   */
  static async getLatestRecommendations(plotId: string): Promise<RecommendationDisplay[]> {
    try {
      console.log('💡 Récupération des derniers conseils pour la parcelle:', plotId);

      // D'abord récupérer le producer_id depuis plots 
      const { data: plotData, error: plotError } = await this.supabase
        .from('plots')
        .select('producer_id')
        .eq('id', plotId)
        .single();

      if (plotError || !plotData) {
        console.log('   ⚠️ Parcelle non trouvée, recherche des 3 dernières recommandations sans producer_id filtré');
        
        const { data: noFilters, error: noFiltersError } = await this.supabase
          .from('recommendations')
          .select('*')
          .eq('plot_id', plotId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (noFiltersError) {
          console.error('❌ Erreur récupération colonnes recommendations:', noFiltersError);
          return [];
        }
        
        return !noFilters ? [] : noFilters.map(rec => ({
          id: rec.id,
          title: rec.title,
          message: rec.message,
          type: rec.recommendation_type,
          status: rec.status,
          date: rec.created_at ? new Date(rec.created_at).toLocaleDateString('fr-FR') : 'N/A',
        }));
      }

      const producerId = plotData.producer_id;
      console.log('   📋 Producer ID récupéré:', producerId);

      const { data, error } = await this.supabase
        .from('recommendations')
        .select('*')
        .eq('producer_id', producerId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('❌ Erreur récupération des derniers conseils via producer:', error);
        return [];
      }
      
      return !data ? [] : data.map(rec => ({
        id: rec.id,
        title: rec.title,
        message: rec.message,
        type: rec.recommendation_type,
        status: rec.status,
        date: rec.created_at ? new Date(rec.created_at).toLocaleDateString('fr-FR') : 'N/A',
      }));
    } catch (err) {
      console.error('❌ Exception in getLatestRecommendations:', err);
      return [];
    }
  }

  /**
   * Récupère les 3 dernières opérations pour une parcelle
   */
  static async getLatestOperations(plotId: string): Promise<OperationDisplay[]> {
    try {
      console.log('🚜 RPC: Récupération des dernières opérations pour la parcelle:', plotId);
      const { data, error } = await (this.supabase as any)
        .rpc('get_operations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ Erreur RPC get_operations_for_plot (latest):', error);
        throw error;
      }
      if (!data) return [];
      
      // La RPC trie déjà par date, donc on prend juste les 3 premiers
      return data.slice(0, 3).map((op: any) => ({
        id: op.id,
        type: op.operation_type,
        product: op.product_used,
        description: op.description,
        date: new Date(op.operation_date).toLocaleDateString('fr-FR'),
        author: op.author_name || '',
        has_photos: op.has_photos || false
      }));
    } catch (err) {
      console.error('❌ Exception in getLatestOperations:', err);
      return [];
    }
  }

  /**
   * Récupère les 3 dernières observations pour une parcelle
   */
  static async getLatestObservations(plotId: string): Promise<ObservationDisplay[]> {
    try {
      const { data, error } = await (this.supabase as any)
        .rpc('get_observations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ Erreur RPC get_observations_for_plot (latest):', error);
        throw error;
      }
      if (!data) return [];
      
      const observations = data.slice(0, 3).map((obs: any) => ({
        id: obs.id,
        type: obs.observation_type as ObservationType,
        title: obs.observation_type ?? 'Observation',
        description: obs.description || '',
        date: new Date(obs.observation_date).toLocaleDateString('fr-FR'),
        severity: (obs.severity || 1) as 1 | 2 | 3 | 4 | 5,
        author: obs.author_name || '',
        has_photos: obs.has_photos || false
      }));
      
      console.log('🔍 [DEBUG] Observations récupérées:', observations);
      return observations;
    } catch (err) {
      console.error('❌ Exception in getLatestObservations:', err);
      return [];
    }
  }

  /**
   * Récupère les 3 derniers intrants pour une parcelle
   */
  static async getLatestInputs(plotId: string): Promise<InputDisplay[]> {
    try {
      console.log('📦 Récupération des derniers intrants pour la parcelle:', plotId);
      const { data, error } = await this.supabase
        .from('inputs')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('❌ Erreur lors de la récupération des derniers intrants:', error);
        throw error;
      }
      if (!data) return [];
      
      return data.map((input: any) => ({
        id: input.id,
        category: input.category,
        label: input.label || '',
        quantity: input.quantity || 0,
        unit: input.unit || '',
        date: new Date(input.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (err) {
      console.error('❌ Exception in getLatestInputs:', err);
      return [];
    }
  }

  /**
   * Récupère les participants (intervenants) pour une parcelle
   */
  static async getParticipantsByPlotId(plotId: string): Promise<ParticipantDisplay[]> {
    try {
      console.log('👥 Récupération des intervenants pour la parcelle:', plotId);
      
      const { data, error } = await this.supabase
        .from('participants')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des intervenants:', error);
        throw error;
      }
      
      if (!data) return [];
      
      const participantsDisplay: ParticipantDisplay[] = data.map(p => {
        const tags: string[] = [];
        if (p.literacy) tags.push('Alphabétisé(e)');
        if (p.languages && p.languages.length > 0) tags.push(...p.languages);
        
        let age: number | undefined;
        if (p.birthdate) {
          age = new Date().getFullYear() - new Date(p.birthdate).getFullYear();
        }

        return {
          id: p.id,
          name: p.name,
          role: p.role,
          age: age,
          tags: tags,
        };
      });

      console.log('✅ Intervenants récupérés:', participantsDisplay.length);
      return participantsDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getParticipantsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle observation pour une parcelle
   */
  static async createObservation(observationData: ObservationInsert): Promise<Observation | null> {
    try {
      console.log('➕ Création d\'une nouvelle observation:', observationData);
      
      const { data, error } = await this.supabase
        .from('observations')
        .insert(observationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de l\'observation:', error);
        throw error;
      }
      
      console.log('✅ Observation créée avec succès:', data);
      return data;

    } catch (error) {
      console.error('❌ Erreur générale dans createObservation:', error);
      throw error;
    }
  }

  /**
   * Récupère les observations pour une parcelle (plots)
   */
  static async getObservationsByPlotId(plotId: string): Promise<ObservationDisplay[]> {
    try {
      const { data, error } = await (this.supabase as any)
        .rpc('get_observations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ Erreur RPC get_observations_for_plot:', error);
        throw error;
      }
      if (!data) return [];
      
      return data.map((obs: any) => ({
        id: obs.id,
        title: `Observation du ${new Date(obs.observation_date).toLocaleDateString('fr-FR')}`,
        date: new Date(obs.observation_date).toLocaleDateString('fr-FR'),
        author: obs.author_name,
        type: obs.observation_type,
        severity: (obs.severity || 1) as 1 | 2 | 3 | 4 | 5,
        description: obs.description,
      }));
    } catch (err) {
      console.error('❌ Exception in getObservationsByPlotId:', err);
      return [];
    }
  }

  /**
   * Récupère une parcelle par son ID via fonction RPC
   */
  static async getPlotById(plotId: string, agentId?: string): Promise<PlotDisplay | null> {
    try {
      console.log('🌾 Récupération de la parcelle via RPC:', plotId, 'pour agent:', agentId);

      // Utiliser la fonction RPC pour récupérer la parcelle (pas besoin d'agentId pour cette RPC)
      const { data: plots, error: rpcError } = await (this.supabase as any)
        .rpc('get_plot_by_id', { 
          p_plot_id: plotId
        });

      if (rpcError) {
        console.error('❌ Erreur lors de l\'appel RPC get_plot_by_id:', rpcError);
        throw rpcError;
      }

      console.log('📋 Parcelle récupérée via RPC:', plots?.length || 0, 'parcelle(s)');

      if (!plots || plots.length === 0) {
        console.warn('⚠️ Aucune parcelle trouvée via RPC');
        return null;
      }

      const plot = plots[0];
      
      // Extraire les coordonnées du center_point JSON
      let lat: number | undefined;
      let lon: number | undefined;
      
      if (plot.center_point && plot.center_point.coordinates) {
        lon = plot.center_point.coordinates[0]; // longitude en premier
        lat = plot.center_point.coordinates[1]; // latitude en second
      }
      
      const plotDisplay: PlotDisplay = {
        id: plot.id,
        name: plot.name_season_snapshot || plot.name || 'Parcelle sans nom',
        area: plot.area_hectares || 0,
        producerName: plot.producer_name || '—',
        variety: plot.cotton_variety || '',
        soilType: plot.soil_type || '',
        waterSource: plot.water_source || '',
        status: (plot.status as 'preparation' | 'cultivated' | 'fallow') || 'preparation',
        cropsCount: 0, // À remplir via getCropsByPlotId
        lastOperation: undefined, // À remplir via getOperationsByPlotId
        hasGps: plot.has_gps || false,
        lat,
        lon,
        location: plot.location || 'Localisation non renseignée',
        createdBy: undefined, // Non disponible dans le RPC
        lastSync: plot.updated_at || undefined,
      };

      console.log('✅ Parcelle récupérée via RPC:', plotDisplay);
      return plotDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans getPlotById (RPC):', error);
      throw error;
    }
  }

  /**
   * Crée une entrée dans plots (nom minimal) et renvoie l'id
   */
  static async createBasePlot(name: string, producerId?: string | null) {
    const payload: any = { name };
    if (producerId) payload.producer_id = producerId;
    const { data, error } = await this.supabase
      .from('plots')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  /**
   * Crée une parcelle liée à la fiche (farm_file_plots)
   */
  static async createFarmFilePlot(params: {
    farmFileId: string;
    code: string; // name_season_snapshot
    areaHa: number;
    cottonVariety?: string;
    typology?: string;
    producerSize?: string;
    producerId?: string | null;
  }) {
    const plotId = await this.createBasePlot(params.code, params.producerId ?? null);
    const insertPayload: any = {
      farm_file_id: params.farmFileId,
      plot_id: plotId,
      name_season_snapshot: params.code,
      area_hectares: params.areaHa,
    };
    if (params.cottonVariety) insertPayload.cotton_variety = params.cottonVariety;
    if (params.typology) insertPayload.typology = params.typology;
    if (params.producerSize) insertPayload.producer_size = params.producerSize;
    if (params.producerId) insertPayload.producer_id = params.producerId;

    const { data, error } = await this.supabase
      .from('farm_file_plots')
      .insert(insertPayload)
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  /**
   * Crée une nouvelle fiche d'exploitation
   */
  static async createFarmFile(farmFileData: FarmFile): Promise<FarmFileDisplay> {
    try {
      console.log('📝 Création d\'une nouvelle fiche d\'exploitation:', farmFileData);

      const { data, error } = await this.supabase
        .from('farm_files')
        .insert(farmFileData)
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de la fiche:', error);
        throw error;
      }

      const producer = data.producers;
      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: 0,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation créée:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans createFarmFile:', error);
      throw error;
    }
  }

  /**
   * Met à jour une fiche d'exploitation
   */
  static async updateFarmFile(farmFileId: string, updates: Partial<FarmFile>): Promise<FarmFileDisplay> {
    try {
      console.log('📝 Mise à jour de la fiche d\'exploitation:', farmFileId, updates);

      const { data, error } = await this.supabase
        .from('farm_files')
        .update(updates)
        .eq('id', farmFileId)
        .select(`
          *,
          producers!farm_files_responsible_producer_id_fkey (
            first_name,
            last_name
          ),
          cooperatives!farm_files_cooperative_id_fkey (
            name
          ),
          plots (
            id
          )
        `)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la fiche:', error);
        throw error;
      }

      const producer = data.producers;
      const plots = data.plots || [];
      const completionStatus = calculateCompletionStatus(data);
      const completionPercent = calculateCompletionPercent(data);
      const syncStatus = getSyncStatus(data.updated_at, true);

      const farmFileDisplay: FarmFileDisplay = {
        id: data.id,
        name: data.name,
        producerName: producer ? formatProducerName(producer.first_name, producer.last_name) : 'Non assigné',
        location: formatLocation(data.commune, data.department, data.region),
        plotsCount: plots.length,
        status: data.status as string,
        completionStatus,
        completionPercent,
        syncStatus,
        lastUpdated: data.updated_at,
        createdBy: data.created_by,
        cooperativeId: data.cooperative_id
      };

      console.log('✅ Fiche d\'exploitation mise à jour:', farmFileDisplay);
      return farmFileDisplay;

    } catch (error) {
      console.error('❌ Erreur générale dans updateFarmFile:', error);
      throw error;
    }
  }

  /**
   * Supprime une fiche d'exploitation
   */
  static async deleteFarmFile(farmFileId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression de la fiche d\'exploitation:', farmFileId);

      const { error } = await this.supabase
        .from('farm_files')
        .delete()
        .eq('id', farmFileId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de la fiche:', error);
        throw error;
      }

      console.log('✅ Fiche d\'exploitation supprimée');
      return true;

    } catch (error) {
      console.error('❌ Erreur générale dans deleteFarmFile:', error);
      throw error;
    }
  }

  /**
   * Récupère l'ID de la coopérative d'un agent
   */
  private static async getAgentCooperative(agentId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('cooperative')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération de la coopérative:', error);
        throw error;
      }

      return data.cooperative || null;
    } catch (error) {
      console.error('❌ Erreur générale dans getAgentCooperative:', error);
      throw error;
    }
  }

  /**
   * Vérifie le statut de synchronisation
   */
  static async checkSyncStatus(): Promise<boolean> {
    try {
      // Test simple de connexion
      const { error } = await this.supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du statut de sync:', error);
      return false;
    }
  }

  /**
   * Récupère les opérations agricoles pour une parcelle
   */
  static async getOperationsByPlotId(plotId: string): Promise<OperationDisplay[]> {
    try {
      console.log('🚜 RPC: Récupération des opérations pour la parcelle:', plotId);
      const { data, error } = await (this.supabase as any)
        .rpc('get_operations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ Erreur RPC get_operations_for_plot:', error);
        throw error;
      }

      if (!data) return [];
      
      return data.map((op: any) => ({
        id: op.id,
        type: op.operation_type,
        product: op.product_used,
        description: op.description,
        date: new Date(op.operation_date).toLocaleDateString('fr-FR'),
        author: op.author_name || '',
      }));
    } catch (err) {
      console.error('❌ Exception in getOperationsByPlotId:', err);
      return [];
    }
  }

  static async addOperation(
    operationData: Omit<OperationInsert, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Operation> {
    try {
      console.log('➕ Ajout d\'une nouvelle opération:', operationData);
      const { data, error } = await this.supabase
        .from('operations')
        .insert(operationData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de l'ajout de l'opération:", error);
        throw error;
      }
      if (!data) throw new Error("Aucune donnée retournée après l'ajout.");

      console.log('✅ Opération ajoutée:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in addOperation:', err);
      throw err;
    }
  }

  static async updateOperation(
    operationId: string,
    updateData: Partial<OperationInsert>
  ): Promise<Operation> {
    try {
      console.log(`🔄 Mise à jour de l'opération ${operationId}:`, updateData);
      const { data, error } = await this.supabase
        .from('operations')
        .update(updateData)
        .eq('id', operationId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de l'opération:", error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Opération non trouvée ou accès refusé');
      }

      console.log('✅ Opération mise à jour:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in updateOperation:', err);
      throw err;
    }
  }

  static async deleteOperation(operationId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression de l'opération: ${operationId}`);
      const { error } = await this.supabase
        .from('operations')
        .delete()
        .eq('id', operationId);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'opération:', error);
        throw error;
      }
      console.log('✅ Opération supprimée');
    } catch (err) {
      console.error('❌ Exception in deleteOperation:', err);
      throw err;
    }
  }

  /**
   * Crée une nouvelle opération agricole
   */
  static async createOperation(operationData: OperationInsert): Promise<Operation> {
    try {
      console.log('➕ Création d\'une nouvelle opération:', operationData);

      const { data, error } = await this.supabase
        .from('operations')
        .insert(operationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de l\'opération:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée après la création de l\'opération.');
      }

      console.log('✅ Opération créée avec succès:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in createOperation:', err);
      throw err;
    }
  }

  /**
   * Récupère les intrants (inputs) pour une parcelle
   */
  static async getInputsByPlotId(plotId: string): Promise<InputDisplay[]> {
    try {
      console.log('📦 Récupération des intrants pour la parcelle:', plotId);

      const { data, error } = await this.supabase
        .from('inputs')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur lors de la récupération des intrants:', error);
        throw error;
      }

      if (!data) return [];

      return data.map(input => ({
        id: input.id,
        category: input.category,
        label: input.label || '',
        quantity: input.quantity || 0,
        unit: input.unit || '',
        date: new Date(input.created_at).toLocaleDateString('fr-FR'),
      }));
    } catch (err) {
      console.error('❌ Exception in getInputsByPlotId:', err);
      return [];
    }
  }

  /**
   * Récupère la culture active pour une parcelle donnée
   */
  static async getActiveCropByPlotId(plotId: string): Promise<Crop | null> {
    try {
      console.log('🌿 Récupération de la culture active pour la parcelle:', plotId);
      
      const { data, error } = await this.supabase
        .from('crops')
        .select('*')
        .eq('plot_id', plotId)
        .in('status', ['en_cours', 'active']) // Statuts considérés comme actifs
        .order('sowing_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Le 'single' ne trouve rien
          console.log(`🌾 Aucune culture active trouvée pour la parcelle ${plotId}.`);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la culture active:', error);
        throw error;
      }

      console.log('✅ Culture active trouvée:', data);
      return data;

    } catch (err) {
      console.error('❌ Exception in getActiveCropByPlotId:', err);
      return null;
    }
  }

  /**
   * Récupère toutes les cultures d'une parcelle
   */
  static async getCropsByPlotId(plotId: string, agentId?: string): Promise<Crop[]> {
    try {
      console.log('🌾 Récupération de toutes les cultures pour la parcelle:', plotId);

      // Utiliser la fonction RPC pour récupérer les cultures (pas besoin d'agentId pour cette RPC)
      const { data, error } = await (this.supabase as any)
        .rpc('get_crops_by_plot_id', {
          p_plot_id: plotId
        });

      if (error) {
        console.error('❌ Erreur lors de la récupération des cultures via RPC:', error);
        throw error;
      }

      console.log(`✅ ${data?.length || 0} culture(s) trouvée(s) pour la parcelle ${plotId}`);
      return data || [];

    } catch (err) {
      console.error('❌ Exception in getCropsByPlotId:', err);
      return [];
    }
  }

  /**
   * Crée un nouvel intrant (input)
   */
  static async createInput(inputData: InputInsert): Promise<Input> {
    try {
      console.log('📦 Création d’un nouvel intrant:', inputData);
      
      const { data, error } = await this.supabase
        .from('inputs')
        .insert(inputData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la création de l'intrant:", error);
        throw error;
      }

      console.log('✅ Intrant créé avec succès:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in createInput:', err);
      throw err;
    }
  }

  /**
   * Crée une nouvelle recommandation (conseil)
   */
  static async createRecommendation(recData: RecommendationInsert): Promise<Recommendation> {
    try {
      console.log('💡 Création d’une nouvelle recommandation:', recData);
      
      const { data, error } = await this.supabase
        .from('recommendations')
        .insert(recData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la création de la recommandation:", error);
        throw error;
      }

      console.log('✅ Recommandation créée avec succès:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in createRecommendation:', err);
      throw err;
    }
  }

  static async createCrop(cropData: { plot_id: string; season_id: string; crop_type: string; variety: string; sowing_date: string; status: string; created_by: string | null; }, agentId?: string): Promise<Crop> {
    try {
      console.log('🌱 Création d\'une nouvelle culture via RPC:', cropData, 'pour agent:', agentId);

      if (!agentId) {
        console.warn('⚠️ Agent ID manquant, impossible de créer la culture');
        throw new Error('Agent ID manquant');
      }

      // Utiliser la fonction RPC pour créer la culture
      const { data: cropId, error: rpcError } = await (this.supabase as any)
        .rpc('create_crop_for_agent', {
          p_plot_id: cropData.plot_id,
          p_crop_type: cropData.crop_type || 'Maize',
          p_variety: cropData.variety || 'Default Variety',
          p_sowing_date: cropData.sowing_date || new Date().toISOString(),
          p_agent_auth_id: agentId,
          p_season_id: cropData.season_id || null
        });

      if (rpcError) {
        console.error('❌ Erreur lors de l\'appel RPC create_crop_for_agent:', rpcError);
        throw rpcError;
      }

      if (!cropId) {
        throw new Error('Aucun ID de culture retourné par la fonction RPC');
      }

      // Récupérer la culture créée via fonction RPC
      const { data: crops, error: fetchError } = await (this.supabase as any)
        .rpc('get_crop_by_id', {
          p_crop_id: cropId,
          p_agent_auth_id: agentId
        });

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération de la culture créée via RPC:', fetchError);
        throw fetchError;
      }

      if (!crops || crops.length === 0) {
        throw new Error('Aucune culture trouvée après création');
      }

      const crop = crops[0];

      console.log('✅ Culture créée avec succès via RPC:', crop);
      return crop;
    } catch (err) {
      console.error('❌ Exception in createCrop (RPC):', err);
      throw err;
    }
  }

  /**
   * Récupère la saison agricole en cours
   */
  static async getCurrentSeason(): Promise<{ id: string; name: string } | null> {
    try {
      console.log('📅 Récupération de la saison en cours...');
      const { data, error } = await this.supabase
        .from('seasons')
        .select('id, label')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('⚠️ Aucune saison active trouvée pour la date actuelle.');
          return null;
        }
        console.error('❌ Erreur lors de la récupération de la saison:', error);
        throw error;
      }

      console.log('✅ Saison active trouvée:', data);
      return { id: data.id, name: data.label };
    } catch (err) {
      console.error('❌ Exception in getCurrentSeason:', err);
      throw err;
    }
  }

  /**
   * Met à jour une culture existante
   */
  static async updateCrop(cropId: string, cropData: {
    crop_type: string;
    variety: string;
    sowing_date: string;
    status: string;
  }, agentId: string): Promise<boolean> {
    try {
      console.log('🔄 Mise à jour de la culture:', cropId, cropData);

      if (!agentId) {
        console.warn('⚠️ Agent ID manquant, impossible de mettre à jour la culture');
        throw new Error('Agent ID manquant');
      }

      // Utiliser la fonction RPC pour mettre à jour la culture
      const { data, error } = await (this.supabase as any)
        .rpc('update_crop_for_agent', {
          p_crop_id: cropId,
          p_crop_type: cropData.crop_type,
          p_variety: cropData.variety,
          p_sowing_date: cropData.sowing_date,
          p_status: cropData.status,
          p_agent_auth_id: agentId
        });

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de la culture via RPC:', error);
        throw error;
      }

      console.log('✅ Culture mise à jour avec succès:', data);
      return true;
    } catch (err) {
      console.error('❌ Exception in updateCrop:', err);
      throw err;
    }
  }

  /**
   * Supprime une culture
   */
  static async deleteCrop(cropId: string, agentId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression de la culture:', cropId);

      if (!agentId) {
        console.warn('⚠️ Agent ID manquant, impossible de supprimer la culture');
        throw new Error('Agent ID manquant');
      }

      // Utiliser la fonction RPC pour supprimer la culture
      const { data, error } = await (this.supabase as any)
        .rpc('delete_crop_for_agent', {
          p_crop_id: cropId,
          p_agent_auth_id: agentId
        });

      if (error) {
        console.error('❌ Erreur lors de la suppression de la culture via RPC:', error);
        throw error;
      }

      console.log('✅ Culture supprimée avec succès:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in deleteCrop:', err);
      throw err;
    }
  }

  static async addParticipant(
    participantData: Omit<Database['public']['Tables']['participants']['Insert'], 'id' | 'created_at'>
  ): Promise<Database['public']['Tables']['participants']['Row']> {
    try {
      console.log('➕ Ajout d’un nouveau participant:', participantData);
      const { data, error } = await this.supabase
        .from('participants')
        .insert(participantData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de l'ajout du participant:", error);
        throw error;
      }
      if (!data) throw new Error("Aucune donnée retournée après l'ajout.");

      console.log('✅ Participant ajouté:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in addParticipant:', err);
      throw err;
    }
  }

  static async updateParticipant(
    participantId: string,
    updateData: Database['public']['Tables']['participants']['Update']
  ): Promise<Database['public']['Tables']['participants']['Row']> {
    try {
      console.log(`🔄 Mise à jour du participant ${participantId}:`, updateData);
      const { data, error } = await this.supabase
        .from('participants')
        .update(updateData)
        .eq('id', participantId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la mise à jour du participant:", error);
        throw error;
      }
      if (!data) throw new Error('Aucune donnée retournée après la mise à jour.');

      console.log('✅ Participant mis à jour:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in updateParticipant:', err);
      throw err;
    }
  }

  static async deleteParticipant(participantId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression du participant: ${participantId}`);
      const { error } = await this.supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        console.error('❌ Erreur lors de la suppression du participant:', error);
        throw error;
      }
      console.log('✅ Participant supprimé');
    } catch (err) {
      console.error('❌ Exception in deleteParticipant:', err);
      throw err;
    }
  }

  static async addInput(
    inputData: Omit<Database['public']['Tables']['inputs']['Insert'], 'id' | 'created_at'>
  ): Promise<Database['public']['Tables']['inputs']['Row']> {
    try {
      console.log('➕ Ajout d’un nouvel intrant:', inputData);
      const { data, error } = await this.supabase
        .from('inputs')
        .insert(inputData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de l'ajout de l'intrant:", error);
        throw error;
      }
      if (!data) throw new Error("Aucune donnée retournée après l'ajout.");

      console.log('✅ Intrant ajouté:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in addInput:', err);
      throw err;
    }
  }

  static async updateInput(
    inputId: string,
    updateData: Database['public']['Tables']['inputs']['Update']
  ): Promise<Database['public']['Tables']['inputs']['Row']> {
    try {
      console.log(`🔄 Mise à jour de l'intrant ${inputId}:`, updateData);
      const { data, error } = await this.supabase
        .from('inputs')
        .update(updateData)
        .eq('id', inputId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de l'intrant:", error);
        throw error;
      }
      if (!data) throw new Error('Aucune donnée retournée après la mise à jour.');

      console.log('✅ Intrant mis à jour:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in updateInput:', err);
      throw err;
    }
  }

  static async deleteInput(inputId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression de l'intrant: ${inputId}`);
      const { error } = await this.supabase
        .from('inputs')
        .delete()
        .eq('id', inputId);

      if (error) {
        console.error("❌ Erreur lors de la suppression de l'intrant:", error);
        throw error;
      }
      console.log('✅ Intrant supprimé');
    } catch (err) {
      console.error('❌ Exception in deleteInput:', err);
      throw err;
    }
  }

  static async addObservation(
    observationData: Omit<Database['public']['Tables']['observations']['Insert'], 'id' | 'created_at'>
  ): Promise<Database['public']['Tables']['observations']['Row']> {
    try {
      console.log('➕ Ajout d’une nouvelle observation:', observationData);
      const { data, error } = await this.supabase
        .from('observations')
        .insert(observationData)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de l'ajout de l'observation:", error);
        throw error;
      }
      if (!data) throw new Error("Aucune donnée retournée après l'ajout.");

      console.log('✅ Observation ajoutée:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in addObservation:', err);
      throw err;
    }
  }

  /**
   * Récupère toutes les observations des producteurs assignés à l'agent
   */
  static async getObservationsForAgent(
    agentId: string,
    limit: number = 50,
    offset: number = 0,
    observationTypeFilter?: string,
    severityFilter?: number
  ): Promise<GlobalObservationDisplay[]> {
    try {
      console.log('🔍 Récupération des observations pour l\'agent:', agentId);
      
      const { data, error } = await (this.supabase as any).rpc('get_observations_for_agent', {
        p_agent_id: agentId,
        p_limit_count: limit,
        p_offset_count: offset,
        p_observation_type_filter: observationTypeFilter || null,
        p_severity_filter: severityFilter || null
      });

      if (error) {
        console.error("❌ Erreur lors de la récupération des observations:", error);
        throw error;
      }

      if (!data) {
        console.log('📋 Aucune observation trouvée pour l\'agent');
        return [];
      }

      console.log(`✅ ${data.length} observation(s) récupérée(s) pour l'agent`);

      // Transformer les données en format d'affichage
      return data.map((obs: any) => {
        const type = this.mapObservationType(obs.observation_type);
        const { color, icon } = this.getObservationStyle(type, obs.severity);
        
        return {
          id: obs.id,
          title: this.getObservationTitle(obs.observation_type, obs.pest_disease_name),
          type,
          plotId: obs.plot_id,
          plotName: obs.plot_name,
          cropType: obs.crop_type || 'N/A',
          description: obs.description || obs.recommendations || 'Aucune description',
          severity: obs.severity || 1,
          status: obs.status || 'new',
          timestamp: obs.observation_date,
          isCritical: obs.is_critical,
          color,
          icon,
          pestDiseaseName: obs.pest_disease_name,
          emergencePercent: obs.emergence_percent,
          affectedAreaPercent: obs.affected_area_percent,
          recommendations: obs.recommendations,
          producerName: obs.producer_name,
          observedBy: obs.observed_by
        };
      });
    } catch (err) {
      console.error('❌ Exception in getObservationsForAgent:', err);
      throw err;
    }
  }

  /**
   * Mappe le type d'observation de la base vers le type d'affichage
   */
  private static mapObservationType(observationType: string): 'fertilization' | 'disease' | 'irrigation' | 'harvest' | 'other' {
    switch (observationType.toLowerCase()) {
      case 'ravageur':
      case 'maladie':
        return 'disease';
      case 'levée':
      case 'développement':
        return 'fertilization';
      case 'stress_hydrique':
        return 'irrigation';
      case 'stress_nutritionnel':
        return 'fertilization';
      default:
        return 'other';
    }
  }

  /**
   * Génère le titre de l'observation basé sur le type et les détails
   */
  private static getObservationTitle(observationType: string, pestDiseaseName?: string): string {
    switch (observationType.toLowerCase()) {
      case 'ravageur':
        return pestDiseaseName ? `Alerte ${pestDiseaseName}` : 'Alerte ravageur';
      case 'maladie':
        return pestDiseaseName ? `Alerte ${pestDiseaseName}` : 'Alerte maladie';
      case 'levée':
        return 'Problème de levée';
      case 'développement':
        return 'Suivi développement';
      case 'stress_hydrique':
        return 'Stress hydrique';
      case 'stress_nutritionnel':
        return 'Stress nutritionnel';
      default:
        return 'Observation terrain';
    }
  }

  /**
   * Détermine le style (couleur et icône) basé sur le type et la sévérité
   */
  private static getObservationStyle(type: string, severity: number): { color: string; icon: string } {
    if (severity >= 4) {
      return { color: '#ef4444', icon: 'alert-triangle' }; // Rouge pour critique
    }

    switch (type) {
      case 'fertilization':
        return { color: '#3b82f6', icon: 'trending-up' }; // Bleu pour fertilisation
      case 'disease':
        return { color: '#ef4444', icon: 'alert-triangle' }; // Rouge pour maladies
      case 'irrigation':
        return { color: '#3b82f6', icon: 'droplet' }; // Bleu pour irrigation
      case 'harvest':
        return { color: '#10b981', icon: 'scissors' }; // Vert pour récolte
      default:
        return { color: '#6b7280', icon: 'info' }; // Gris pour autre
    }
  }

  static async updateObservation(
    observationId: string,
    updateData: Database['public']['Tables']['observations']['Update']
  ): Promise<Database['public']['Tables']['observations']['Row']> {
    try {
      console.log(`🔄 Mise à jour de l'observation ${observationId}:`, updateData);
      const { data, error } = await this.supabase
        .from('observations')
        .update(updateData)
        .eq('id', observationId)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de l'observation:", error);
        throw error;
      }
      if (!data) throw new Error('Aucune donnée retournée après la mise à jour.');

      console.log('✅ Observation mise à jour:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in updateObservation:', err);
      throw err;
    }
  }

  static async deleteObservation(observationId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression de l'observation: ${observationId}`);
      const { error } = await this.supabase
        .from('observations')
        .delete()
        .eq('id', observationId);

      if (error) {
        console.error("❌ Erreur lors de la suppression de l'observation:", error);
        throw error;
      }
      console.log('✅ Observation supprimée');
    } catch (err) {
      console.error('❌ Exception in deleteObservation:', err);
      throw err;
    }
  }

  // ===== MÉTHODES CRUD POUR LES VISITES =====
  // Version: 1.0 - Méthodes CRUD pour les visites

  /**
   * Supprime une visite
   */
  static async deleteVisit(visitId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression de la visite: ${visitId}`);
      const { error } = await this.supabase
        .from('visits')
        .delete()
        .eq('id', visitId);

      if (error) {
        console.error("❌ Erreur lors de la suppression de la visite:", error);
        throw error;
      }
      console.log('✅ Visite supprimée');
    } catch (err) {
      console.error('❌ Exception in deleteVisit:', err);
      throw err;
    }
  }

  /**
   * Met à jour le statut d'une visite
   */
  static async updateVisitStatus(visitId: string, status: string): Promise<void> {
    try {
      console.log(`📝 Mise à jour du statut de la visite: ${visitId} -> ${status}`);
      const { error } = await this.supabase
        .from('visits')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de la visite:", error);
        throw error;
      }
      console.log('✅ Statut de la visite mis à jour');
    } catch (err) {
      console.error('❌ Exception in updateVisitStatus:', err);
      throw err;
    }
  }

  /**
   * Récupère une visite par son ID
   */
  static async getVisitById(visitId: string): Promise<any> {
    try {
      console.log(`🔍 Récupération de la visite: ${visitId}`);
      const { data, error } = await this.supabase
        .from('visits')
        .select(`
          *,
          agent:profiles!agent_id (
            id,
            phone,
            display_name
          ),
          producer:producers!producer_id (
            id,
            first_name,
            last_name,
            phone
          ),
          plot:plots!plot_id (
            id,
            name_season_snapshot,
            area_hectares
          )
        `)
        .eq('id', visitId)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur lors de la récupération de la visite:", error);
        throw error;
      }

      if (!data) {
        console.warn(`⚠️ Aucune visite trouvée avec l'ID ${visitId} (RLS ou visite inexistante)`);
        return null;
      }

      console.log('✅ Visite récupérée:', data);
      return data;
    } catch (err) {
      console.error('❌ Exception in getVisitById:', err);
      throw err;
    }
  }

  /**
   * Met à jour une visite complète via RPC
   */
  static async updateVisit(visitId: string, visitData: any): Promise<any> {
    try {
      console.log(`📝 Mise à jour de la visite via RPC: ${visitId}`);
      
      const { data, error } = await this.supabase
        .rpc('update_visit', {
          p_visit_id: visitId,
          p_visit_data: visitData
        });

      if (error) {
        console.error("❌ Erreur lors de la mise à jour de la visite:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la mise à jour de la visite');
      }
      
      console.log('✅ Visite mise à jour via RPC');
      return data.data;
    } catch (err) {
      console.error('❌ Exception in updateVisit:', err);
      throw err;
    }
  }

  /**
   * Supprime une visite via RPC
   */
  static async deleteVisit(visitId: string): Promise<any> {
    try {
      console.log(`🗑️ Suppression de la visite via RPC: ${visitId}`);
      
      const { data, error } = await this.supabase
        .rpc('delete_visit', {
          p_visit_id: visitId
        });

      if (error) {
        console.error("❌ Erreur lors de la suppression de la visite:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la suppression de la visite');
      }
      
      console.log('✅ Visite supprimée via RPC');
      return data.data;
    } catch (err) {
      console.error('❌ Exception in deleteVisit:', err);
      throw err;
    }
  }

  /**
   * Crée une visite via RPC
   */
  static async createVisit(agentId: string, visitData: any): Promise<any> {
    try {
      console.log(`📝 Création de la visite via RPC pour l'agent: ${agentId}`);
      
      const { data, error } = await this.supabase
        .rpc('create_visit', {
          p_agent_id: agentId,
          p_visit_data: visitData
        });

      if (error) {
        console.error("❌ Erreur lors de la création de la visite:", error);
        throw error;
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Échec de la création de la visite');
      }
      
      console.log('✅ Visite créée via RPC');
      return data.data;
    } catch (err) {
      console.error('❌ Exception in createVisit:', err);
      throw err;
    }
  }

  /**
   * Récupère une visite avec producteur et parcelle pour modification via RPC
   */
  static async getVisitForEdit(visitId: string): Promise<any | null> {
    try {
      console.log('🔍 Récupération de la visite pour modification:', visitId);

      const { data, error } = await this.supabase
        .rpc('get_visit_for_edit', { p_visit_id: visitId });

      if (error) {
        console.error('❌ Erreur lors de la récupération de la visite pour modification:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Détails:', error.details);
        return null;
      }

      if (!data) {
        console.log('⚠️ Visite non trouvée ou accès refusé');
        return null;
      }

      console.log('✅ Visite récupérée avec succès pour modification');
      console.log('   Producer:', data.producer?.first_name, data.producer?.last_name);
      console.log('   Plot:', data.plot?.name);
      console.log('   Agent:', data.agent?.display_name || 'Agent inconnu');
      
      return data;
    } catch (error) {
      console.error('❌ Erreur générale dans getVisitForEdit:', error);
      return null;
    }
  }
}
