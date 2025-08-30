/**
 * Producers Service - CRUD operations for agricultural producers
 * Handles all database operations for producers with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Producer = Database['public']['Tables']['producers']['Row'];
type ProducerInsert = Database['public']['Tables']['producers']['Insert'];
type ProducerUpdate = Database['public']['Tables']['producers']['Update'];

export class ProducersService {
  /**
   * Get all producers for the current user's cooperative
   */
  static async getProducers(): Promise<Producer[]> {
    const { data, error } = await supabase
      .from('producers')
      .select(`
        *,
        profiles!inner(*),
        cooperatives!inner(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching producers:', error);
      throw new Error(`Failed to fetch producers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single producer by ID
   */
  static async getProducerById(id: string): Promise<Producer | null> {
    const { data, error } = await supabase
      .from('producers')
      .select(`
        *,
        profiles(*),
        cooperatives(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching producer:', error);
      throw new Error(`Failed to fetch producer: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new producer
   */
  static async createProducer(producerData: ProducerInsert): Promise<Producer> {
    const { data, error } = await supabase
      .from('producers')
      .insert(producerData)
      .select()
      .single();

    if (error) {
      console.error('Error creating producer:', error);
      throw new Error(`Failed to create producer: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing producer
   */
  static async updateProducer(id: string, updates: ProducerUpdate): Promise<Producer> {
    const { data, error } = await supabase
      .from('producers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating producer:', error);
      throw new Error(`Failed to update producer: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a producer
   */
  static async deleteProducer(id: string): Promise<void> {
    const { error } = await supabase
      .from('producers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting producer:', error);
      throw new Error(`Failed to delete producer: ${error.message}`);
    }
  }

  /**
   * Get producers by cooperative
   */
  static async getProducersByCooperative(cooperativeId: string): Promise<Producer[]> {
    const { data, error } = await supabase
      .from('producers')
      .select(`
        *,
        profiles(*)
      `)
      .eq('cooperative_id', cooperativeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching producers by cooperative:', error);
      throw new Error(`Failed to fetch producers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Search producers by name or phone
   */
  static async searchProducers(query: string): Promise<Producer[]> {
    const { data, error } = await supabase
      .from('producers')
      .select(`
        *,
        profiles!inner(*)
      `)
      .or(`profiles.full_name.ilike.%${query}%,profiles.phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching producers:', error);
      throw new Error(`Failed to search producers: ${error.message}`);
    }

    return data || [];
  }
}

// Export types for convenience
export type { Producer, ProducerInsert, ProducerUpdate };
