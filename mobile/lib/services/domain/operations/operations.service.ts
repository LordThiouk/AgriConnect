/**
 * Service de gestion des opérations - AgriConnect
 * Extrait du CollecteService avec intégration du cache intelligent
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../../../lib/supabase-client';
import { Database } from '../../../../../types/database';
import { AgriConnectApiClientInstance } from '../../core/api';
import { OperationsCache } from './operations.cache';
import { 
  Operation, 
  OperationFilters, 
  OperationSort, 
  OperationCreateData, 
  OperationUpdateData, 
  OperationServiceOptions 
} from './operations.types';

class OperationsService {
  private supabase: SupabaseClient<Database> = supabase;
  private cache = new OperationsCache();

  /**
   * Récupère toutes les opérations d'une parcelle avec cache intelligent
   */
  async getOperationsByPlotId(
    plotId: string,
    filters?: OperationFilters,
    sort?: OperationSort,
    options: OperationServiceOptions = {}
  ): Promise<Operation[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🚜 [OperationsService] Récupération des opérations pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedOperations = await this.cache.getPlotOperations(plotId);
      if (cachedOperations) {
        console.log(`⚡ [OperationsService] Cache HIT: ${cachedOperations.length} opérations pour la parcelle ${plotId}`);
        return this.applyFiltersAndSort(cachedOperations, filters, sort);
      }
      console.log(`❌ [OperationsService] Cache MISS pour la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser le client API centralisé avec cache
      const response = await AgriConnectApiClientInstance.rpc({
        function: 'get_operations_for_plot',
        method: 'POST',
        args: { p_plot_id: plotId }
      });

      const supabaseResponse = response.data as { data?: any[]; error?: any };
      
      if (supabaseResponse.error) {
        console.error('❌ [OperationsService] Erreur RPC get_operations_for_plot:', supabaseResponse.error);
        throw new Error(supabaseResponse.error.message);
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [OperationsService] ${supabaseResponse.data?.length || 0} opérations récupérées en ${responseTime}ms`);

      const operations = supabaseResponse.data || [];

      // Mettre en cache si activé
      if (useCache && operations.length > 0) {
        await this.cache.setPlotOperations(plotId, operations, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return this.applyFiltersAndSort(operations, filters, sort);
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la récupération des opérations:', error);
      throw error;
    }
  }

  /**
   * Récupère les dernières opérations d'une parcelle avec cache
   */
  async getLatestOperations(
    plotId: string,
    limit: number = 5,
    options: OperationServiceOptions = {}
  ): Promise<Operation[]> {
    const { useCache = true, cacheTTL, refreshCache = false } = options;

    console.log('🚜 [OperationsService] Récupération des dernières opérations pour la parcelle:', plotId);

    // Vérifier le cache si activé
    if (useCache && !refreshCache) {
      const cachedOperations = await this.cache.getLatestOperations(plotId);
      if (cachedOperations) {
        console.log(`⚡ [OperationsService] Cache HIT: ${cachedOperations.length} dernières opérations pour la parcelle ${plotId}`);
        return cachedOperations.slice(0, limit);
      }
      console.log(`❌ [OperationsService] Cache MISS pour les dernières opérations de la parcelle ${plotId}`);
    }

    try {
      const startTime = Date.now();
      
      // Utiliser la RPC comme dans collecte.ts
      const { data, error } = await (this.supabase as any)
        .rpc('get_operations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ [OperationsService] Erreur RPC get_operations_for_plot (latest):', error);
        throw error;
      }

      const responseTime = Date.now() - startTime;
      console.log(`✅ [OperationsService] ${data?.length || 0} dernières opérations récupérées en ${responseTime}ms`);

      if (!data) return [];

      // Formater les données comme dans collecte.ts
      const operations = data.slice(0, limit).map((op: any) => ({
        id: op.id,
        type: op.operation_type,
        product: op.product_used,
        description: op.description,
        date: new Date(op.operation_date).toLocaleDateString('fr-FR'),
        author: op.author_name || '',
        has_photos: op.has_photos || false
      }));

      // Mettre en cache si activé
      if (useCache && operations.length > 0) {
        await this.cache.setLatestOperations(plotId, operations, typeof cacheTTL === 'number' ? cacheTTL : undefined);
      }

      return operations;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la récupération des dernières opérations:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle opération et invalide le cache
   */
  async createOperation(
    operationData: OperationCreateData,
    options: OperationServiceOptions = {}
  ): Promise<Operation> {
    console.log('🚜 [OperationsService] Création d\'une nouvelle opération:', operationData.operation_type);

    try {
      const { data, error } = await this.supabase
        .from('operations')
        .insert({
          plot_id: operationData.plot_id,
          crop_id: operationData.crop_id || '',
          operation_type: operationData.operation_type,
          operation_date: operationData.operation_date,
          description: operationData.description,
          quantity: operationData.quantity,
          unit: operationData.unit,
          cost: operationData.cost,
          status: operationData.status,
          created_by: operationData.created_by
        })
        .select(`
          *,
          plots!operations_plot_id_fkey (
            id,
            name,
            producers!plots_producer_id_fkey (
              id,
              name,
              cooperatives!producers_cooperative_id_fkey (
                id,
                name
              )
            )
          ),
          crops!operations_crop_id_fkey (
            id,
            crop_type,
            variety
          ),
          profiles!operations_created_by_fkey (
            id,
            display_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de la création de l\'opération:', error);
        throw error;
      }

      const operation = this.formatOperationData(data);

      // Invalider le cache
      await this.cache.invalidatePlotOperations(operationData.plot_id);
      if (operationData.crop_id) {
        await this.cache.invalidateCropOperations(operationData.crop_id);
      }

      console.log(`✅ [OperationsService] Opération créée avec succès: ${operation.operation_type}`);
      return operation;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la création de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Met à jour une opération et invalide le cache
   */
  async updateOperation(
    operationId: string,
    updateData: OperationUpdateData,
    options: OperationServiceOptions = {}
  ): Promise<Operation> {
    console.log('🚜 [OperationsService] Mise à jour de l\'opération:', operationId);

    try {
      const { data, error } = await this.supabase
        .from('operations')
        .update(updateData)
        .eq('id', operationId)
        .select(`
          *,
          plots!operations_plot_id_fkey (
            id,
            name,
            producers!plots_producer_id_fkey (
              id,
              name,
              cooperatives!producers_cooperative_id_fkey (
                id,
                name
              )
            )
          ),
          crops!operations_crop_id_fkey (
            id,
            crop_type,
            variety
          ),
          profiles!operations_created_by_fkey (
            id,
            display_name
          )
        `)
        .single();

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de la mise à jour de l\'opération:', error);
        throw error;
      }

      const operation = this.formatOperationData(data);

      // Invalider le cache
      if (operation.plot_id) {
        await this.cache.invalidatePlotOperations(operation.plot_id);
      }
      await this.cache.invalidateOperation(operationId);
      if (operation.crop_id) {
        await this.cache.invalidateCropOperations(operation.crop_id);
      }

      console.log(`✅ [OperationsService] Opération mise à jour avec succès: ${operation.operation_type}`);
      return operation;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la mise à jour de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Supprime une opération et invalide le cache
   */
  async deleteOperation(
    operationId: string,
    options: OperationServiceOptions = {}
  ): Promise<boolean> {
    console.log('🚜 [OperationsService] Suppression de l\'opération:', operationId);

    try {
      // Récupérer l'opération avant suppression pour obtenir le plot_id et crop_id
      const { data: operation, error: fetchError } = await this.supabase
        .from('operations')
        .select('plot_id, crop_id')
        .eq('id', operationId)
        .single();

      if (fetchError) {
        console.error('❌ [OperationsService] Erreur lors de la récupération de l\'opération:', fetchError);
        throw fetchError;
      }

      const { error } = await this.supabase
        .from('operations')
        .delete()
        .eq('id', operationId);

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de la suppression de l\'opération:', error);
        throw error;
      }

      // Invalider le cache
      if (operation) {
        await this.cache.invalidatePlotOperations(operation.plot_id || '');
        await this.cache.invalidateOperation(operationId);
        if (operation.crop_id && operation.crop_id !== null) {
          await this.cache.invalidateCropOperations(operation.crop_id);
        }
      }

      console.log(`✅ [OperationsService] Opération supprimée avec succès: ${operationId}`);
      return true;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la suppression de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Applique les filtres et le tri aux opérations
   */
  private applyFiltersAndSort(
    operations: Operation[], 
    filters?: OperationFilters, 
    sort?: OperationSort
  ): Operation[] {
    let filteredOperations = [...operations];

    // Appliquer les filtres
    if (filters) {
      if (filters.plot_id) {
        filteredOperations = filteredOperations.filter(op => op.plot_id === filters.plot_id);
      }

      if (filters.crop_id) {
        filteredOperations = filteredOperations.filter(op => op.crop_id === filters.crop_id);
      }

      if (filters.operation_type) {
        filteredOperations = filteredOperations.filter(op => op.operation_type === filters.operation_type);
      }

      // Note: status field not available in operations table schema

      if (filters.date_from) {
        filteredOperations = filteredOperations.filter(op => op.operation_date >= filters.date_from!);
      }

      if (filters.date_to) {
        filteredOperations = filteredOperations.filter(op => op.operation_date <= filters.date_to!);
      }
    }

    // Appliquer le tri
    if (sort) {
      filteredOperations.sort((a, b) => {
        const aValue = a[sort.field as keyof Operation];
        const bValue = b[sort.field as keyof Operation];
        
        if (sort.direction === 'asc') {
          return (aValue || '') > (bValue || '') ? 1 : -1;
        } else {
          return (aValue || '') < (bValue || '') ? 1 : -1;
        }
      });
    }

    return filteredOperations;
  }

  /**
   * Formate les données d'une opération
   */
  private formatOperationData(data: any): Operation {
    return {
      id: data.id,
      plot_id: data.plot_id,
      crop_id: data.crop_id,
      operation_type: data.operation_type,
      operation_date: data.operation_date,
      description: data.description,
      total_dose: data.total_dose,
      unit: data.unit,
      total_cost: data.total_cost,
      created_at: data.created_at,
      updated_at: data.updated_at,
      performer_id: data.performer_id,
      cost_per_hectare: data.cost_per_hectare || null,
      dose_per_hectare: data.dose_per_hectare || null,
      notes: data.notes || null,
      performer_type: data.performer_type || null,
      product_used: data.product_used || null
    };
  }

  /**
   * Formate les données de plusieurs opérations
   */
  private formatOperationsData(data: any[]): Operation[] {
    return data.map(operation => this.formatOperationData(operation));
  }

  /**
   * Invalide le cache des opérations d'une parcelle
   */
  async invalidatePlotCache(plotId: string): Promise<void> {
    await this.cache.invalidatePlotOperations(plotId);
  }

  /**
   * Invalide le cache d'une opération spécifique
   */
  async invalidateOperationCache(operationId: string): Promise<void> {
    await this.cache.invalidateOperation(operationId);
  }

  /**
   * Invalide tout le cache des opérations
   */
  async invalidateAllCache(): Promise<void> {
    await this.cache.invalidateAll();
  }

  /**
   * Récupère les opérations d'une parcelle (méthode manquante de CollecteService)
   */
  async getOperationsByPlotId(
    plotId: string,
    options: OperationServiceOptions = {}
  ): Promise<any[]> {
    console.log('🚜 [OperationsService] Récupération des opérations pour la parcelle:', plotId);
    
    try {
      const { data, error } = await (this.supabase as any)
        .rpc('get_operations_for_plot', { p_plot_id: plotId });

      if (error) {
        console.error('❌ [OperationsService] Erreur RPC get_operations_for_plot:', error);
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
    } catch (error) {
      console.error('❌ [OperationsService] Erreur générale dans getOperationsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle opération (méthode manquante de CollecteService)
   */
  async addOperation(operationData: any): Promise<any> {
    try {
      console.log('🚜 [OperationsService] Ajout d\'une nouvelle opération:', operationData);
      
      const { data, error } = await this.supabase
        .from('operations')
        .insert(operationData)
        .select()
        .single();

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de l\'ajout de l\'opération:', error);
        throw error;
      }

      console.log('✅ [OperationsService] Opération ajoutée avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de l\'ajout de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Met à jour une opération existante (méthode manquante de CollecteService)
   */
  async updateOperation(operationId: string, operationData: any): Promise<any> {
    try {
      console.log('🚜 [OperationsService] Mise à jour de l\'opération:', operationId, operationData);
      
      const { data, error } = await this.supabase
        .from('operations')
        .update(operationData)
        .eq('id', operationId)
        .select()
        .single();

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de la mise à jour de l\'opération:', error);
        throw error;
      }

      console.log('✅ [OperationsService] Opération mise à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la mise à jour de l\'opération:', error);
      throw error;
    }
  }

  /**
   * Supprime une opération (méthode manquante de CollecteService)
   */
  async deleteOperation(operationId: string): Promise<void> {
    try {
      console.log('🚜 [OperationsService] Suppression de l\'opération:', operationId);
      
      const { error } = await this.supabase
        .from('operations')
        .delete()
        .eq('id', operationId);

      if (error) {
        console.error('❌ [OperationsService] Erreur lors de la suppression de l\'opération:', error);
        throw error;
      }

      console.log('✅ [OperationsService] Opération supprimée avec succès');
    } catch (error) {
      console.error('❌ [OperationsService] Erreur lors de la suppression de l\'opération:', error);
      throw error;
    }
  }
}

export const OperationsServiceInstance = new OperationsService();
