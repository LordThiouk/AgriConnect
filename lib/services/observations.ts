/**
 * Observations Service - CRUD operations for agricultural observations
 * Handles all database operations for observations with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Observation = Database['public']['Tables']['observations']['Row'];
type ObservationInsert = Database['public']['Tables']['observations']['Insert'];
type ObservationUpdate = Database['public']['Tables']['observations']['Update'];

export class ObservationsService {
  /**
   * Get all observations for the current user's cooperative
   */
  static async getObservations(): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops!inner(*),
        plots!inner(*)
      `)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations:', error);
      throw new Error(`Failed to fetch observations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single observation by ID
   */
  static async getObservationById(id: string): Promise<Observation | null> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching observation:', error);
      throw new Error(`Failed to fetch observation: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new observation
   */
  static async createObservation(observationData: ObservationInsert): Promise<Observation> {
    const { data, error } = await supabase
      .from('observations')
      .insert(observationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating observation:', error);
      throw new Error(`Failed to create observation: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing observation
   */
  static async updateObservation(id: string, updates: ObservationUpdate): Promise<Observation> {
    const { data, error } = await supabase
      .from('observations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating observation:', error);
      throw new Error(`Failed to update observation: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an observation
   */
  static async deleteObservation(id: string): Promise<void> {
    const { error } = await supabase
      .from('observations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting observation:', error);
      throw new Error(`Failed to delete observation: ${error.message}`);
    }
  }

  /**
   * Get observations by crop
   */
  static async getObservationsByCrop(cropId: string): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        plots(*)
      `)
      .eq('crop_id', cropId)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations by crop:', error);
      throw new Error(`Failed to fetch observations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get observations by plot
   */
  static async getObservationsByPlot(plotId: string): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*)
      `)
      .eq('plot_id', plotId)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations by plot:', error);
      throw new Error(`Failed to fetch observations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get observations by severity level
   */
  static async getObservationsBySeverity(severity: number): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .eq('severity', severity)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations by severity:', error);
      throw new Error(`Failed to fetch observations by severity: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get critical observations (severity >= 4)
   */
  static async getCriticalObservations(): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('severity', 4)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching critical observations:', error);
      throw new Error(`Failed to fetch critical observations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get observations by date range
   */
  static async getObservationsByDateRange(startDate: string, endDate: string): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('obs_date', startDate)
      .lte('obs_date', endDate)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations by date range:', error);
      throw new Error(`Failed to fetch observations by date range: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent observations (last 7 days)
   */
  static async getRecentObservations(): Promise<Observation[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('obs_date', sevenDaysAgo.toISOString())
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching recent observations:', error);
      throw new Error(`Failed to fetch recent observations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get observations by pest/disease type
   */
  static async getObservationsByPestDisease(pestDisease: string): Promise<Observation[]> {
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .ilike('pest_disease', `%${pestDisease}%`)
      .order('obs_date', { ascending: false });

    if (error) {
      console.error('Error fetching observations by pest/disease:', error);
      throw new Error(`Failed to fetch observations by pest/disease: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get observation statistics
   */
  static async getObservationStats(): Promise<{
    totalObservations: number;
    observationsBySeverity: Record<number, number>;
    averageSeverity: number;
    criticalObservations: number;
  }> {
    const { data, error } = await supabase
      .from('observations')
      .select('severity');

    if (error) {
      console.error('Error fetching observation stats:', error);
      throw new Error(`Failed to fetch observation stats: ${error.message}`);
    }

    const totalObservations = data?.length || 0;
    const observationsBySeverity: Record<number, number> = {};
    const totalSeverity = data?.reduce((sum, obs) => sum + (obs.severity || 0), 0) || 0;
    const averageSeverity = totalObservations > 0 ? totalSeverity / totalObservations : 0;
    const criticalObservations = data?.filter(obs => (obs.severity || 0) >= 4).length || 0;

    // Count observations by severity
    data?.forEach(obs => {
      const severity = obs.severity || 0;
      observationsBySeverity[severity] = (observationsBySeverity[severity] || 0) + 1;
    });

    return {
      totalObservations,
      observationsBySeverity,
      averageSeverity,
      criticalObservations
    };
  }

  /**
   * Get observations that need immediate attention
   */
  static async getObservationsNeedingAttention(): Promise<Observation[]> {
    // Get observations with high severity or recent pest/disease reports
    const { data, error } = await supabase
      .from('observations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .or('severity.gte.4,pest_disease.not.is.null')
      .order('obs_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching observations needing attention:', error);
      throw new Error(`Failed to fetch observations needing attention: ${error.message}`);
    }

    return data || [];
  }
}

// Export types for convenience
export type { Observation, ObservationInsert, ObservationUpdate };
