/**
 * Types pour le service FarmFiles - AgriConnect
 */

export interface FarmFile {
  id?: string;
  name: string;
  responsible_producer_id?: string;
  cooperative_id?: string;
  commune?: string;
  department?: string;
  region?: string;
  status: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FarmFileDisplay {
  id: string;
  name: string;
  producerName: string;
  location: string;
  plotsCount: number;
  completionPercent: number;
  status: string;
  completionStatus: 'draft' | 'in_progress' | 'completed';
  syncStatus: 'synced' | 'pending' | 'error';
  lastUpdated: string;
  createdBy?: string;
  cooperativeId?: string;
}

export interface FarmFileFilters {
  status?: string[];
  search?: string;
  cooperative?: string;
  region?: string;
}

export interface FarmFileSort {
  field: 'name' | 'completionPercent' | 'lastUpdated';
  direction: 'asc' | 'desc';
}

export interface FarmFileServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
  refreshCache?: boolean;
}

export interface FarmFileStats {
  total: number;
  completed: number;
  in_progress: number;
  draft: number;
  average_completion: number;
}