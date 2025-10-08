/**
 * Service pour la gestion des coopératives agricoles
 * Gère le CRUD, la géolocalisation et les statistiques
 */

import { supabase } from '../lib/supabase';
import { Cooperative, CooperativeFilters } from '../types';

// Types importés depuis types/index.ts

export interface CooperativeStats {
  total_producers: number;
  total_plots: number;
  total_area: number;
  active_agents: number;
  recent_operations: number;
}

export interface CreateCooperativeData {
  name: string;
  description?: string;
  region: string;
  department: string;
  commune: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateCooperativeData extends Partial<CreateCooperativeData> {
  id: string;
}

export class CooperativesService {
  /**
   * Récupère la liste des coopératives avec filtres et pagination
   */
  static async getCooperatives(
    filters: CooperativeFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Cooperative[]; total: number; totalPages: number }> {
    try {
      let query = supabase
        .from('cooperatives')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.commune) {
        query = query.eq('commune', filters.commune);
      }
      if (filters.hasGeo === 'true') {
        query = query.not('latitude', 'is', null).not('longitude', 'is', null);
      } else if (filters.hasGeo === 'false') {
        query = query.or('latitude.is.null,longitude.is.null');
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Tri par nom
      query = query.order('name', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching cooperatives:', error);
        throw new Error(`Erreur lors de la récupération des coopératives: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: data || [],
        total: count || 0,
        totalPages
      };
    } catch (error) {
      console.error('CooperativesService.getCooperatives error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les coopératives pour la carte (sans pagination)
   */
  static async getAllCooperativesForMap(
    filters: CooperativeFilters = {}
  ): Promise<Cooperative[]> {
    try {
      let query = supabase
        .from('cooperatives')
        .select('*');

      // Appliquer les filtres
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.region) {
        query = query.eq('region', filters.region);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.commune) {
        query = query.eq('commune', filters.commune);
      }

      // Tri par nom
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all cooperatives for map:', error);
        throw new Error(`Erreur lors de la récupération des coopératives: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('CooperativesService.getAllCooperativesForMap error:', error);
      throw error;
    }
  }

  /**
   * Récupère une coopérative par son ID
   */
  static async getCooperativeById(id: string): Promise<Cooperative> {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching cooperative:', error);
        throw new Error(`Erreur lors de la récupération de la coopérative: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CooperativesService.getCooperativeById error:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle coopérative
   */
  static async createCooperative(data: CreateCooperativeData): Promise<Cooperative> {
    try {
      const cooperativeData: any = {
        name: data.name,
        description: data.description,
        region: data.region,
        department: data.department,
        commune: data.commune,
        address: data.address,
        phone: data.phone,
        email: data.email,
        contact_person: data.contact_person,
      };

      // Ajouter la géolocalisation si fournie
      if (data.latitude && data.longitude) {
        cooperativeData.geom = {
          type: 'Point',
          coordinates: [data.longitude, data.latitude]
        };
      }

      const { data: result, error } = await supabase
        .from('cooperatives')
        .insert(cooperativeData)
        .select()
        .single();

      if (error) {
        console.error('Error creating cooperative:', error);
        throw new Error(`Erreur lors de la création de la coopérative: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('CooperativesService.createCooperative error:', error);
      throw error;
    }
  }

  /**
   * Met à jour une coopérative existante
   */
  static async updateCooperative(data: UpdateCooperativeData): Promise<Cooperative> {
    try {
      const { id, ...updateData } = data;
      
      const cooperativeData: any = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Mettre à jour la géolocalisation si fournie
      if (data.latitude && data.longitude) {
        cooperativeData.geom = {
          type: 'Point',
          coordinates: [data.longitude, data.latitude]
        };
      }

      const { data: result, error } = await supabase
        .from('cooperatives')
        .update(cooperativeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating cooperative:', error);
        throw new Error(`Erreur lors de la mise à jour de la coopérative: ${error.message}`);
      }

      return result;
    } catch (error) {
      console.error('CooperativesService.updateCooperative error:', error);
      throw error;
    }
  }

  /**
   * Supprime une coopérative
   */
  static async deleteCooperative(id: string): Promise<void> {
    try {
      console.log('CooperativesService.deleteCooperative called with id:', id);
      
      // First, let's check if there are any farm_files associated with this cooperative
      const { data: farmFiles, error: farmFilesError } = await supabase
        .from('farm_files')
        .select('id, name')
        .eq('cooperative_id', id);

      if (farmFilesError) {
        console.error('Error checking farm files:', farmFilesError);
      } else if (farmFiles && farmFiles.length > 0) {
        console.log(`Found ${farmFiles.length} farm files associated with cooperative:`, farmFiles);
        // With CASCADE DELETE, these will be automatically deleted
      }
      
      const { error } = await supabase
        .from('cooperatives')
        .delete()
        .eq('id', id);

      console.log('Supabase delete result - error:', error);

      if (error) {
        console.error('Error deleting cooperative:', error);
        
        // Provide more specific error messages
        if (error.code === '23503') {
          throw new Error('Impossible de supprimer cette coopérative car elle contient encore des fiches d\'exploitation. Veuillez d\'abord supprimer ou transférer les fiches associées.');
        }
        
        throw new Error(`Erreur lors de la suppression de la coopérative: ${error.message}`);
      }
      
      console.log('Cooperative deleted successfully via service');
    } catch (error) {
      console.error('CooperativesService.deleteCooperative error:', error);
      throw error;
    }
  }

  /**
   * Récupère le nombre total de producteurs
   */
  static async getTotalProducers(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('producers')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching total producers:', error);
        throw new Error(`Erreur lors du comptage des producteurs: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('CooperativesService.getTotalProducers error:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'une coopérative
   */
  static async getCooperativeStats(id: string): Promise<CooperativeStats> {
    try {
      // Récupérer le nombre de producteurs
      const { count: producersCount } = await supabase
        .from('producers')
        .select('*', { count: 'exact', head: true })
        .eq('cooperative_id', id);

      // Pour l'instant, retourner des statistiques simplifiées
      // Les relations complexes seront implémentées plus tard
      return {
        total_producers: producersCount || 0,
        total_plots: 0, // À implémenter plus tard
        total_area: 0, // À implémenter plus tard
        active_agents: 0, // À implémenter plus tard
        recent_operations: 0 // À implémenter plus tard
      };
    } catch (error) {
      console.error('CooperativesService.getCooperativeStats error:', error);
      throw error;
    }
  }

  /**
   * Récupère les options de filtres (régions, départements, communes)
   */
  static async getFilterOptions(): Promise<{
    regions: string[];
    departments: string[];
    communes: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('region, department, commune');

      if (error) {
        console.error('Error fetching filter options:', error);
        throw new Error(`Erreur lors de la récupération des options de filtres: ${error.message}`);
      }

      const regions = [...new Set(data?.map(item => item.region).filter(Boolean) || [])].sort();
      const departments = [...new Set(data?.map(item => item.department).filter(Boolean) || [])].sort();
      const communes = [...new Set(data?.map(item => item.commune).filter(Boolean) || [])].sort();

      return { regions, departments, communes };
    } catch (error) {
      console.error('CooperativesService.getFilterOptions error:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les coopératives pour la carte
   */
  static async getCooperativesForMap(): Promise<Cooperative[]> {
    try {
      const { data, error } = await supabase
        .from('cooperatives')
        .select('id, name, region, department, commune, geom')
        .not('geom', 'is', null);

      if (error) {
        console.error('Error fetching cooperatives for map:', error);
        throw new Error(`Erreur lors de la récupération des coopératives pour la carte: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('CooperativesService.getCooperativesForMap error:', error);
      throw error;
    }
  }

  /**
   * Récupère les producteurs affiliés à une coopérative
   */
  static async getCooperativeProducers(
    cooperativeId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: any[]; total: number; totalPages: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('producers')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          region,
          department,
          commune,
          created_at
        `, { count: 'exact' })
        .eq('cooperative_id', cooperativeId)
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cooperative producers:', error);
        throw new Error(`Erreur lors de la récupération des producteurs: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        data: data || [],
        total: count || 0,
        totalPages
      };
    } catch (error) {
      console.error('CooperativesService.getCooperativeProducers error:', error);
      throw error;
    }
  }
}
