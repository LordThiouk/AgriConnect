import { Database, CacheTTL } from '../lib/types/core';

type Seasons = Database['public']['Tables']['seasons']['Row'];
type SeasonsInsert = Database['public']['Tables']['seasons']['Insert'];
type SeasonsUpdate = Database['public']['Tables']['seasons']['Update'];

/**
 * Types pour le service Seasons
 */

export interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface SeasonCreate {
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_active?: boolean;
}

export interface SeasonUpdate {
  name?: string;
  year?: number;
  start_date?: string;
  end_date?: string;
  description?: string;
  is_active?: boolean;
}

export interface SeasonFilters {
  year?: number;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SeasonStats {
  total_seasons: number;
  active_seasons: number;
  inactive_seasons: number;
  by_year: Record<number, number>;
  current_season?: Season;
  upcoming_seasons: Season[];
  past_seasons: Season[];
}

export interface SeasonWithDetails extends Season {
  stats: {
    total_crops: number;
    total_plots: number;
    total_operations: number;
    total_observations: number;
    total_visits: number;
  };
}

export interface SeasonCropStats {
  season_id: string;
  crop_type: string;
  total_plots: number;
  total_area: number;
  average_yield: number;
  total_operations: number;
  total_observations: number;
}

export interface SeasonRegionStats {
  season_id: string;
  region: string;
  total_producers: number;
  total_plots: number;
  total_area: number;
  total_crops: number;
  average_yield: number;
}
