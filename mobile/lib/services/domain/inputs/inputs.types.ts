import { Database } from '../lib/types/core';

// Types de base de la table inputs
export type Inputs = Database['public']['Tables']['inputs']['Row'];
export type InputsInsert = Database['public']['Tables']['inputs']['Insert'];
export type InputsUpdate = Database['public']['Tables']['inputs']['Update'];

/**
 * Types pour le service Inputs
 */

export interface Input {
  id: string;
  name: string;
  type: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'seed' | 'equipment' | 'other';
  category: 'organic' | 'chemical' | 'biological' | 'mechanical';
  description?: string;
  unit: 'kg' | 'liters' | 'bags' | 'pieces' | 'hectares' | 'other';
  price_per_unit?: number;
  supplier?: string;
  brand?: string;
  active_ingredients?: string[];
  dosage_per_hectare?: number;
  application_method?: string;
  safety_instructions?: string;
  storage_conditions?: string;
  shelf_life_days?: number;
  is_available: boolean;
  stock_quantity?: number;
  minimum_stock?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface InputCreate {
  name: string;
  type: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'seed' | 'equipment' | 'other';
  category: 'organic' | 'chemical' | 'biological' | 'mechanical';
  description?: string;
  unit: 'kg' | 'liters' | 'bags' | 'pieces' | 'hectares' | 'other';
  price_per_unit?: number;
  supplier?: string;
  brand?: string;
  active_ingredients?: string[];
  dosage_per_hectare?: number;
  application_method?: string;
  safety_instructions?: string;
  storage_conditions?: string;
  shelf_life_days?: number;
  is_available?: boolean;
  stock_quantity?: number;
  minimum_stock?: number;
}

export interface InputUpdate {
  name?: string;
  type?: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'seed' | 'equipment' | 'other';
  category?: 'organic' | 'chemical' | 'biological' | 'mechanical';
  description?: string;
  unit?: 'kg' | 'liters' | 'bags' | 'pieces' | 'hectares' | 'other';
  price_per_unit?: number;
  supplier?: string;
  brand?: string;
  active_ingredients?: string[];
  dosage_per_hectare?: number;
  application_method?: string;
  safety_instructions?: string;
  storage_conditions?: string;
  shelf_life_days?: number;
  is_available?: boolean;
  stock_quantity?: number;
  minimum_stock?: number;
}

export interface InputFilters {
  type?: 'fertilizer' | 'pesticide' | 'herbicide' | 'fungicide' | 'seed' | 'equipment' | 'other';
  category?: 'organic' | 'chemical' | 'biological' | 'mechanical';
  is_available?: boolean;
  supplier?: string;
  brand?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
}

export interface InputStats {
  total_inputs: number;
  available_inputs: number;
  out_of_stock_inputs: number;
  low_stock_inputs: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  by_supplier: Record<string, number>;
  total_value: number;
  average_price: number;
}

export interface InputWithDetails extends Input {
  usage_count?: number;
  last_used?: string;
  related_operations?: string[];
  related_crops?: string[];
  supplier_info?: {
    name: string;
    contact: string;
    address?: string;
  };
}

export interface InputUsage {
  id: string;
  input_id: string;
  operation_id: string;
  plot_id: string;
  crop_id: string;
  quantity_used: number;
  unit: string;
  application_date: string;
  cost: number;
  notes?: string;
  created_at?: string;
  created_by?: string;
}

export interface InputStockMovement {
  id: string;
  input_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  unit: string;
  reason: string;
  reference?: string;
  cost?: number;
  created_at?: string;
  created_by?: string;
}

export interface InputRecommendation {
  input_id: string;
  crop_type: string;
  growth_stage: string;
  dosage: number;
  unit: string;
  application_timing: string;
  frequency: string;
  notes?: string;
  effectiveness_rating?: number;
}
