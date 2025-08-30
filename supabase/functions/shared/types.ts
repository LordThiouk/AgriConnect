// Shared types for AgriConnect Edge Functions API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserContext {
  id: string;
  role: 'admin' | 'supervisor' | 'agent' | 'coop_admin' | 'producer';
  cooperative_id?: string;
}

export interface AuthRequest {
  user: UserContext;
}

// Database table types (simplified for API)
export interface Producer {
  id: string;
  profile_id?: string;
  cooperative_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  village?: string;
  commune?: string;
  department?: string;
  region?: string;
  household_size?: number;
  education_level?: string;
  farming_experience_years?: number;
  primary_language?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Plot {
  id: string;
  producer_id: string;
  cooperative_id?: string;
  name?: string;
  area_ha: number;
  soil_type?: string;
  water_source?: string;
  status: 'preparation' | 'cultivated' | 'fallow';
  geom?: any; // PostGIS geometry
  photo_cover_media_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Crop {
  id: string;
  plot_id: string;
  season_id?: string;
  crop_type: string;
  variety?: string;
  sowing_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  expected_yield_kg?: number;
  actual_yield_kg?: number;
  status: 'en_cours' | 'récolté' | 'abandonné';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Operation {
  id: string;
  crop_id: string;
  plot_id: string;
  op_type: 'semis' | 'fertilisation' | 'irrigation' | 'désherbage' | 'phytosanitaire' | 'récolte' | 'labour' | 'reconnaissance';
  op_date: string;
  product_used?: string;
  dose_per_ha?: number;
  cost_per_ha?: number;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Observation {
  id: string;
  crop_id: string;
  plot_id: string;
  obs_date: string;
  emergence_percent?: number;
  pest_disease?: string;
  severity?: number; // 1-5 scale
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Cooperative {
  id: string;
  name: string;
  description?: string;
  region?: string;
  department?: string;
  commune?: string;
  geom?: any; // PostGIS geometry
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Request/Response types
export interface CreateProducerRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  village?: string;
  commune?: string;
  department?: string;
  region?: string;
  household_size?: number;
  education_level?: string;
  farming_experience_years?: number;
  primary_language?: string;
  cooperative_id?: string;
}

export interface UpdateProducerRequest extends Partial<CreateProducerRequest> {
  is_active?: boolean;
}

export interface CreatePlotRequest {
  producer_id: string;
  cooperative_id?: string;
  name?: string;
  area_ha: number;
  soil_type?: string;
  water_source?: string;
  status: 'preparation' | 'cultivated' | 'fallow';
  geom?: any;
}

export interface UpdatePlotRequest extends Partial<CreatePlotRequest> {}

export interface CreateCropRequest {
  plot_id: string;
  season_id?: string;
  crop_type: string;
  variety?: string;
  sowing_date?: string;
  expected_harvest_date?: string;
  expected_yield_kg?: number;
  status: 'en_cours' | 'récolté' | 'abandonné';
  notes?: string;
}

export interface UpdateCropRequest extends Partial<CreateCropRequest> {}

export interface CreateOperationRequest {
  crop_id: string;
  plot_id: string;
  op_type: 'semis' | 'fertilisation' | 'irrigation' | 'désherbage' | 'phytosanitaire' | 'récolte' | 'labour' | 'reconnaissance';
  op_date: string;
  product_used?: string;
  dose_per_ha?: number;
  cost_per_ha?: number;
  notes?: string;
}

export interface UpdateOperationRequest extends Partial<CreateOperationRequest> {}

export interface CreateObservationRequest {
  crop_id: string;
  plot_id: string;
  obs_date: string;
  emergence_percent?: number;
  pest_disease?: string;
  severity?: number;
  notes?: string;
}

export interface UpdateObservationRequest extends Partial<CreateObservationRequest> {}

export interface CreateCooperativeRequest {
  name: string;
  description?: string;
  region?: string;
  department?: string;
  commune?: string;
  geom?: any;
}

export interface UpdateCooperativeRequest extends Partial<CreateCooperativeRequest> {}

// Query parameters
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  cooperative_id?: string;
  region?: string;
  department?: string;
  status?: string;
  crop_type?: string;
  op_type?: string;
  date_from?: string;
  date_to?: string;
}

// Authentication types
export interface LoginRequest {
  phone: string;
  otp: string;
}

export interface LoginResponse {
  token: string;
  user: UserContext;
  expires_at: string;
}

export interface VerifyOtpRequest {
  phone: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}
