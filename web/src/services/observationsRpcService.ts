import { supabase } from '../lib/supabase';
import { Observation, ObservationFilters, PaginationParams, PaginatedResponse } from '../types';

export class ObservationsRpcService {
  static async getObservations(
    filters: ObservationFilters = {},
    pagination: PaginationParams = { page: 1, limit: 10 },
    producerId?: string
  ): Promise<PaginatedResponse<Observation>> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const offset = (pagination.page - 1) * pagination.limit;

      // Use RPC function to get observations with details (V3 - WITH AGENT INFO)
      const { data, error } = await supabase.rpc('get_observations_with_details_v3', {
        producer_uuid: producerId || null,
        limit_count: pagination.limit,
        offset_count: offset,
        search_term: filters.search || null,
        observation_type_filter: filters.observation_type || null
      });

      if (error) {
        console.error('Error fetching observations:', error);
        throw error;
      }

      // Get total count using RPC function (V3 - WITH AGENT INFO)
      const { data: countData, error: countError } = await supabase.rpc('count_observations_for_producer_v3', {
        producer_uuid: producerId || null,
        search_term: filters.search || null,
        observation_type_filter: filters.observation_type || null
      });

      if (countError) {
        console.error('Error counting observations:', countError);
        throw countError;
      }

      const total = countData || 0;

      // Transform the data to match our Observation interface
      const observations: Observation[] = (data || []).map((obs: any) => ({
        id: obs.id,
        crop_id: obs.crop_id,
        plot_id: obs.plot_id,
        observation_type: obs.observation_type,
        observation_date: obs.observation_date,
        emergence_percent: obs.emergence_percent,
        pest_disease_name: obs.pest_disease_name,
        severity: obs.severity,
        affected_area_percent: obs.affected_area_percent,
        description: obs.description,
        recommendations: obs.recommendations,
        observed_by: obs.observed_by,
        created_at: obs.created_at,
        updated_at: obs.updated_at,
        crop: obs.crop_type ? {
          id: obs.crop_id,
          crop_type: obs.crop_type,
          variety: obs.crop_variety
        } : undefined,
        plot: obs.plot_name ? {
          id: obs.plot_id,
          name: obs.plot_name
        } : undefined
      }));

      return {
        data: observations,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      console.error('Error in getObservations:', error);
      throw error;
    }
  }

  static async getObservationById(id: string): Promise<Observation | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase.rpc('get_observations_with_details', {
        producer_uuid: null,
        limit_count: 1,
        offset_count: 0,
        search_term: null,
        observation_type_filter: null
      });

      if (error) {
        console.error('Error fetching observation:', error);
        throw error;
      }

      const observation = data?.find((obs: any) => obs.id === id);
      if (!observation) return null;

      return {
        id: observation.id,
        crop_id: observation.crop_id,
        plot_id: observation.plot_id,
        observation_type: observation.observation_type,
        observation_date: observation.observation_date,
        emergence_percent: observation.emergence_percent,
        pest_disease_name: observation.pest_disease_name,
        severity: observation.severity,
        affected_area_percent: observation.affected_area_percent,
        description: observation.description,
        recommendations: observation.recommendations,
        observed_by: observation.observed_by,
        created_at: observation.created_at,
        updated_at: observation.updated_at,
        crop: observation.crop_type ? {
          id: observation.crop_id,
          crop_type: observation.crop_type,
          variety: observation.crop_variety
        } : undefined,
        plot: observation.plot_name ? {
          id: observation.plot_id,
          name: observation.plot_name
        } : undefined
      };
    } catch (error) {
      console.error('Error in getObservationById:', error);
      throw error;
    }
  }

  static async createObservation(observationData: Partial<Observation>): Promise<Observation> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('observations')
        .insert([observationData])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating observation:', error);
      throw error;
    }
  }

  static async updateObservation(id: string, observationData: Partial<Observation>): Promise<Observation> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('observations')
        .update(observationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating observation:', error);
      throw error;
    }
  }

  static async deleteObservation(id: string): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('observations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting observation:', error);
      throw error;
    }
  }
}
