/**
 * Types pour le service des intervenants
 */

import { Database } from '../../../../../types/database';
import { CacheTTL } from '../lib/types/core';

export type Intervenant = Database['public']['Tables']['participants']['Row'];
export type IntervenantInsert = Database['public']['Tables']['participants']['Insert'];
export type IntervenantUpdate = Database['public']['Tables']['participants']['Update'];

export interface IntervenantDisplay {
  id: string;
  plot_id: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  birthdate: string | null;
  is_young: boolean | null;
  languages: string[] | null;
  literacy: boolean | null;
  sex: string | null;
}

export interface IntervenantUpdateData {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  status?: string;
}

export interface IntervenantFilters {
  plot_id?: string;
  role?: string;
  status?: string;
  name?: string;
}

export interface IntervenantSort {
  field: 'name' | 'role' | 'status' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export interface IntervenantCreateData {
  plot_id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: string;
  created_by: string | null;
}

export interface IntervenantCacheKey {
  plot: `intervenants:plot:${string}`;
  intervenant: `intervenant:${string}`;
  agent: `intervenants:agent:${string}`;
}

export interface IntervenantServiceOptions {
  useCache?: boolean;
  cacheTTL?: CacheTTL;
  refreshCache?: boolean;
}
