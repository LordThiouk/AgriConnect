import { z } from 'zod';

// Schémas de validation Zod
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
  // Ajout des champs dérivés pour la cohérence avec le schéma complet
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
  totalArea: number; // Surface recensée (ha)
  markedArea?: number; // Surface piquetée (ha)
  plantingWave: string;
  typology: ParcelTypology;
  producerSize: ProducerSize;
  cottonVariety: CottonVariety;
  responsible: ProducerData; // Mêmes champs que chef d'exploitation
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
  area: number; // Surface de cette culture dans la parcelle
  notes?: string;
}

// Schéma de validation pour les parcelles
export const ParcelSchema = z.object({
  id: z.string(), // Ajout de l'ID pour la cohérence
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
  ).optional(), // Rendre les cultures optionnelles pour la validation initiale
});

// Schéma de validation spécifique pour le formulaire de parcelle (pour éviter la validation du producteur)
export const ParcelFormSchema = ParcelSchema.pick({
  name: true,
  totalArea: true,
});


// Schéma complet mis à jour
export const FicheCreationCompleteSchema = z.object({
  // Étape 1: Fiche Exploitation
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
  
  // Étape 2: Parcelles et Cultures (ne re-valide pas 'responsible' ici; déjà validé en Étape 1)
  parcels: z.array(ParcelSchema.omit({ responsible: true })).min(1, 'Au moins une parcelle requise'),
  
  // Étape 3: Validation (pas de données supplémentaires, juste validation)
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
  currentParcelIndex?: number; // Pour l'édition d'une parcelle spécifique
}
