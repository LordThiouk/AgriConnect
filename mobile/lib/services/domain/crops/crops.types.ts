/**
 * Types pour le service des cultures
 */

import { Database, CacheTTL } from '../lib/types/core';

type Crop = Database['public']['Tables']['crops']['Row'];
type CropInsert = Database['public']['Tables']['crops']['Insert'];
type CropUpdate = Database['public']['Tables']['crops']['Update'];

// Réexport des types de base
export type { Crop, CropInsert, CropUpdate };

export interface CropDisplay extends Crop {
  plot_name?: string;
  season_name?: string;
  producer_name?: string;
  cooperative_name?: string;
}

export interface CropFilters {
  plot_id?: string;
  season_id?: string;
  crop_type?: string;
  status?: string;
  variety?: string;
}

export interface CropSort {
  field: 'crop_type' | 'sowing_date' | 'expected_harvest' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface CropCreateData {
  plot_id: string;
  season_id: string;
  crop_type: string;
  variety: string;
  sowing_date: string;
  expected_harvest?: string;
  estimated_yield_kg_ha?: number;
  status: string;
  created_by: string | null;
}

export interface CropUpdateData {
  crop_type?: string;
  variety?: string;
  sowing_date?: string;
  expected_harvest?: string;
  estimated_yield_kg_ha?: number;
  actual_yield_kg_ha?: number;
  emergence_date?: string;
  status?: string;
}

export interface CropCacheKey {
  plot: `crops:plot:${string}`;
  season: `crops:season:${string}`;
  active: `activecrop:plot:${string}`;
  crop: `crop:${string}`;
}

export interface CropServiceOptions {
  useCache?: boolean;
  cacheTTL?: CacheTTL;
  refreshCache?: boolean;
}
