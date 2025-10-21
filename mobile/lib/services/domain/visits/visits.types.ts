import { CacheTTL } from '../../../../lib/types/core';
import { Database } from '../../../../types/database';


type Visits = Database['public']['Tables']['visits']['Row'];
type VisitsInsert = Database['public']['Tables']['visits']['Insert'];
type VisitsUpdate = Database['public']['Tables']['visits']['Update'];

/**
 * Types pour le service des visites
 */

export interface Visit {
  id: string;
  agent_id?: string; // RPC peut ne pas retourner cet attribut
  plot_id: string;
  visit_type: string;
  visit_date: string;
  notes?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  agent_name?: string;
  parcel_area?: number;
  parcel_location?: string;
  // Coordonnées GPS
  lat?: number;
  lon?: number;
  has_gps?: boolean;
  duration_minutes?: number;
  weather_conditions?: string;
}

export interface VisitDisplay extends Visit {
  plot_name?: string;
  producer_name?: string;
  cooperative_name?: string;
  agent_name?: string;
}

export interface VisitFilters {
  agent_id?: string;
  plot_id?: string;
  visit_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  period?: string; // Filtre unifié pour la RPC (today|week|month|past|future|all|completed|pending|in_progress)
}

export interface VisitSort {
  field: 'visit_type' | 'visit_date' | 'status' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface VisitCreateData {
  agent_id: string;
  plot_id: string;
  visit_type: string;
  visit_date: string;
  notes?: string;
  status: string;
}

export interface VisitUpdateData {
  visit_type?: string;
  visit_date?: string;
  notes?: string | null;
  status?: string;
  producer_id?: string;
  plot_id?: string | null;
  duration_minutes?: number | null;
  weather_conditions?: string | null;
}

export interface VisitInsert {
  producer_id: string;
  plot_id?: string | null;
  visit_type: string;
  visit_date: string;
  notes?: string | null;
  status: string;
  duration_minutes?: number | null;
  weather_conditions?: string | null;
}

export interface VisitCacheKey {
  plot: `visits:plot:${string}`;
  agent: `visits:agent:${string}`;
  visit: `visit:${string}`;
  today: `visits:today:${string}`;
  upcoming: `visits:upcoming:${string}`;
  past: `visits:past:${string}`;
}

export interface VisitServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
  refreshCache?: boolean;
}

export interface VisitStats {
  total: number;
  completed: number;
  pending: number;
  today: number;
  upcoming: number;
  past: number;
}
