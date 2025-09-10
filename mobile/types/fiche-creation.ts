import { z } from 'zod';

// Enums pour les sélections
export const SEX_OPTIONS = ['M', 'F'] as const;
export const LITERACY_OPTIONS = ['Oui', 'Non'] as const;
export const LANGUAGE_OPTIONS = ['Pular', 'Mandingue', 'Wolof', 'Français'] as const;
export const STATUS_OPTIONS = ['Chef exploitation', 'Producteur'] as const;
export const EQUIPMENT_CONDITION = ['Bon état', 'Réparable', 'Hors service'] as const;

// Schémas de validation Zod
export const FicheCreationSchema = z.object({
  // 1. Données organisationnelles
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

  // 2. Chef d'exploitation
  producerData: z.object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    status: z.enum(['Chef exploitation', 'Producteur']),
    birthDate: z.string().min(1, 'Date de naissance requise'),
    age: z.number().min(16, 'Âge minimum 16 ans').max(100, 'Âge maximum 100 ans'),
    isYoungProducer: z.boolean(), // < 30 ans
    sex: z.enum(['M', 'F']),
    cniNumber: z.string().optional(),
    literacy: z.enum(['Oui', 'Non']),
    languages: z.array(z.enum(['Pular', 'Mandingue', 'Wolof', 'Français'])).min(1, 'Au moins une langue requise'),
    isTrainedRelay: z.enum(['Oui', 'Non']),
  }),

  // 3. Inventaire matériel
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
});

export type FicheCreationData = z.infer<typeof FicheCreationSchema>;

// Types pour les étapes du formulaire
export type FormStep = 1 | 2 | 3;
export type FormSection = 'organizationalData' | 'producerData' | 'equipmentData';

// Types pour les options de sélection
export type SexOption = typeof SEX_OPTIONS[number];
export type LiteracyOption = typeof LITERACY_OPTIONS[number];
export type LanguageOption = typeof LANGUAGE_OPTIONS[number];
export type StatusOption = typeof STATUS_OPTIONS[number];
export type EquipmentCondition = typeof EQUIPMENT_CONDITION[number];

// Types pour les données de formulaire
export interface OrganizationalData {
  name: string;
  department: string;
  commune: string;
  village: string;
  sector: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  cooperativeId: string;
  gpc?: string;
  censusDate: string;
}

export interface ProducerData {
  firstName: string;
  lastName: string;
  status: StatusOption;
  birthDate: string;
  age: number;
  isYoungProducer: boolean;
  sex: SexOption;
  cniNumber?: string;
  literacy: LiteracyOption;
  languages: LanguageOption[];
  isTrainedRelay: LiteracyOption;
}

export interface EquipmentData {
  sprayers: {
    goodCondition: number;
    repairable: number;
  };
  agriculturalEquipment: {
    tractor: number;
    motocultor: number;
    ucf: number;
    arara: number;
    other: number;
  };
  manualTools: {
    hoeSine: number;
    hoeWestern: number;
    plows: number;
    seeder: number;
    ridger: number;
    carts: number;
  };
  draftAnimals: {
    cattle: number;
    horses: number;
    donkeys: number;
  };
}

// Types pour l'état du formulaire
export interface FormState {
  currentStep: FormStep;
  completedSteps: FormStep[];
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: string;
  errors: Record<string, string[]>;
}

// Types pour les coopératives
export interface Cooperative {
  id: string;
  name: string;
  region: string;
  department: string;
}

// Types pour la sauvegarde
export interface SaveResult {
  success: boolean;
  farmFileId?: string;
  error?: string;
  isDraft?: boolean;
}
