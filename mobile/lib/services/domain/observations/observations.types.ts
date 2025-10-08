/**
 * Types pour le service Observations - AgriConnect
 */

export interface Observation {
  id?: string;
  plot_id: string;
  producer_id?: string;
  observation_type: string;
  description?: string;
  observation_date: string;
  severity?: number;
  pest_disease_name?: string;
  emergence_percent?: number;
  affected_area_percent?: number;
  recommendations?: string;
  status?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ObservationDisplay {
  id: string;
  title: string;
  date: string;
  author: string;
  type: string;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export interface GlobalObservationDisplay {
  id: string;
  title: string;
  type: 'fertilization' | 'disease' | 'irrigation' | 'harvest' | 'other';
  plotId: string;
  plotName: string;
  cropType: string;
  description: string;
  severity: number;
  status: string;
  timestamp: string;
  isCritical: boolean;
  color: string;
  icon: string;
  pestDiseaseName?: string;
  emergencePercent?: number;
  affectedAreaPercent?: number;
  recommendations?: string;
  producerName: string;
  observedBy: string;
}

export interface ObservationFilters {
  type?: string[];
  severity?: number[];
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  plotId?: string;
  producerId?: string;
}

export interface ObservationSort {
  field: 'observation_date' | 'severity' | 'type';
  direction: 'asc' | 'desc';
}

export interface ObservationServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
  refreshCache?: boolean;
}

export interface ObservationStats {
  total: number;
  by_type: Record<string, number>;
  by_severity: Record<number, number>;
  critical_count: number;
  recent_count: number;
}