/**
 * Cooperatives Service - CRUD operations for agricultural cooperatives
 * Handles all database operations for cooperatives with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Cooperative = Database['public']['Tables']['cooperatives']['Row'];
type CooperativeInsert = Database['public']['Tables']['cooperatives']['Insert'];
type CooperativeUpdate = Database['public']['Tables']['cooperatives']['Update'];

export class CooperativesService {
  /**
   * Get all cooperatives (admin only)
   */
  static async getCooperatives(): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cooperatives:', error);
      throw new Error(`Failed to fetch cooperatives: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single cooperative by ID
   */
  static async getCooperativeById(id: string): Promise<Cooperative | null> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching cooperative:', error);
      throw new Error(`Failed to fetch cooperative: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new cooperative
   */
  static async createCooperative(cooperativeData: CooperativeInsert): Promise<Cooperative> {
    const { data, error } = await supabase
      .from('cooperatives')
      .insert(cooperativeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating cooperative:', error);
      throw new Error(`Failed to create cooperative: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing cooperative
   */
  static async updateCooperative(id: string, updates: CooperativeUpdate): Promise<Cooperative> {
    const { data, error } = await supabase
      .from('cooperatives')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cooperative:', error);
      throw new Error(`Failed to update cooperative: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a cooperative
   */
  static async deleteCooperative(id: string): Promise<void> {
    const { error } = await supabase
      .from('cooperatives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting cooperative:', error);
      throw new Error(`Failed to delete cooperative: ${error.message}`);
    }
  }

  /**
   * Get cooperatives by region
   */
  static async getCooperativesByRegion(region: string): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .eq('region', region)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cooperatives by region:', error);
      throw new Error(`Failed to fetch cooperatives by region: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cooperatives by department
   */
  static async getCooperativesByDepartment(department: string): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .eq('department', department)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cooperatives by department:', error);
      throw new Error(`Failed to fetch cooperatives by department: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search cooperatives by name
   */
  static async searchCooperatives(query: string): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching cooperatives:', error);
      throw new Error(`Failed to search cooperatives: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get cooperatives within a geographic area (PostGIS)
   */
  static async getCooperativesInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Cooperative[]> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('*')
      .filter('geom', 'st_dwithin', `POINT(${centerLng} ${centerLat})`, radiusKm * 1000)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cooperatives in area:', error);
      throw new Error(`Failed to fetch cooperatives in area: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update cooperative geometry (GPS coordinates)
   */
  static async updateCooperativeGeometry(id: string, lat: number, lng: number): Promise<Cooperative> {
    const { data, error } = await supabase
      .from('cooperatives')
      .update({
        geom: `POINT(${lng} ${lat})`
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cooperative geometry:', error);
      throw new Error(`Failed to update cooperative geometry: ${error.message}`);
    }

    return data;
  }

  /**
   * Get cooperative statistics
   */
  static async getCooperativeStats(): Promise<{
    totalCooperatives: number;
    cooperativesByRegion: Record<string, number>;
    cooperativesByDepartment: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('cooperatives')
      .select('region, department');

    if (error) {
      console.error('Error fetching cooperative stats:', error);
      throw new Error(`Failed to fetch cooperative stats: ${error.message}`);
    }

    const totalCooperatives = data?.length || 0;
    const cooperativesByRegion: Record<string, number> = {};
    const cooperativesByDepartment: Record<string, number> = {};

    // Count cooperatives by region and department
    data?.forEach(coop => {
      if (coop.region) {
        cooperativesByRegion[coop.region] = (cooperativesByRegion[coop.region] || 0) + 1;
      }
      if (coop.department) {
        cooperativesByDepartment[coop.department] = (cooperativesByDepartment[coop.department] || 0) + 1;
      }
    });

    return {
      totalCooperatives,
      cooperativesByRegion,
      cooperativesByDepartment
    };
  }

  /**
   * Get cooperative with all related data (producers, plots, crops)
   */
  static async getCooperativeWithData(id: string): Promise<{
    cooperative: Cooperative;
    producers: any[];
    plots: any[];
    crops: any[];
  } | null> {
    // Get cooperative
    const cooperative = await this.getCooperativeById(id);
    if (!cooperative) return null;

    // Get related data
    const [producers, plots, crops] = await Promise.all([
      supabase
        .from('producers')
        .select('*')
        .eq('cooperative_id', id),
      supabase
        .from('plots')
        .select('*')
        .eq('cooperative_id', id),
      supabase
        .from('crops')
        .select(`
          *,
          plots!inner(*)
        `)
        .eq('plots.cooperative_id', id)
    ]);

    return {
      cooperative,
      producers: producers.data || [],
      plots: plots.data || [],
      crops: crops.data || []
    };
  }
}

// Export types for convenience
export type { Cooperative, CooperativeInsert, CooperativeUpdate };
