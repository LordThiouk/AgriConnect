/**
 * Types pour le service des parcelles
 */

import { Database } from '../../../../types/database';
import { CacheTTL } from '../../../../lib/types/core';

type Plot = Database['public']['Tables']['plots']['Row'];
type PlotInsert = Database['public']['Tables']['plots']['Insert'];
type PlotUpdate = Database['public']['Tables']['plots']['Update'];

// Réexport des types de base
export type { Plot, PlotInsert, PlotUpdate };

export interface PlotDisplay extends Plot {
  // Champs ajoutés par la RPC get_plot_by_id
  producer_name: string;
  cooperative_name?: string;
  // Alias pour compatibilité avec l'ancien système
  name: string; // Alias pour name_season_snapshot
  area: number; // Alias pour area_hectares
  producerName: string; // Alias pour producer_name
  variety?: string; // Alias pour cotton_variety
  soilType?: string; // Alias pour soil_type
  waterSource?: string; // Alias pour water_source
  hasGps?: boolean; // Calculé à partir de geom
  lat?: number; // Extrait de center_point
  lon?: number; // Extrait de center_point
  location?: string;
  lastSync?: string; // Alias pour updated_at
  cropsCount?: number; // Calculé
  lastOperation?: any; // Calculé
  createdBy?: string; // Non disponible dans RPC
  // Champs supplémentaires pour compatibilité
  producer_phone?: string;
  village?: string;
  department?: string;
  region?: string;
  farm_file_name?: string;
}

export interface PlotFilters {
  query?: string;
  village?: string;
  crop?: string;
  status?: string;
  cooperative_id?: string;
  producer_id?: string;
}

export interface PlotSort {
  field: 'name' | 'area' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface PlotCreateData {
  name: string;
  area: number;
  soil_type?: string;
  water_source?: string;
  status: string;
  producer_id: string;
  geom?: any;
  center_point?: any;
  farm_file_id?: string;
}

export interface PlotUpdateData {
  name?: string;
  area?: number;
  soil_type?: string;
  water_source?: string;
  status?: string;
  geom?: any;
  center_point?: any;
}

export interface PlotCacheKey {
  agent: `plots:agent:${string}`;
  user: `plots:user:${string}`;
  farmFile: `plots:farmfile:${string}`;
  plot: `plot:${string}`;
  recommendations: `recommendations:plot:${string}`;
  operations: `operations:plot:${string}`;
  observations: `observations:plot:${string}`;
  inputs: `inputs:plot:${string}`;
  participants: `participants:plot:${string}`;
  crops: `crops:plot:${string}`;
  activeCrop: `activecrop:plot:${string}`;
}

export interface PlotServiceOptions {
  useCache?: boolean;
  cacheTTL?: CacheTTL;
  refreshCache?: boolean;
}
