/**
 * Types pour le service des producteurs
 */

export interface Producer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  village: string;
  commune: string;
  region: string;
  cooperative_id: string;
  is_active: boolean;
  plots_count?: number;
  name?: string; // Pour compatibilité avec l'ancien format
  location?: string; // Pour compatibilité avec l'ancien format
}

export interface ProducerFilters {
  is_active?: boolean;
  cooperative_id?: string;
  region?: string;
  commune?: string;
}

export interface ProducerStats {
  total: number;
  active: number;
  inactive: number;
  with_plots: number;
  without_plots: number;
}
