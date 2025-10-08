/**
 * Types pour la collecte de données terrain - AgriConnect
 * Définit les interfaces pour les fiches d'exploitation, producteurs et parcelles
 */

import { Database } from './database';

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

export type Observation = Database['public']['Tables']['observations']['Row'];
export type ObservationInsert = Database['public']['Tables']['observations']['Insert'];
export type ObservationUpdate = Database['public']['Tables']['observations']['Update'];

export type Participant = Database['public']['Tables']['participants']['Row'];
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert'];

export type Recommendation = Database['public']['Tables']['recommendations']['Row'];
export type RecommendationInsert = Database['public']['Tables']['recommendations']['Insert'];

export type Operation = Database['public']['Tables']['operations']['Row'];
export type OperationInsert = Database['public']['Tables']['operations']['Insert'];

export type Crop = Database['public']['Tables']['crops']['Row'];

export type Input = Database['public']['Tables']['inputs']['Row'];
export type InputInsert = Database['public']['Tables']['inputs']['Insert'];

export const operationTypes = [
  'sowing',
  'fertilization',
  'irrigation',
  'weeding',
  'pesticide',
  'harvest',
  'tillage',
  'scouting',
] as const;
export type AppOperationType = (typeof operationTypes)[number];

export type ObservationType = 'pest_disease' | 'emergence' | 'phenology' | 'other';
export type ObservationSeverity = 1 | 2 | 3 | 4 | 5;

/**
 * Représente une observation globale formatée pour l'affichage dans l'écran principal
 */
export interface GlobalObservationDisplay {
  id: string;
  title: string;
  type: 'fertilization' | 'disease' | 'irrigation' | 'harvest' | 'other';
  plotId: string;
  plotName: string;
  cropType: string;
  description: string;
  severity: ObservationSeverity;
  status: 'new' | 'read' | 'executed' | 'critical';
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

/**
 * Représente une notification générale (réunions, alertes météo, etc.)
 */
export interface GeneralNotificationDisplay {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'meeting' | 'weather' | 'cooperative' | 'system';
  icon: string;
  color: string;
}

/**
 * Représente une observation formatée pour l'affichage
 */
export interface ObservationDisplay {
  id: string;
  type: ObservationType;
  date: string;
  title: string;
  severity?: ObservationSeverity;
  description: string;
  author: string;
  photoUrl?: string;
  has_photos?: boolean;
}

/**
 * Représente un participant (intervenant) formaté pour l'affichage
 */
export interface ParticipantDisplay {
  id: string;
  name: string;
  role: string;
  age?: number;
  tags: string[];
}

/**
 * Représente un conseil (recommandation) formaté pour l'affichage
 */
export interface RecommendationDisplay {
  id: string;
  title: string;
  message: string;
  date: string;
  status: string;
  type: string;
}

/**
 * Représente une opération agricole formatée pour l'affichage
 */
export interface OperationDisplay {
  id: string;
  type: string;
  product?: string | null;
  description?: string | null;
  date: string;
  author?: string;
  has_photos?: boolean;
}

/**
 * Représente un intrant (input) formaté pour l'affichage
 */
export interface InputDisplay {
  id: string;
  category: string;
  label?: string;
  quantity?: number;
  unit?: string;
  date: string;
}

/**
 * Représente une fiche d'exploitation formatée pour l'affichage dans l'UI
 */
export interface FarmFileDisplay {
  id: string;
  name: string;
  producerName: string;
  location: string;
  plotsCount: number;
  completionPercent: number;
  status: string;
  completionStatus: CompletionStatus;
  syncStatus: SyncStatus;
  lastUpdated: string;
  // optionnels pour usage interne
  createdBy?: string;
  cooperativeId?: string;
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
  // Propriétés supplémentaires pour compatibilité
  village?: string;
  commune?: string;
  region?: string;
  cooperative_id?: string;
  is_active?: boolean;
}

export interface PlotDisplay {
  id: string;
  name: string;
  area: number;
  producerName: string;
  variety?: string;
  location?: string;
  soilType?: string;
  waterSource?: string;
  status: 'preparation' | 'cultivated' | 'fallow';
  cropsCount: number;
  lastOperation?: string;
  hasGps: boolean;
  createdBy?: string;
  lastSync?: string;
  // Propriétés supplémentaires pour compatibilité
  area_hectares?: number;
  soil_type?: string;
  water_source?: string;
  producer_id?: string;
  lat?: number;
  lon?: number;
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
    route: '/(tabs)/parcelles/select-fiche',
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
