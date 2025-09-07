// Shared Validation Module for AgriConnect Edge Functions
// Provides Zod schemas for all agricultural entities

import { z } from "https://esm.sh/zod@3.23.8";

// Base schemas for common fields
const BaseEntitySchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

const LocationSchema = z.object({
  region: z.string().min(1, "Région requise"),
  department: z.string().min(1, "Département requis"),
  commune: z.string().min(1, "Commune requise"),
  village: z.string().min(1, "Village requis"),
});

// Producer schemas
export const ProducerSchema = BaseEntitySchema.extend({
  first_name: z.string().min(1, "Prénom requis").max(100, "Prénom trop long"),
  last_name: z.string().min(1, "Nom requis").max(100, "Nom trop long"),
  phone: z.string().regex(/^\+221[0-9]{9}$/, "Format téléphone invalide (+221XXXXXXXXX)"),
  cooperative_id: z.string().uuid("ID coopérative invalide"),
  ...LocationSchema.shape,
  gender: z.enum(['M', 'F'], { errorMap: () => ({ message: "Genre doit être M ou F" }) }),
  birth_date: z.string().datetime().optional().nullable(),
  education_level: z.string().optional().nullable(),
  household_size: z.number().int().min(1, "Taille du ménage doit être au moins 1").default(1),
  farming_experience_years: z.number().int().min(0, "Expérience agricole ne peut pas être négative").default(0),
  primary_language: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email("Format email invalide").optional().nullable(),
  is_active: z.boolean().default(true),
  profile_id: z.string().uuid().optional().nullable(),
});

export const ProducerCreateSchema = ProducerSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const ProducerUpdateSchema = ProducerSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Cooperative schemas
export const CooperativeSchema = BaseEntitySchema.extend({
  name: z.string().min(1, "Nom de la coopérative requis").max(200, "Nom trop long"),
  legal_status: z.enum(['registered', 'pending', 'informal'], {
    errorMap: () => ({ message: "Statut légal invalide" })
  }),
  registration_number: z.string().optional().nullable(),
  ...LocationSchema.shape,
  contact_person: z.string().min(1, "Personne de contact requise"),
  contact_phone: z.string().regex(/^\+221[0-9]{9}$/, "Format téléphone invalide"),
  contact_email: z.string().email("Format email invalide").optional().nullable(),
  member_count: z.number().int().min(1, "Nombre de membres doit être au moins 1").default(1),
  established_date: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
});

export const CooperativeCreateSchema = CooperativeSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const CooperativeUpdateSchema = CooperativeSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Plot schemas
export const PlotSchema = BaseEntitySchema.extend({
  producer_id: z.string().uuid("ID producteur invalide"),
  cooperative_id: z.string().uuid("ID coopérative invalide"),
  name: z.string().min(1, "Nom de la parcelle requis").max(100, "Nom trop long"),
  area_ha: z.number().positive("Superficie doit être positive").max(1000, "Superficie trop importante"),
  soil_type: z.enum(['sandy', 'clay', 'loamy', 'silty', 'other'], {
    errorMap: () => ({ message: "Type de sol invalide" })
  }),
  water_source: z.enum(['rainfed', 'irrigated', 'mixed', 'other'], {
    errorMap: () => ({ message: "Source d'eau invalide" })
  }),
  status: z.enum(['preparation', 'cultivated', 'fallow'], {
    errorMap: () => ({ message: "Statut de parcelle invalide" })
  }),
  ...LocationSchema.shape,
  geom: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional().nullable(),
  photo_cover_media_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const PlotCreateSchema = PlotSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const PlotUpdateSchema = PlotSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Crop schemas
export const CropSchema = BaseEntitySchema.extend({
  plot_id: z.string().uuid("ID parcelle invalide"),
  season_id: z.string().uuid("ID saison invalide"),
  crop_type: z.string().min(1, "Type de culture requis"),
  variety: z.string().optional().nullable(),
  sowing_date: z.string().datetime("Date de semis invalide"),
  expected_harvest_date: z.string().datetime("Date de récolte attendue invalide"),
  actual_harvest_date: z.string().datetime().optional().nullable(),
  expected_yield_kg: z.number().positive("Rendement attendu doit être positif").optional().nullable(),
  actual_yield_kg: z.number().positive("Rendement réel doit être positif").optional().nullable(),
  status: z.enum(['en_cours', 'récolté', 'abandonné'], {
    errorMap: () => ({ message: "Statut de culture invalide" })
  }),
  notes: z.string().optional().nullable(),
});

export const CropCreateSchema = CropSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const CropUpdateSchema = CropSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Operation schemas
export const OperationSchema = BaseEntitySchema.extend({
  crop_id: z.string().uuid("ID culture invalide"),
  plot_id: z.string().uuid("ID parcelle invalide"),
  op_type: z.enum(['semis', 'fertilisation', 'irrigation', 'désherbage', 'phytosanitaire', 'récolte', 'labour'], {
    errorMap: () => ({ message: "Type d'opération invalide" })
  }),
  op_date: z.string().datetime("Date d'opération invalide"),
  product_used: z.string().optional().nullable(),
  dose: z.string().optional().nullable(),
  cost: z.number().min(0, "Coût ne peut pas être négatif").optional().nullable(),
  labor_hours: z.number().min(0, "Heures de main d'œuvre ne peuvent pas être négatives").optional().nullable(),
  notes: z.string().optional().nullable(),
  created_by: z.string().uuid().optional(),
});

export const OperationCreateSchema = OperationSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const OperationUpdateSchema = OperationSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Observation schemas
export const ObservationSchema = BaseEntitySchema.extend({
  crop_id: z.string().uuid("ID culture invalide"),
  plot_id: z.string().uuid("ID parcelle invalide"),
  obs_date: z.string().datetime("Date d'observation invalide"),
  emergence_percent: z.number().min(0, "Pourcentage de levée ne peut pas être négatif").max(100, "Pourcentage de levée ne peut pas dépasser 100").optional().nullable(),
  pest_disease: z.string().optional().nullable(),
  severity: z.number().int().min(1, "Gravité doit être entre 1 et 5").max(5, "Gravité doit être entre 1 et 5").optional().nullable(),
  health_status: z.enum(['excellent', 'bon', 'moyen', 'mauvais', 'critique'], {
    errorMap: () => ({ message: "Statut de santé invalide" })
  }).optional().nullable(),
  notes: z.string().optional().nullable(),
  created_by: z.string().uuid().optional(),
});

export const ObservationCreateSchema = ObservationSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const ObservationUpdateSchema = ObservationSchema.partial().omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page doit être au moins 1").default(1),
  limit: z.coerce.number().int().min(1, "Limite doit être au moins 1").max(100, "Limite ne peut pas dépasser 100").default(20),
});

export const SearchSchema = z.object({
  search: z.string().optional(),
  cooperative_id: z.string().uuid().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

// Validation helper functions
export const validateProducer = (data: unknown) => ProducerSchema.safeParse(data);
export const validateProducerCreate = (data: unknown) => ProducerCreateSchema.safeParse(data);
export const validateProducerUpdate = (data: unknown) => ProducerUpdateSchema.safeParse(data);

export const validateCooperative = (data: unknown) => CooperativeSchema.safeParse(data);
export const validateCooperativeCreate = (data: unknown) => CooperativeCreateSchema.safeParse(data);
export const validateCooperativeUpdate = (data: unknown) => CooperativeUpdateSchema.safeParse(data);

export const validatePlot = (data: unknown) => PlotSchema.safeParse(data);
export const validatePlotCreate = (data: unknown) => PlotCreateSchema.safeParse(data);
export const validatePlotUpdate = (data: unknown) => PlotUpdateSchema.safeParse(data);

export const validateCrop = (data: unknown) => CropSchema.safeParse(data);
export const validateCropCreate = (data: unknown) => CropCreateSchema.safeParse(data);
export const validateCropUpdate = (data: unknown) => CropUpdateSchema.safeParse(data);

export const validateOperation = (data: unknown) => OperationSchema.safeParse(data);
export const validateOperationCreate = (data: unknown) => OperationCreateSchema.safeParse(data);
export const validateOperationUpdate = (data: unknown) => OperationUpdateSchema.safeParse(data);

export const validateObservation = (data: unknown) => ObservationSchema.safeParse(data);
export const validateObservationCreate = (data: unknown) => ObservationCreateSchema.safeParse(data);
export const validateObservationUpdate = (data: unknown) => ObservationUpdateSchema.safeParse(data);

export const validatePagination = (data: unknown) => PaginationSchema.safeParse(data);
export const validateSearch = (data: unknown) => SearchSchema.safeParse(data);

// Error formatting
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
};

// Type exports
export type Producer = z.infer<typeof ProducerSchema>;
export type ProducerCreate = z.infer<typeof ProducerCreateSchema>;
export type ProducerUpdate = z.infer<typeof ProducerUpdateSchema>;

export type Cooperative = z.infer<typeof CooperativeSchema>;
export type CooperativeCreate = z.infer<typeof CooperativeCreateSchema>;
export type CooperativeUpdate = z.infer<typeof CooperativeUpdateSchema>;

export type Plot = z.infer<typeof PlotSchema>;
export type PlotCreate = z.infer<typeof PlotCreateSchema>;
export type PlotUpdate = z.infer<typeof PlotUpdateSchema>;

export type Crop = z.infer<typeof CropSchema>;
export type CropCreate = z.infer<typeof CropCreateSchema>;
export type CropUpdate = z.infer<typeof CropUpdateSchema>;

export type Operation = z.infer<typeof OperationSchema>;
export type OperationCreate = z.infer<typeof OperationCreateSchema>;
export type OperationUpdate = z.infer<typeof OperationUpdateSchema>;

export type Observation = z.infer<typeof ObservationSchema>;
export type ObservationCreate = z.infer<typeof ObservationCreateSchema>;
export type ObservationUpdate = z.infer<typeof ObservationUpdateSchema>;
