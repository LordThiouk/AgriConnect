/**
 * Service pour la gestion des intrants agricoles
 */

import { supabase } from '../../../../lib/supabase-client';
import { agriConnectCache } from '../../core/cache';
import { InputsCache } from './inputs.cache';
import {
  Input,
  InputCreate,
  InputUpdate,
  InputFilters,
  InputStats,
  InputWithDetails
} from './inputs.types';

export class InputsService {
  private cache: InputsCache;
  private supabase: any;

  constructor() {
    this.cache = new InputsCache(agriConnectCache);
    this.supabase = supabase;
  }

  /**
   * Récupérer tous les intrants avec filtres optionnels
   */
  async getAll(filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getList(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour liste intrants');
        return cached;
      }

      console.log('🔧 Récupération des intrants depuis la base');

      let query = supabase
        .from('inputs')
        .select('*')
        .order('name', { ascending: true });

      // Appliquer les filtres
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available);
      }
      if (filters?.supplier) {
        query = query.eq('supplier', filters.supplier);
      }
      if (filters?.brand) {
        query = query.eq('brand', filters.brand);
      }
      if (filters?.price_min) {
        query = query.gte('price_per_unit', filters.price_min);
      }
      if (filters?.price_max) {
        query = query.lte('price_per_unit', filters.price_max);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors de la récupération des intrants:', error);
        throw error;
      }

      const inputs = data || [];
      
      // Mettre en cache
      await this.cache.setList(inputs, filters);
      
      console.log(`✅ ${inputs.length} intrants récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getAll:', error);
      throw error;
    }
  }

  /**
   * Récupérer un intrant par ID
   */
  async getById(id: string): Promise<Input | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItem(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrant:', id);
        return cached;
      }

      console.log('🔧 Récupération de l\'intrant:', id);

      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Intrant non trouvé:', id);
          return null;
        }
        console.error('❌ Erreur lors de la récupération de l\'intrant:', error);
        throw error;
      }

      // Mettre en cache
      if (data) {
        await this.cache.setItem(id, data);
      }

      console.log('✅ Intrant récupéré:', data?.name);
      return data;

    } catch (error) {
      console.error('❌ Erreur InputsService.getById:', error);
      throw error;
    }
  }

  /**
   * Récupérer un intrant avec ses détails
   */
  async getByIdWithDetails(id: string): Promise<InputWithDetails | null> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getItemWithDetails(id);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrant avec détails:', id);
        return cached;
      }

      console.log('🔧 Récupération de l\'intrant avec détails:', id);

      // Récupérer l'intrant
      const input = await this.getById(id);
      if (!input) {
        return null;
      }

      // Récupérer les statistiques d'utilisation
      const { data: usageData } = await supabase
        .from('operations')
        .select('id, operation_date, product_used')
        .eq('product_used', input.name)
        .order('operation_date', { ascending: false })
        .limit(10);

      const usageCount = usageData?.length || 0;
      const lastUsed = usageData?.[0]?.operation_date;

      const result: InputWithDetails = {
        ...input,
        usage_count: usageCount,
        last_used: lastUsed,
        related_operations: usageData?.map(op => op.id) || []
      };

      // Mettre en cache
      await this.cache.setItemWithDetails(id, result);

      console.log('✅ Intrant avec détails récupéré:', input.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur InputsService.getByIdWithDetails:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intrants par type
   */
  async getByType(type: string, filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByType(type, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrants par type:', type);
        return cached;
      }

      console.log('🔧 Récupération des intrants par type:', type);

      const typeFilters = { ...filters, type: type as any };
      const inputs = await this.getAll(typeFilters);

      // Mettre en cache par type
      await this.cache.setByType(type, inputs, filters);

      console.log(`✅ ${inputs.length} intrants de type ${type} récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getByType:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intrants par catégorie
   */
  async getByCategory(category: string, filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getByCategory(category, filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrants par catégorie:', category);
        return cached;
      }

      console.log('🔧 Récupération des intrants par catégorie:', category);

      const categoryFilters = { ...filters, category: category as any };
      const inputs = await this.getAll(categoryFilters);

      // Mettre en cache par catégorie
      await this.cache.setByCategory(category, inputs, filters);

      console.log(`✅ ${inputs.length} intrants de catégorie ${category} récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getByCategory:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intrants disponibles
   */
  async getAvailable(filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getAvailable(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrants disponibles');
        return cached;
      }

      console.log('🔧 Récupération des intrants disponibles');

      const availableFilters = { ...filters, is_available: true };
      const inputs = await this.getAll(availableFilters);

      // Mettre en cache
      await this.cache.setAvailable(inputs, filters);

      console.log(`✅ ${inputs.length} intrants disponibles récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getAvailable:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intrants en rupture de stock
   */
  async getOutOfStock(filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getOutOfStock(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrants en rupture');
        return cached;
      }

      console.log('🔧 Récupération des intrants en rupture de stock');

      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .or('stock_quantity.is.null,stock_quantity.eq.0')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des intrants en rupture:', error);
        throw error;
      }

      const inputs = data || [];

      // Mettre en cache
      await this.cache.setOutOfStock(inputs, filters);

      console.log(`✅ ${inputs.length} intrants en rupture de stock récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getOutOfStock:', error);
      throw error;
    }
  }

  /**
   * Récupérer les intrants à stock faible
   */
  async getLowStock(filters?: InputFilters): Promise<Input[]> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getLowStock(filters);
      if (cached) {
        console.log('⚡ [CACHE] Hit pour intrants à stock faible');
        return cached;
      }

      console.log('🔧 Récupération des intrants à stock faible');

      const { data, error } = await supabase
        .from('inputs')
        .select('*')
        .not('stock_quantity', 'is', null)
        .not('minimum_stock', 'is', null)
        .lte('stock_quantity', 'minimum_stock')
        .order('name', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des intrants à stock faible:', error);
        throw error;
      }

      const inputs = data || [];

      // Mettre en cache
      await this.cache.setLowStock(inputs, filters);

      console.log(`✅ ${inputs.length} intrants à stock faible récupérés`);
      return inputs;

    } catch (error) {
      console.error('❌ Erreur InputsService.getLowStock:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel intrant
   */
  async create(data: InputCreate): Promise<Input> {
    try {
      console.log('🔧 Création d\'un nouvel intrant:', data.name);

      const { data: result, error } = await supabase
        .from('inputs')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la création de l\'intrant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateList();
      await this.cache.invalidateByType(result.type);
      await this.cache.invalidateByCategory(result.category);
      await this.cache.invalidateStock();
      await this.cache.invalidateStats();

      console.log('✅ Intrant créé:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur InputsService.create:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un intrant
   */
  async update(id: string, data: InputUpdate): Promise<Input> {
    try {
      console.log('🔧 Mise à jour de l\'intrant:', id);

      const { data: result, error } = await supabase
        .from('inputs')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour de l\'intrant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateByType(result.type);
      await this.cache.invalidateByCategory(result.category);
      await this.cache.invalidateStock();
      await this.cache.invalidateStats();

      console.log('✅ Intrant mis à jour:', result.name);
      return result;

    } catch (error) {
      console.error('❌ Erreur InputsService.update:', error);
      throw error;
    }
  }

  /**
   * Supprimer un intrant
   */
  async delete(id: string): Promise<void> {
    try {
      console.log('🔧 Suppression de l\'intrant:', id);

      const { error } = await supabase
        .from('inputs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erreur lors de la suppression de l\'intrant:', error);
        throw error;
      }

      // Invalider le cache
      await this.cache.invalidateItem(id);
      await this.cache.invalidateList();
      await this.cache.invalidateStock();
      await this.cache.invalidateStats();

      console.log('✅ Intrant supprimé:', id);

    } catch (error) {
      console.error('❌ Erreur InputsService.delete:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des intrants
   */
  async getStats(): Promise<InputStats> {
    try {
      // Vérifier le cache d'abord
      const cached = await this.cache.getStats();
      if (cached) {
        console.log('⚡ [CACHE] Hit pour stats intrants');
        return cached;
      }

      console.log('🔧 Récupération des statistiques des intrants');

      const { data, error } = await supabase
        .from('inputs')
        .select('type, category, is_available, stock_quantity, minimum_stock, price_per_unit');

      if (error) {
        console.error('❌ Erreur lors de la récupération des stats:', error);
        throw error;
      }

      const inputs = data || [];
      
      const stats: InputStats = {
        total_inputs: inputs.length,
        available_inputs: inputs.filter(i => i.is_available).length,
        out_of_stock_inputs: inputs.filter(i => !i.stock_quantity || i.stock_quantity === 0).length,
        low_stock_inputs: inputs.filter(i => 
          i.stock_quantity && i.minimum_stock && i.stock_quantity <= i.minimum_stock
        ).length,
        by_type: inputs.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_category: inputs.reduce((acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_supplier: inputs.reduce((acc, i) => {
          const supplier = (i as any).supplier;
          if (supplier) {
            acc[supplier] = (acc[supplier] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        total_value: inputs.reduce((acc, i) => {
          const value = (i.stock_quantity || 0) * (i.price_per_unit || 0);
          return acc + value;
        }, 0),
        average_price: inputs.reduce((acc, i) => acc + (i.price_per_unit || 0), 0) / inputs.length || 0
      };

      // Mettre en cache
      await this.cache.setStats(stats);

      console.log('✅ Statistiques des intrants récupérées');
      return stats;

    } catch (error) {
      console.error('❌ Erreur InputsService.getStats:', error);
      throw error;
    }
  }

  /**
   * Récupère les derniers intrants d'une parcelle (méthode manquante de CollecteService)
   */
  async getLatestInputs(plotId: string): Promise<any[]> {
    try {
      console.log('📦 [InputsService] Récupération des derniers intrants pour la parcelle:', plotId);
      
      const { data, error } = await this.supabase
        .from('inputs')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('❌ [InputsService] Erreur lors de la récupération des derniers intrants:', error);
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
    } catch (error) {
      console.error('❌ [InputsService] Erreur générale dans getLatestInputs:', error);
      throw error;
    }
  }

  /**
   * Récupère les intrants d'une parcelle (méthode manquante de CollecteService)
   */
  async getInputsByPlotId(plotId: string): Promise<any[]> {
    try {
      console.log('📦 [InputsService] Récupération des intrants pour la parcelle:', plotId);

      const { data, error } = await this.supabase
        .from('inputs')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [InputsService] Erreur lors de la récupération des intrants:', error);
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
    } catch (error) {
      console.error('❌ [InputsService] Erreur générale dans getInputsByPlotId:', error);
      throw error;
    }
  }

  /**
   * Ajoute un nouvel intrant (méthode manquante de CollecteService)
   */
  async addInput(inputData: any): Promise<any> {
    try {
      console.log('📦 [InputsService] Ajout d\'un nouvel intrant:', inputData);
      
      const { data, error } = await this.supabase
        .from('inputs')
        .insert(inputData)
        .select()
        .single();

      if (error) {
        console.error('❌ [InputsService] Erreur lors de l\'ajout de l\'intrant:', error);
        throw error;
      }

      console.log('✅ [InputsService] Intrant ajouté avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ [InputsService] Erreur lors de l\'ajout de l\'intrant:', error);
      throw error;
    }
  }

  /**
   * Met à jour un intrant existant (méthode manquante de CollecteService)
   */
  async updateInput(inputId: string, inputData: any): Promise<any> {
    try {
      console.log('📦 [InputsService] Mise à jour de l\'intrant:', inputId, inputData);
      
      const { data, error } = await this.supabase
        .from('inputs')
        .update(inputData)
        .eq('id', inputId)
        .select()
        .single();

      if (error) {
        console.error('❌ [InputsService] Erreur lors de la mise à jour de l\'intrant:', error);
        throw error;
      }

      console.log('✅ [InputsService] Intrant mis à jour avec succès:', data);
      return data;
    } catch (error) {
      console.error('❌ [InputsService] Erreur lors de la mise à jour de l\'intrant:', error);
      throw error;
    }
  }

  /**
   * Supprime un intrant (méthode manquante de CollecteService)
   */
  async deleteInput(inputId: string): Promise<void> {
    try {
      console.log('📦 [InputsService] Suppression de l\'intrant:', inputId);
      
      const { error } = await this.supabase
        .from('inputs')
        .delete()
        .eq('id', inputId);

      if (error) {
        console.error('❌ [InputsService] Erreur lors de la suppression de l\'intrant:', error);
        throw error;
      }

      console.log('✅ [InputsService] Intrant supprimé avec succès');
    } catch (error) {
      console.error('❌ [InputsService] Erreur lors de la suppression de l\'intrant:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const InputsServiceInstance = new InputsService();
