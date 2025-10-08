/**
 * Types pour le service des alertes
 */

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: number;
  alert_type: 'pest_disease' | 'emergence' | 'growth' | 'other';
  producer_id: string;
  producer_name: string;
  plot_id: string;
  plot_name: string;
  created_at: string;
  updated_at: string;
  is_resolved: boolean;
  producerId?: string;
  plotId?: string;
}

export interface AlertFilters {
  days?: number;
  limit?: number;
  severity?: number;
  alert_type?: string;
  is_resolved?: boolean;
}

export interface AlertStats {
  total: number;
  urgent: number;
  medium: number;
  low: number;
  resolved: number;
  unresolved: number;
}
