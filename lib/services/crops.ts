/**
 * Crops Service - CRUD operations for agricultural crops
 * Handles all database operations for crops with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Crop = Database['public']['Tables']['crops']['Row'];
type CropInsert = Database['public']['Tables']['crops']['Insert'];
type CropUpdate = Database['public']['Tables']['crops']['Update'];

export class CropsService {
  /**
   * Get all crops for the current user's cooperative
   */
  static async getCrops(): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots!inner(*),
        seasons!inner(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crops:', error);
      throw new Error(`Failed to fetch crops: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single crop by ID
   */
  static async getCropById(id: string): Promise<Crop | null> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots(*),
        seasons(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching crop:', error);
      throw new Error(`Failed to fetch crop: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new crop
   */
  static async createCrop(cropData: CropInsert): Promise<Crop> {
    const { data, error } = await supabase
      .from('crops')
      .insert(cropData)
      .select()
      .single();

    if (error) {
      console.error('Error creating crop:', error);
      throw new Error(`Failed to create crop: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing crop
   */
  static async updateCrop(id: string, updates: CropUpdate): Promise<Crop> {
    const { data, error } = await supabase
      .from('crops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating crop:', error);
      throw new Error(`Failed to update crop: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a crop
   */
  static async deleteCrop(id: string): Promise<void> {
    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting crop:', error);
      throw new Error(`Failed to delete crop: ${error.message}`);
    }
  }

  /**
   * Get crops by plot
   */
  static async getCropsByPlot(plotId: string): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        seasons(*)
      `)
      .eq('plot_id', plotId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crops by plot:', error);
      throw new Error(`Failed to fetch crops: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get crops by season
   */
  static async getCropsBySeason(seasonId: string): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots(*)
      `)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crops by season:', error);
      throw new Error(`Failed to fetch crops: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get active crops (status = 'en_cours')
   */
  static async getActiveCrops(): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots(*),
        seasons(*)
      `)
      .eq('status', 'en_cours')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active crops:', error);
      throw new Error(`Failed to fetch active crops: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get crops by status
   */
  static async getCropsByStatus(status: 'en_cours' | 'récolté' | 'abandonné'): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots(*),
        seasons(*)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crops by status:', error);
      throw new Error(`Failed to fetch crops by status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update crop status
   */
  static async updateCropStatus(id: string, status: 'en_cours' | 'récolté' | 'abandonné'): Promise<Crop> {
    const { data, error } = await supabase
      .from('crops')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating crop status:', error);
      throw new Error(`Failed to update crop status: ${error.message}`);
    }

    return data;
  }

  /**
   * Get crop statistics
   */
  static async getCropStats(): Promise<{
    totalCrops: number;
    activeCrops: number;
    harvestedCrops: number;
    abandonedCrops: number;
    totalYield: number;
  }> {
    const { data, error } = await supabase
      .from('crops')
      .select('status, yield_actual');

    if (error) {
      console.error('Error fetching crop stats:', error);
      throw new Error(`Failed to fetch crop stats: ${error.message}`);
    }

    const totalCrops = data?.length || 0;
    const activeCrops = data?.filter(crop => crop.status === 'en_cours').length || 0;
    const harvestedCrops = data?.filter(crop => crop.status === 'récolté').length || 0;
    const abandonedCrops = data?.filter(crop => crop.status === 'abandonné').length || 0;
    const totalYield = data?.reduce((sum, crop) => sum + (crop.yield_actual || 0), 0) || 0;

    return {
      totalCrops,
      activeCrops,
      harvestedCrops,
      abandonedCrops,
      totalYield
    };
  }

  /**
   * Get crops by type
   */
  static async getCropsByType(cropType: string): Promise<Crop[]> {
    const { data, error } = await supabase
      .from('crops')
      .select(`
        *,
        plots(*),
        seasons(*)
      `)
      .eq('crop_type', cropType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crops by type:', error);
      throw new Error(`Failed to fetch crops by type: ${error.message}`);
    }

    return data || [];
  }
}

// Export types for convenience
export type { Crop, CropInsert, CropUpdate };
