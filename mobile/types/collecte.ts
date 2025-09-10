/**
 * Types pour la collecte de données terrain - AgriConnect
 * Définit les interfaces pour les fiches d'exploitation, producteurs et parcelles
 */

import { Database } from '../../types/database';

// Types de base de la base de données
export type FarmFile = Database['public']['Tables']['farm_files']['Row'];
export type FarmFileInsert = Database['public']['Tables']['farm_files']['Insert'];
export type FarmFileUpdate = Database['public']['Tables']['farm_files']['Update'];

export type Producer = Database['public']['Tables']['producers']['Row'];
export type ProducerInsert = Database['public']['Tables']['producers']['Insert'];
export type ProducerUpdate = Database['public']['Tables']['producers']['Update'];

export type Plot = Database['public']['Tables']['plots']['Row'];
export type PlotInsert = Database['public']['Tables']['plots']['Insert'];
export type PlotUpdate = Database['public']['Tables']['plots']['Update'];

// Types pour l'affichage dans l'interface de collecte
export interface FarmFileDisplay {
  id: string;
  name: string;
  producerName: string;
  location: string; // commune, department, region
  plotsCount: number;
  completionStatus: 'draft' | 'in_progress' | 'completed' | 'validated' | 'not_started';
  completionPercent: number;
  syncStatus: 'synced' | 'pending' | 'error' | 'offline';
  lastUpdated: string;
  createdBy: string;
  cooperativeId: string;
  // Données complètes pour l'affichage
  producer?: {
    first_name: string;
    last_name: string;
    phone: string;
    commune?: string;
    department?: string;
    region?: string;
  };
  plots?: PlotDisplay[];
  cooperative?: {
    name: string;
  };
  // Données supplémentaires de la RPC
  totalAreaHectares?: number;
  soilTypes?: string[];
  waterSources?: string[];
}

export interface ProducerDisplay {
  id: string;
  name: string;
  phone: string;
  location: string;
  cooperativeName: string;
  isActive: boolean;
  plotsCount: number;
  lastVisit?: string;
}

export interface PlotDisplay {
  id: string;
  name: string;
  area: number;
  producerName: string;
  soilType?: string;
  waterSource?: string;
  status: 'preparation' | 'cultivated' | 'fallow';
  cropsCount: number;
  lastOperation?: string;
  hasGps: boolean;
}

// Statuts de complétion des fiches
export type CompletionStatus = 'draft' | 'in_progress' | 'completed' | 'validated';

// Statuts de synchronisation
export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

// Actions rapides disponibles
export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

// Configuration des actions rapides
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-plot',
    title: 'Ajouter parcelle',
    icon: 'map-pin',
    color: '#3D944B',
    route: '/collecte/parcelles/add',
    description: 'Créer une nouvelle parcelle'
  },
  {
    id: 'new-visit',
    title: 'Nouvelle visite',
    icon: 'calendar',
    color: '#FFD65A',
    route: '/collecte/visites/add',
    description: 'Planifier une visite terrain'
  },
  {
    id: 'add-observation',
    title: 'Observation/Photo',
    icon: 'camera',
    color: '#FF6B6B',
    route: '/collecte/observations/add',
    description: 'Ajouter observation ou photo'
  }
];

// Fonctions utilitaires pour le calcul du statut de complétion
export const calculateCompletionStatus = (farmFile: FarmFile): CompletionStatus => {
  // Logique de calcul basée sur les champs remplis
  const requiredFields = [
    farmFile.name,
    farmFile.commune,
    farmFile.department,
    farmFile.region,
    farmFile.village,
    farmFile.sector,
    farmFile.responsible_producer_id
  ];
  
  const filledFields = requiredFields.filter(field => field && field !== '');
  const completionPercent = (filledFields.length / requiredFields.length) * 100;
  
  if (completionPercent === 100) return 'completed';
  if (completionPercent >= 70) return 'in_progress';
  return 'draft';
};

export const calculateCompletionPercent = (farmFile: FarmFile): number => {
  const requiredFields = [
    farmFile.name,
    farmFile.commune,
    farmFile.department,
    farmFile.region,
    farmFile.village,
    farmFile.sector,
    farmFile.responsible_producer_id
  ];
  
  const filledFields = requiredFields.filter(field => field && field !== '');
  return Math.round((filledFields.length / requiredFields.length) * 100);
};

// Fonctions utilitaires pour le statut de synchronisation
export const getSyncStatus = (lastUpdated: string, isOnline: boolean): SyncStatus => {
  if (!isOnline) return 'offline';
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffHours = (now.getTime() - updated.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 1) return 'synced';
  if (diffHours < 24) return 'pending';
  return 'error';
};

// Fonctions utilitaires pour l'affichage
export const formatLocation = (commune: string, department: string, region: string): string => {
  return `${commune}, ${department}, ${region}`;
};

export const formatProducerName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const formatArea = (area: number): string => {
  return `${area.toFixed(2)} ha`;
};

// Types pour les filtres et la recherche
export interface CollecteFilters {
  status?: CompletionStatus[];
  syncStatus?: SyncStatus[];
  cooperative?: string;
  search?: string;
}

export interface CollecteSort {
  field: 'name' | 'lastUpdated' | 'completionPercent' | 'plotsCount';
  direction: 'asc' | 'desc';
}
