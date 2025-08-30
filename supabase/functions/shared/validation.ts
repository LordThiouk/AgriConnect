// Zod validation schemas for AgriConnect Edge Functions API

import { z } from 'zod';

// Base schemas
export const phoneSchema = z.string()
  .regex(/^(\+221|221)?[0-9]{9}$/, 'Invalid phone number format')
  .transform(val => val.replace(/\s/g, ''));

export const emailSchema = z.string()
  .email('Invalid email format')
  .optional();

export const dateSchema = z.string()
  .refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format')
  .optional();

export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
}).optional();

// Producer schemas
export const createProducerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: phoneSchema,
  email: emailSchema,
  gender: z.enum(['M', 'F']).optional(),
  birth_date: dateSchema,
  address: z.string().max(500).optional(),
  village: z.string().max(100).optional(),
  commune: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  household_size: z.number().int().min(1).max(50).optional(),
  education_level: z.enum(['none', 'primary', 'secondary', 'higher']).optional(),
  farming_experience_years: z.number().int().min(0).max(100).optional(),
  primary_language: z.string().max(50).optional(),
  cooperative_id: z.string().uuid().optional()
});

export const updateProducerSchema = createProducerSchema.partial().extend({
  is_active: z.boolean().optional()
});

// Plot schemas
export const createPlotSchema = z.object({
  producer_id: z.string().uuid('Invalid producer ID'),
  cooperative_id: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  area_ha: z.number().positive('Area must be positive').max(10000),
  soil_type: z.enum(['sandy', 'clay', 'loam', 'silt', 'other']).optional(),
  water_source: z.enum(['rainfed', 'irrigation', 'mixed']).optional(),
  status: z.enum(['preparation', 'cultivated', 'fallow']),
  geom: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional()
});

export const updatePlotSchema = createPlotSchema.partial();

// Crop schemas
export const createCropSchema = z.object({
  plot_id: z.string().uuid('Invalid plot ID'),
  season_id: z.string().uuid().optional(),
  crop_type: z.string().min(1, 'Crop type is required').max(100),
  variety: z.string().max(100).optional(),
  sowing_date: dateSchema,
  expected_harvest_date: dateSchema,
  expected_yield_kg: z.number().positive().max(100000).optional(),
  status: z.enum(['en_cours', 'récolté', 'abandonné']),
  notes: z.string().max(1000).optional()
});

export const updateCropSchema = createCropSchema.partial().extend({
  actual_harvest_date: dateSchema,
  actual_yield_kg: z.number().positive().max(100000).optional()
});

// Operation schemas
export const createOperationSchema = z.object({
  crop_id: z.string().uuid('Invalid crop ID'),
  plot_id: z.string().uuid('Invalid plot ID'),
  op_type: z.enum(['semis', 'fertilisation', 'irrigation', 'désherbage', 'phytosanitaire', 'récolte', 'labour', 'reconnaissance']),
  op_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  product_used: z.string().max(200).optional(),
  dose_per_ha: z.number().positive().max(1000).optional(),
  cost_per_ha: z.number().positive().max(1000000).optional(),
  notes: z.string().max(1000).optional()
});

export const updateOperationSchema = createOperationSchema.partial();

// Observation schemas
export const createObservationSchema = z.object({
  crop_id: z.string().uuid('Invalid crop ID'),
  plot_id: z.string().uuid('Invalid plot ID'),
  obs_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  emergence_percent: z.number().min(0).max(100).optional(),
  pest_disease: z.string().max(200).optional(),
  severity: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional()
});

export const updateObservationSchema = createObservationSchema.partial();

// Cooperative schemas
export const createCooperativeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  region: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  commune: z.string().max(100).optional(),
  geom: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }).optional()
});

export const updateCooperativeSchema = createCooperativeSchema.partial();

// Query parameter schemas
export const queryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  cooperative_id: z.string().uuid().optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  crop_type: z.string().optional(),
  op_type: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional()
});

// Authentication schemas
export const loginSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits')
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema
});

// Validation functions
export function validateProducer(data: any) {
  return createProducerSchema.safeParse(data);
}

export function validateProducerUpdate(data: any) {
  return updateProducerSchema.safeParse(data);
}

export function validatePlot(data: any) {
  return createPlotSchema.safeParse(data);
}

export function validatePlotUpdate(data: any) {
  return updatePlotSchema.safeParse(data);
}

export function validateCrop(data: any) {
  return createCropSchema.safeParse(data);
}

export function validateCropUpdate(data: any) {
  return updateCropSchema.safeParse(data);
}

export function validateOperation(data: any) {
  return createOperationSchema.safeParse(data);
}

export function validateOperationUpdate(data: any) {
  return updateOperationSchema.safeParse(data);
}

export function validateObservation(data: any) {
  return createObservationSchema.safeParse(data);
}

export function validateObservationUpdate(data: any) {
  return updateObservationSchema.safeParse(data);
}

export function validateCooperative(data: any) {
  return createCooperativeSchema.safeParse(data);
}

export function validateCooperativeUpdate(data: any) {
  return updateCooperativeSchema.safeParse(data);
}

export function validateQueryParams(data: any) {
  return queryParamsSchema.safeParse(data);
}

export function validateLogin(data: any) {
  return loginSchema.safeParse(data);
}

export function validateVerifyOtp(data: any) {
  return verifyOtpSchema.safeParse(data);
}

// Helper function to extract validation errors
export function getValidationErrors(result: z.SafeParseReturnType<any, any>): string[] {
  if (result.success) return [];
  
  return result.error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  );
}
