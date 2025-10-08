/**
 * Types communs pour l'infrastructure AgriConnect
 * Types partagés entre les différents modules
 */

// Types de base
export type ID = string;
export type UUID = string;
export type Timestamp = number;
export type DateString = string;

// Types pour les réponses API génériques
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> extends BaseResponse {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse extends BaseResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Types pour les métadonnées
export interface Metadata {
  createdAt: DateString;
  updatedAt: DateString;
  createdBy?: UUID;
  updatedBy?: UUID;
}

// Types pour les filtres et tri
export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: Filter[];
  sort?: Sort[];
  limit?: number;
  offset?: number;
  include?: string[]; // Relations à inclure
}

// Types pour les états de chargement
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Types pour les hooks
export interface UseQueryResult<T> extends AsyncState<T> {
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

export interface UseMutationResult<T, V> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (variables: V) => Promise<T>;
  reset: () => void;
}

// Types pour les événements
export interface BaseEvent {
  type: string;
  timestamp: number;
  source: string;
  data?: any;
}

// Types pour la configuration
export interface Config {
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  api: {
    baseURL: string;
    timeout: number;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
}

// Types pour les logs
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  source?: string;
  data?: any;
  error?: Error;
}

// Types pour les performances
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Types pour les utilitaires
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Types pour les enums
export type StringEnum<T> = T extends string ? T : never;
export type NumberEnum<T> = T extends number ? T : never;

// Types pour les unions discriminées
export type DiscriminatedUnion<T, K extends keyof T> = T[K] extends string 
  ? T extends Record<K, T[K]> 
    ? T 
    : never 
  : never;

// Types pour les fonctions utilitaires
export type Predicate<T> = (value: T) => boolean;
export type Transformer<T, U> = (value: T) => U;
export type AsyncTransformer<T, U> = (value: T) => Promise<U>;

// Types pour les callbacks
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
export type EventCallback<T = any> = (event: T) => void;
export type AsyncEventCallback<T = any> = (event: T) => Promise<void>;

// ===== TYPES D'AFFICHAGE POUR L'UI =====

// Types d'opérations
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

// Types d'observations
export type ObservationType = 'pest_disease' | 'emergence' | 'phenology' | 'other';
export type ObservationSeverity = 1 | 2 | 3 | 4 | 5;

// Types d'affichage pour l'UI
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

export interface GeneralNotificationDisplay {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'meeting' | 'weather' | 'cooperative' | 'system';
  icon: string;
  color: string;
}

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

export interface ParticipantDisplay {
  id: string;
  name: string;
  role: string;
  age?: number;
  tags: string[];
}

export interface RecommendationDisplay {
  id: string;
  title: string;
  message: string;
  date: string;
  status: string;
  type: string;
}

export interface OperationDisplay {
  id: string;
  type: string;
  product?: string | null;
  description?: string | null;
  date: string;
  author?: string;
  has_photos?: boolean;
}

export interface InputDisplay {
  id: string;
  category: string;
  label?: string;
  quantity?: number;
  unit?: string;
  date: string;
}

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
  area_hectares?: number;
  soil_type?: string;
  water_source?: string;
  producer_id?: string;
  lat?: number;
  lon?: number;
}

// Statuts
export type CompletionStatus = 'draft' | 'in_progress' | 'completed' | 'validated';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'offline';

// Actions rapides
export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

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

// ===== FONCTIONS UTILITAIRES =====

// Fonctions utilitaires pour le calcul du statut de complétion
export const calculateCompletionStatus = (farmFile: any): CompletionStatus => {
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

export const calculateCompletionPercent = (farmFile: any): number => {
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

// ===== SCHÉMAS ZOD POUR FICHE CRÉATION =====

import { z } from 'zod';

// Schémas de validation Zod pour la création de fiches
export const organizationalDataSchema = z.object({
  name: z.string().min(1, 'Nom de la fiche requis'),
  region: z.string().min(1, 'Région requise'),
  department: z.string().min(1, 'Département requis'),
  commune: z.string().min(1, 'Commune requise'),
  village: z.string().min(1, 'Village requis'),
  sector: z.string().min(1, 'Secteur requis'),
  cooperativeId: z.string().min(1, 'Coopérative requise'),
  gpc: z.string().optional(),
  censusDate: z.string().min(1, 'Date de recensement requise'),
  latitude: z.number().min(-90, 'Latitude invalide').max(90, 'Latitude invalide').optional(),
  longitude: z.number().min(-180, 'Longitude invalide').max(180, 'Longitude invalide').optional(),
});

export type OrganizationalData = z.infer<typeof organizationalDataSchema>;

// Options pour les formulaires
export const SEX_OPTIONS = ['Homme', 'Femme'] as const;
export const LITERACY_OPTIONS = ['Analphabète', 'Alphabétisé', 'Partiel'] as const;
export const LANGUAGE_OPTIONS = ['Pular', 'Mandingue', 'Wolof', 'Français'] as const;
export const STATUS_OPTIONS = ['Chef d\'exploitation', 'Producteur'] as const;
export const EQUIPMENT_CONDITIONS = ['Bon état', 'Réparable', 'Hors d\'usage'] as const;

export const FARM_EQUIPMENT_TYPES = [
  'Tracteur',
  'Motoculteur',
  'UCF',
  'Arara',
  'Arara + 3 dents',
  'Autre',
] as const;

export const MANUAL_TOOL_TYPES = [
  'Houe Sine',
  'Houes Occidentales',
  'Charrues',
  'Semoir',
  'Corps butteur',
  'Charrettes',
] as const;

export const DRAFT_ANIMAL_TYPES = ['Bovins', 'Équins', 'Âsins'] as const;

export const producerDataSchema = z.object({
  lastName: z.string().min(1, 'Nom de famille requis'),
  firstName: z.string().min(1, 'Prénom requis'),
  status: z.enum(STATUS_OPTIONS, { required_error: 'Statut requis' }),
  birthDate: z.string().optional(),
  sex: z.enum(SEX_OPTIONS, { required_error: 'Sexe requis' }),
  cniNumber: z.string().optional(),
  phone: z.string().optional().refine(
    (val) => val === '' || !val || val.length >= 9, 
    { message: "Le numéro de téléphone doit comporter au moins 9 chiffres ou être vide" }
  ),
  literacy: z.enum(LITERACY_OPTIONS).optional(),
  languages: z.array(z.enum(LANGUAGE_OPTIONS)).optional(),
  isRelayFarmer: z.boolean().optional(),
  age: z.number().optional(),
  isYoungProducer: z.boolean().optional(),
});

export type ProducerData = z.infer<typeof producerDataSchema>;

export const equipmentDataSchema = z.object({
  sprayers: z.object({
    goodCondition: z.number().min(0).optional(),
    repairable: z.number().min(0).optional(),
    outOfOrder: z.number().min(0).optional(),
  }).optional(),
  farmEquipment: z.object({
    Tracteur: z.number().min(0).optional(),
    Motoculteur: z.number().min(0).optional(),
    UCF: z.number().min(0).optional(),
    Arara: z.number().min(0).optional(),
    'Arara + 3 dents': z.number().min(0).optional(),
    Autre: z.number().min(0).optional(),
  }).optional(),
  manualTools: z.object({
    'Houe Sine': z.number().min(0).optional(),
    'Houes Occidentales': z.number().min(0).optional(),
    Charrues: z.number().min(0).optional(),
    Semoir: z.number().min(0).optional(),
    'Corps butteur': z.number().min(0).optional(),
    Charrettes: z.number().min(0).optional(),
  }).optional(),
  draftAnimals: z.object({
    Bovins: z.number().min(0).optional(),
    Équins: z.number().min(0).optional(),
    Âsins: z.number().min(0).optional(),
  }).optional(),
});

export type EquipmentData = z.infer<typeof equipmentDataSchema>;

export const FicheCreationSchema = z.object({
  organizationalData: organizationalDataSchema,
  producerData: producerDataSchema,
  equipmentData: equipmentDataSchema,
});

export type FicheCreationData = z.infer<typeof FicheCreationSchema>;

// Types pour les étapes du formulaire
export type FormStep = 1 | 2 | 3;
export type FormSection = 'organizationalData' | 'producerData' | 'equipmentData' | 'parcels' | 'validation';

// Types pour les coopératives
export interface Cooperative {
  id: string;
  name: string;
  region: string;
  department: string;
}

// Types pour les parcelles et cultures
export const PARCEL_TYPOLOGY = ['A', 'B', 'C', 'D', 'CC', 'EAM'] as const;
export const PRODUCER_SIZE = ['Standard (< 3 ha)', 'Gros (> 3 ha)', 'Super gros (> 10 ha)'] as const;
export const COTTON_VARIETIES = ['CE', 'CM', 'SH', 'NAW'] as const;
export const CROP_TYPES = ['Coton', 'Maïs', 'Sorgho', 'Mil', 'Arachide', 'Autre'] as const;

export type ParcelTypology = typeof PARCEL_TYPOLOGY[number];
export type ProducerSize = typeof PRODUCER_SIZE[number];
export type CottonVariety = typeof COTTON_VARIETIES[number];
export type CropType = typeof CROP_TYPES[number];

export interface ParcelData {
  id: string;
  name: string;
  totalArea: number;
  markedArea?: number;
  plantingWave: string;
  typology: ParcelTypology;
  producerSize: ProducerSize;
  cottonVariety: CottonVariety;
  responsible: ProducerData;
  gpsLatitude?: number;
  gpsLongitude?: number;
  crops: CropData[];
}

export interface CropData {
  id: string;
  type: CropType;
  variety: string;
  sowingDate: string;
  expectedHarvest?: string;
  area: number;
  notes?: string;
}

// Schéma de validation pour les parcelles
export const ParcelSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom de la parcelle est requis"),
  totalArea: z.number().min(0.01, "La surface doit être supérieure à 0"),
  plantingWave: z.string(),
  typology: z.enum(PARCEL_TYPOLOGY),
  producerSize: z.enum(PRODUCER_SIZE),
  cottonVariety: z.enum(COTTON_VARIETIES),
  responsible: producerDataSchema,
  crops: z.array(
    z.object({
      id: z.string(),
      type: z.enum(CROP_TYPES),
      variety: z.string().optional(),
      sowingDate: z.string(),
      area: z.number().min(0),
    })
  ).optional(),
});

export const ParcelFormSchema = ParcelSchema.pick({
  name: true,
  totalArea: true,
});

// Schéma complet mis à jour
export const FicheCreationCompleteSchema = z.object({
  organizationalData: z.object({
    name: z.string().min(1, 'Nom de la fiche requis'),
    department: z.string().min(1, 'Département requis'),
    commune: z.string().min(1, 'Commune requise'),
    village: z.string().min(1, 'Village requis'),
    sector: z.string().min(1, 'Secteur requis'),
    gpsLatitude: z.number().optional(),
    gpsLongitude: z.number().optional(),
    cooperativeId: z.string().min(1, 'Coopérative requise'),
    gpc: z.string().optional(),
    censusDate: z.string().min(1, 'Date de recensement requise'),
  }),
  producerData: z.object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    status: z.enum(STATUS_OPTIONS),
    birthDate: z.string().min(1, 'Date de naissance requise'),
    age: z.number().min(16, 'Âge minimum 16 ans').max(100, 'Âge maximum 100 ans'),
    isYoungProducer: z.boolean(),
    sex: z.enum(SEX_OPTIONS),
    cniNumber: z.string().optional(),
    literacy: z.enum(LITERACY_OPTIONS),
    languages: z.array(z.enum(['Pular', 'Mandingue', 'Wolof', 'Français'])).min(1, 'Au moins une langue requise'),
    isTrainedRelay: z.enum(['Oui', 'Non']).optional(),
  }),
  equipmentData: z.object({
    sprayers: z.object({
      goodCondition: z.number().min(0, 'Nombre doit être positif'),
      repairable: z.number().min(0, 'Nombre doit être positif'),
    }),
    agriculturalEquipment: z.object({
      tractor: z.number().min(0),
      motocultor: z.number().min(0),
      ucf: z.number().min(0),
      arara: z.number().min(0),
      other: z.number().min(0),
    }),
    manualTools: z.object({
      hoeSine: z.number().min(0),
      hoeWestern: z.number().min(0),
      plows: z.number().min(0),
      seeder: z.number().min(0),
      ridger: z.number().min(0),
      carts: z.number().min(0),
    }),
    draftAnimals: z.object({
      cattle: z.number().min(0),
      horses: z.number().min(0),
      donkeys: z.number().min(0),
    }),
  }),
  parcels: z.array(ParcelSchema.omit({ responsible: true })).min(1, 'Au moins une parcelle requise'),
});

export type FicheCreationCompleteData = z.infer<typeof FicheCreationCompleteSchema>;

// Types pour la sauvegarde
export interface SaveResult {
  success: boolean;
  farmFileId?: string;
  error?: string;
  isDraft?: boolean;
}

// Types pour l'état du formulaire complet
export interface FormStateComplete {
  currentStep: FormStep;
  completedSteps: FormStep[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: string;
  errors: Record<string, string[]>;
  parcels: ParcelData[];
  currentParcelIndex?: number;
}
