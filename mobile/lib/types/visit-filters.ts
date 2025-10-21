/**
 * Types pour les filtres de visite
 */

export type VisitFilter = 'today' | 'week' | 'month' | 'all' | 'past' | 'future' | 'completed' | 'pending';

export interface VisitFilterOption {
  key: VisitFilter;
  label: string;
  icon: string;
  description: string;
  colorScheme: string;
}
