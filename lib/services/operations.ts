/**
 * Operations Service - CRUD operations for agricultural operations
 * Handles all database operations for operations with proper type safety
 */

import { supabase } from '../supabase/client';
import type { Database } from '../supabase/types/database';

type Operation = Database['public']['Tables']['operations']['Row'];
type OperationInsert = Database['public']['Tables']['operations']['Insert'];
type OperationUpdate = Database['public']['Tables']['operations']['Update'];

export class OperationsService {
  /**
   * Get all operations for the current user's cooperative
   */
  static async getOperations(): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops!inner(*),
        plots!inner(*)
      `)
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations:', error);
      throw new Error(`Failed to fetch operations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single operation by ID
   */
  static async getOperationById(id: string): Promise<Operation | null> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching operation:', error);
      throw new Error(`Failed to fetch operation: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new operation
   */
  static async createOperation(operationData: OperationInsert): Promise<Operation> {
    const { data, error } = await supabase
      .from('operations')
      .insert(operationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating operation:', error);
      throw new Error(`Failed to create operation: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing operation
   */
  static async updateOperation(id: string, updates: OperationUpdate): Promise<Operation> {
    const { data, error } = await supabase
      .from('operations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating operation:', error);
      throw new Error(`Failed to update operation: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an operation
   */
  static async deleteOperation(id: string): Promise<void> {
    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting operation:', error);
      throw new Error(`Failed to delete operation: ${error.message}`);
    }
  }

  /**
   * Get operations by crop
   */
  static async getOperationsByCrop(cropId: string): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        plots(*)
      `)
      .eq('crop_id', cropId)
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by crop:', error);
      throw new Error(`Failed to fetch operations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get operations by plot
   */
  static async getOperationsByPlot(plotId: string): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*)
      `)
      .eq('plot_id', plotId)
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by plot:', error);
      throw new Error(`Failed to fetch operations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get operations by type
   */
  static async getOperationsByType(opType: string): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .eq('op_type', opType)
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by type:', error);
      throw new Error(`Failed to fetch operations by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get operations by date range
   */
  static async getOperationsByDateRange(startDate: string, endDate: string): Promise<Operation[]> {
    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('op_date', startDate)
      .lte('op_date', endDate)
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations by date range:', error);
      throw new Error(`Failed to fetch operations by date range: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent operations (last 30 days)
   */
  static async getRecentOperations(): Promise<Operation[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('op_date', thirtyDaysAgo.toISOString())
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching recent operations:', error);
      throw new Error(`Failed to fetch recent operations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get operation statistics
   */
  static async getOperationStats(): Promise<{
    totalOperations: number;
    operationsByType: Record<string, number>;
    totalCost: number;
    averageCost: number;
  }> {
    const { data, error } = await supabase
      .from('operations')
      .select('op_type, cost_tracking');

    if (error) {
      console.error('Error fetching operation stats:', error);
      throw new Error(`Failed to fetch operation stats: ${error.message}`);
    }

    const totalOperations = data?.length || 0;
    const operationsByType: Record<string, number> = {};
    const totalCost = data?.reduce((sum, op) => {
      const cost = op.cost_tracking?.total_cost || 0;
      return sum + cost;
    }, 0) || 0;
    const averageCost = totalOperations > 0 ? totalCost / totalOperations : 0;

    // Count operations by type
    data?.forEach(op => {
      operationsByType[op.op_type] = (operationsByType[op.op_type] || 0) + 1;
    });

    return {
      totalOperations,
      operationsByType,
      totalCost,
      averageCost
    };
  }

  /**
   * Get operations that need attention (based on agri_rules)
   */
  static async getOperationsNeedingAttention(): Promise<Operation[]> {
    // This would typically involve checking agri_rules
    // For now, return operations from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('operations')
      .select(`
        *,
        crops(*),
        plots(*)
      `)
      .gte('op_date', sevenDaysAgo.toISOString())
      .order('op_date', { ascending: false });

    if (error) {
      console.error('Error fetching operations needing attention:', error);
      throw new Error(`Failed to fetch operations needing attention: ${error.message}`);
    }

    return data || [];
  }
}

// Export types for convenience
export type { Operation, OperationInsert, OperationUpdate };
