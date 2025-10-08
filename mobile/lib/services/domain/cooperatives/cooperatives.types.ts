import { Database, CacheTTL } from '../lib/types/core';

type Cooperatives = Database['public']['Tables']['cooperatives']['Row'];
type CooperativesInsert = Database['public']['Tables']['cooperatives']['Insert'];
type CooperativesUpdate = Database['public']['Tables']['cooperatives']['Update'];

/**
 * Types pour le service Cooperatives
 */

export interface Cooperative {
  id: string;
  name: string;
  region?: string;
  department?: string;
  commune?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'inactive' | 'suspended';
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  description?: string;
}

export interface CooperativeCreate {
  name: string;
  region?: string;
  department?: string;
  commune?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  description?: string;
}

export interface CooperativeUpdate {
  name?: string;
  region?: string;
  department?: string;
  commune?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface CooperativeFilters {
  region?: string;
  department?: string;
  commune?: string;
  status?: 'active' | 'inactive' | 'suspended';
  search?: string;
}

export interface CooperativeStats {
  total_cooperatives: number;
  active_cooperatives: number;
  inactive_cooperatives: number;
  suspended_cooperatives: number;
  by_region: Record<string, number>;
  by_department: Record<string, number>;
}

export interface CooperativeWithStats extends Cooperative {
  stats: {
    total_producers: number;
    total_plots: number;
    total_farm_files: number;
    last_activity?: string;
  };
}
