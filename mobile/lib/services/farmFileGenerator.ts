/**
 * Service pour générer automatiquement des fiches d'exploitation
 * à partir des données existantes (agents, producteurs, parcelles)
 */

import { supabase } from '../supabase';
import { Database } from '../../types/database';

type FarmFile = Database['public']['Tables']['farm_files']['Row'];
type FarmFileInsert = Database['public']['Tables']['farm_files']['Insert'];
type Producer = Database['public']['Tables']['producers']['Row'];
type Plot = Database['public']['Tables']['plots']['Row'];
type AgentAssignment = Database['public']['Tables']['agent_assignments']['Row'];

export interface FarmFileGenerationResult {
  success: boolean;
  farmFilesCreated: number;
  errors: string[];
  farmFileIds: string[];
}

export class FarmFileGenerator {
  /**
   * Génère des fiches d'exploitation pour un agent spécifique
   * à partir de ses producteurs assignés
   */
  static async generateFarmFilesForAgent(agentId: string): Promise<FarmFileGenerationResult> {
    const result: FarmFileGenerationResult = {
      success: false,
      farmFilesCreated: 0,
      errors: [],
      farmFileIds: []
    };

    try {
      // 1. Récupérer les producteurs assignés à l'agent
      const { data: assignments, error: assignmentsError } = await supabase
        .from('agent_assignments')
        .select(`
          assigned_to_id
        `)
        .eq('agent_id', agentId)
        .eq('assigned_to_type', 'producer');
      
      if (assignmentsError) {
        result.errors.push(`Erreur lors de la récupération des assignations: ${assignmentsError.message}`);
        return result;
      }

      const producerIds = (assignments || []).map(a => a.assigned_to_id);
      
      // Maintenant récupérer les producteurs complets
      const { data: producers, error: producersError } = await supabase
        .from('producers')
        .select(`
          id,
          first_name,
          last_name,
          village,
          commune,
          department,
          region,
          cooperative_id,
          cooperatives!inner(
            id,
            name
          )
        `)
        .in('id', producerIds);

      if (producersError) {
        result.errors.push(`Erreur lors de la récupération des producteurs: ${producersError.message}`);
        return result;
      }

      if (!producers || producers.length === 0) {
        result.errors.push('Aucun producteur assigné à cet agent');
        return result;
      }

      // 2. Pour chaque producteur, créer une fiche d'exploitation
      for (const producer of producers) {
        
        try {
          // Vérifier si une fiche existe déjà pour ce producteur
          const { data: existingFarmFile } = await supabase
            .from('farm_files')
            .select('id')
            .eq('responsible_producer_id', producer.id)
            .eq('created_by', agentId)
            .single();

          if (existingFarmFile) {
            console.log(`Fiche déjà existante pour le producteur ${producer.first_name} ${producer.last_name}`);
            continue;
          }

          // Récupérer les parcelles du producteur
          const { data: plots, error: plotsError } = await supabase
            .from('plots')
            .select('id, name, area_hectares, soil_type, water_source')
            .eq('producer_id', producer.id);

          if (plotsError) {
            result.errors.push(`Erreur lors de la récupération des parcelles pour ${producer.first_name}: ${plotsError.message}`);
            continue;
          }

          // Créer la fiche d'exploitation
          const farmFileData: FarmFileInsert = {
            name: `Fiche Exploitation - ${producer.first_name} ${producer.last_name}`,
            region: producer.region || 'Non spécifié',
            department: producer.department || 'Non spécifié',
            commune: producer.commune || 'Non spécifié',
            village: producer.village || 'Non spécifié',
            sector: producer.commune || 'Non spécifié',
            cooperative_id: producer.cooperative_id,
            responsible_producer_id: producer.id,
            census_date: new Date().toISOString().split('T')[0],
            material_inventory: {
              plots_count: plots?.length || 0,
              total_area_hectares: plots?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0,
              soil_types: [...new Set(plots?.map(p => p.soil_type).filter(Boolean))] || [],
              water_sources: [...new Set(plots?.map(p => p.water_source).filter(Boolean))] || [],
              generated_at: new Date().toISOString(),
              generated_by: 'system'
            },
            created_by: agentId,
            status: 'draft'
          };

          const { data: farmFile, error: farmFileError } = await supabase
            .from('farm_files')
            .insert(farmFileData)
            .select('id')
            .single();

          if (farmFileError) {
            result.errors.push(`Erreur lors de la création de la fiche pour ${producer.first_name}: ${farmFileError.message}`);
            continue;
          }

          result.farmFileIds.push(farmFile.id);
          result.farmFilesCreated++;

        } catch (error) {
          result.errors.push(`Erreur lors du traitement du producteur ${producer.first_name}: ${error}`);
        }
      }

      result.success = result.farmFilesCreated > 0;
      return result;

    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`);
      return result;
    }
  }

  /**
   * Génère des fiches d'exploitation pour tous les agents
   */
  static async generateFarmFilesForAllAgents(): Promise<FarmFileGenerationResult> {
    const result: FarmFileGenerationResult = {
      success: false,
      farmFilesCreated: 0,
      errors: [],
      farmFileIds: []
    };

    try {
      // Récupérer tous les agents
      const { data: agents, error: agentsError } = await supabase
        .from('profiles')
        .select('id, phone, first_name, last_name')
        .eq('role', 'agent');

      if (agentsError) {
        result.errors.push(`Erreur lors de la récupération des agents: ${agentsError.message}`);
        return result;
      }

      if (!agents || agents.length === 0) {
        result.errors.push('Aucun agent trouvé');
        return result;
      }

      // Générer des fiches pour chaque agent
      for (const agent of agents) {
        const agentResult = await this.generateFarmFilesForAgent(agent.id);
        
        result.farmFilesCreated += agentResult.farmFilesCreated;
        result.farmFileIds.push(...agentResult.farmFileIds);
        result.errors.push(...agentResult.errors);
      }

      result.success = result.farmFilesCreated > 0;
      return result;

    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`);
      return result;
    }
  }

  /**
   * Met à jour une fiche d'exploitation existante avec les données actuelles
   */
  static async updateFarmFileFromData(farmFileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Récupérer la fiche existante
      const { data: farmFile, error: farmFileError } = await supabase
        .from('farm_files')
        .select(`
          id,
          responsible_producer_id,
          producers!inner(
            id,
            first_name,
            last_name,
            village,
            commune,
            department,
            region
          )
        `)
        .eq('id', farmFileId)
        .single();

      if (farmFileError || !farmFile) {
        return { success: false, error: 'Fiche non trouvée' };
      }

      const producer = farmFile.producers as any;

      // Récupérer les parcelles actuelles
      const { data: plots, error: plotsError } = await supabase
        .from('plots')
        .select('id, name, area_hectares, soil_type, water_source')
        .eq('producer_id', producer.id);

      if (plotsError) {
        return { success: false, error: `Erreur lors de la récupération des parcelles: ${plotsError.message}` };
      }

      // Mettre à jour l'inventaire matériel
      const updatedInventory = {
        plots_count: plots?.length || 0,
        total_area_hectares: plots?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0,
        soil_types: [...new Set(plots?.map(p => p.soil_type).filter(Boolean))] || [],
        water_sources: [...new Set(plots?.map(p => p.water_source).filter(Boolean))] || [],
        updated_at: new Date().toISOString(),
        updated_by: 'system'
      };

      const { error: updateError } = await supabase
        .from('farm_files')
        .update({
          material_inventory: updatedInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', farmFileId);

      if (updateError) {
        return { success: false, error: `Erreur lors de la mise à jour: ${updateError.message}` };
      }

      return { success: true };

    } catch (error) {
      return { success: false, error: `Erreur générale: ${error}` };
    }
  }

  /**
   * Synchronise toutes les fiches d'exploitation avec les données actuelles
   */
  static async syncAllFarmFiles(): Promise<{ success: boolean; updated: number; errors: string[] }> {
    const result = {
      success: false,
      updated: 0,
      errors: [] as string[]
    };

    try {
      // Récupérer toutes les fiches d'exploitation
      const { data: farmFiles, error: farmFilesError } = await supabase
        .from('farm_files')
        .select('id, name');

      if (farmFilesError) {
        result.errors.push(`Erreur lors de la récupération des fiches: ${farmFilesError.message}`);
        return result;
      }

      if (!farmFiles || farmFiles.length === 0) {
        result.errors.push('Aucune fiche d\'exploitation trouvée');
        return result;
      }

      // Mettre à jour chaque fiche
      for (const farmFile of farmFiles) {
        const updateResult = await this.updateFarmFileFromData(farmFile.id);
        
        if (updateResult.success) {
          result.updated++;
        } else {
          result.errors.push(`Erreur pour la fiche ${farmFile.name}: ${updateResult.error}`);
        }
      }

      result.success = result.updated > 0;
      return result;

    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`);
      return result;
    }
  }
}
