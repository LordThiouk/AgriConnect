/**
 * Plots Service - CRUD operations for agricultural plots
 * Handles all database operations for plots with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Plot = Database['public']['Tables']['plots']['Row'];
type PlotInsert = Database['public']['Tables']['plots']['Insert'];
type PlotUpdate = Database['public']['Tables']['plots']['Update'];

export class PlotsService {
  /**
   * Get all plots for the current user's cooperative
   */
  static async getPlots(): Promise<Plot[]> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        producers!inner(*),
        cooperatives!inner(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plots:', error);
      throw new Error(`Failed to fetch plots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single plot by ID
   */
  static async getPlotById(id: string): Promise<Plot | null> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        producers(*),
        cooperatives(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching plot:', error);
      throw new Error(`Failed to fetch plot: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new plot
   */
  static async createPlot(plotData: PlotInsert): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .insert(plotData)
      .select()
      .single();

    if (error) {
      console.error('Error creating plot:', error);
      throw new Error(`Failed to create plot: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing plot
   */
  static async updatePlot(id: string, updates: PlotUpdate): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plot:', error);
      throw new Error(`Failed to update plot: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a plot
   */
  static async deletePlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('plots')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting plot:', error);
      throw new Error(`Failed to delete plot: ${error.message}`);
    }
  }

  /**
   * Get plots by producer
   */
  static async getPlotsByProducer(producerId: string): Promise<Plot[]> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        cooperatives(*)
      `)
      .eq('producer_id', producerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plots by producer:', error);
      throw new Error(`Failed to fetch plots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get plots by cooperative
   */
  static async getPlotsByCooperative(cooperativeId: string): Promise<Plot[]> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        producers(*)
      `)
      .eq('cooperative_id', cooperativeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plots by cooperative:', error);
      throw new Error(`Failed to fetch plots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get plots within a geographic area (PostGIS)
   */
  static async getPlotsInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<Plot[]> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        producers(*),
        cooperatives(*)
      `)
      .filter('geom', 'st_dwithin', `POINT(${centerLng} ${centerLat})`, radiusKm * 1000)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plots in area:', error);
      throw new Error(`Failed to fetch plots in area: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update plot geometry (GPS coordinates)
   */
  static async updatePlotGeometry(id: string, lat: number, lng: number): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .update({
        geom: `POINT(${lng} ${lat})`
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating plot geometry:', error);
      throw new Error(`Failed to update plot geometry: ${error.message}`);
    }

    return data;
  }

  /**
   * Get plot statistics
   */
  static async getPlotStats(): Promise<{
    totalPlots: number;
    totalArea: number;
    averageArea: number;
  }> {
    const { data, error } = await supabase
      .from('plots')
      .select('area_ha');

    if (error) {
      console.error('Error fetching plot stats:', error);
      throw new Error(`Failed to fetch plot stats: ${error.message}`);
    }

    const totalPlots = data?.length || 0;
    const totalArea = data?.reduce((sum, plot) => sum + (plot.area_ha || 0), 0) || 0;
    const averageArea = totalPlots > 0 ? totalArea / totalPlots : 0;

    return {
      totalPlots,
      totalArea,
      averageArea
    };
  }
}

// Export types for convenience
export type { Plot, PlotInsert, PlotUpdate };
