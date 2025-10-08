// Types centralisés pour AgriConnect
// Ce fichier contient toutes les définitions de types partagées

// ===== AUTHENTICATION TYPES =====
export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'supervisor' | 'agent' | 'producer' | 'coop_admin';
  display_name?: string;
  created_at: string;
  updated_at: string;
}

// ===== COOPERATIVE TYPES =====
export interface Cooperative {
  id: string;
  name: string;
  region?: string;
  department?: string;
  commune?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  geom?: any;
  created_at: string;
  updated_at: string;
}

export interface CooperativeFilters {
  search?: string;
  region?: string;
  department?: string;
  commune?: string;
  hasGeo?: string;
  // minProducers et maxProducers supprimés - utiliser le modal "Voir producteurs"
}

// ===== AGENT TYPES =====
export interface Agent {
  id: string;
  user_id: string;
  display_name: string;
  phone?: string;
  region?: string;
  department?: string;
  commune?: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Performance metrics
  totalVisits?: number;
  totalProducers?: number;
  totalPlots?: number;
  avgVisitsPerMonth?: number;
  dataQualityRate?: number;
  visitsThisMonth?: number;
  // Assignment data
  assignments?: AgentAssignment[];
  cooperatives?: Cooperative[];
}

// ===== AGENT ASSIGNMENT TYPES =====
export interface AgentAssignment {
  id: string;
  agent_id: string;
  assigned_to_type: 'producer' | 'cooperative';
  assigned_to_id: string;
  assigned_at: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  assigned_to_name?: string;
  assigned_by_name?: string;
}

export interface CreateAgentAssignmentData {
  agent_id: string;
  assigned_to_type: 'producer' | 'cooperative';
  assigned_to_id: string;
  assigned_by?: string;
}

export interface AgentAssignmentStats {
  total_assignments: number;
  producer_assignments: number;
  cooperative_assignments: number;
  recent_assignments: number;
}

export interface AvailableAgent {
  agent_id: string;
  agent_name: string;
  region: string;
  cooperative_name?: string;
  total_assigned_producers: number;
}

export interface CreateAgentData {
  user_id: string;
  display_name: string;
  phone?: string;
  region?: string;
  department?: string;
  commune?: string;
  is_active?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface UpdateAgentData {
  id: string;
  display_name?: string;
  phone?: string;
  region?: string;
  department?: string;
  commune?: string;
  is_active?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface AgentFilters {
  search?: string;
  region?: string;
  department?: string;
  commune?: string;
  cooperative_id?: string;
  is_active?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export interface AgentPerformance {
  totalProducers: number;
  totalVisits: number;
  totalPlots: number;
  totalOperations: number;
  totalObservations: number;
  visitsThisMonth: number;
  avgVisitsPerProducer: number;
  lastSyncDate: string | null;
  dataCompletionRate: number;
  photosPerPlot: number;
  gpsAccuracyRate: number;
  avgVisitDuration: number;
  avgDataEntryTime: number;
  syncSuccessRate: number;
  avgVisitsPerMonth: number;
  dataQualityRate: number;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalProducers: number;
  totalVisits: number;
  avgVisitsPerAgent: number;
  dataQualityRate: number;
}

// ===== PRODUCER TYPES =====
export interface Producer {
  id: string;
  profile_id: string;
  cooperative_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender: 'M' | 'F' | 'O';
  birth_date?: string;
  region?: string;
  department?: string;
  commune?: string;
  address?: string;
  household_size?: number;
  farming_experience_years?: number;
  primary_language?: string;
  education_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  cooperative?: Cooperative;
  assigned_agents?: Agent[];
  farm_files?: FarmFile[];
  recent_operations?: {
    id: string;
    operation_type: string;
    operation_date: string;
    description: string;
    performer_id: string;
  }[];
  // Computed properties
  plots_count?: number;
  total_area?: number;
  farm_files_count?: number;
  recent_observations?: {
    id: string;
    observation_type: string;
    observation_date: string;
    description: string;
    observed_by: string;
  }[];
}

export interface ProducerFilters {
  search?: string;
  cooperative_id?: string;
  region?: string;
  department?: string;
  gender?: string;
  is_active?: boolean;
}


// ===== FARM FILE TYPES =====
export interface FarmFile {
  id: string;
  responsible_producer_id: string;
  cooperative_id?: string;
  status: 'draft' | 'validated';
  total_area_hectares: number;
  equipment_inventory?: EquipmentItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  producer?: Producer;
  cooperative?: Cooperative;
  plots?: Plot[];
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

// ===== PLOT TYPES =====
export interface Plot {
  id: string;
  producer_id: string;
  name: string;
  area_hectares?: number;
  soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'organic' | 'other';
  soil_ph?: number;
  water_source?: 'rain' | 'irrigation' | 'well' | 'river' | 'other';
  irrigation_type?: 'none' | 'drip' | 'sprinkler' | 'flood' | 'other';
  slope_percent?: number;
  elevation_meters?: number;
  status: 'active' | 'inactive' | 'abandoned';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Geographic data
  latitude?: number;
  longitude?: number;
  geom?: any; // PostGIS geometry
  center_point?: any; // PostGIS center point
  // Relations
  producer?: Producer;
  crops?: Crop[];
}

// ===== CROP TYPES =====
export interface Crop {
  id: string;
  plot_id: string;
  crop_type: string;
  variety?: string;
  sowing_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  estimated_yield_kg_ha?: number;
  actual_yield_kg_ha?: number;
  area_hectares?: number;
  status: 'en_cours' | 'recolte' | 'abandonne';
  season?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  plot?: Plot;
  operations?: Operation[];
  observations?: Observation[];
}

// ===== OPERATION TYPES =====
export interface Operation {
  id: string;
  crop_id: string;
  plot_id: string;
  operation_type: 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance';
  operation_date: string;
  description?: string;
  product_used?: string;
  dose_per_hectare?: number;
  total_dose?: number;
  unit?: 'kg' | 'l' | 'pieces' | 'other';
  cost_per_hectare?: number;
  total_cost?: number;
  performer_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  crop?: {
    id: string;
    crop_type: string;
    variety: string;
  };
  plot?: {
    id: string;
    name: string;
  };
}

export interface OperationFilters {
  search?: string;
  operation_type?: string;
  plot_id?: string;
  crop_id?: string;
  date_from?: string;
  date_to?: string;
}

// ===== OBSERVATION TYPES =====
export interface Observation {
  id: string;
  crop_id: string;
  plot_id: string;
  observation_type: 'levée' | 'maladie' | 'ravageur' | 'stress_hydrique' | 'stress_nutritionnel' | 'développement' | 'other';
  observation_date: string;
  emergence_percent?: number;
  pest_disease_name?: string;
  severity?: number; // 1-5 scale
  affected_area_percent?: number;
  description?: string;
  recommendations?: string;
  observed_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  crop?: {
    id: string;
    crop_type: string;
    variety: string;
  };
  plot?: {
    id: string;
    name: string;
  };
}

export interface ObservationFilters {
  search?: string;
  observation_type?: string;
  plot_id?: string;
  crop_id?: string;
  date_from?: string;
  date_to?: string;
}

// ===== PAGINATION TYPES =====
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== DASHBOARD TYPES =====
export interface DashboardStats {
  totalProducers: number;
  totalCooperatives: number;
  totalRegions: number;
  totalDepartments: number;
  activeProducers: number;
  recentOperations: number;
  pendingObservations: number;
}

export interface CultureDistribution {
  crop_type: string;
  count: number;
  percentage: number;
}

export interface RegionalStats {
  region: string;
  producer_count: number;
  cooperative_count: number;
  total_area: number;
}

// ===== FORM TYPES =====
export interface ProducerFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  gender: 'M' | 'F' | 'O';
  birth_date?: string;
  region?: string;
  department?: string;
  commune?: string;
  address?: string;
  household_size?: number;
  farming_experience_years?: number;
  primary_language?: string;
  education_level?: string;
  cooperative_id?: string;
}

export interface CooperativeFormData {
  name: string;
  region?: string;
  department?: string;
  commune?: string;
  address?: string;
  phone?: string;
  email?: string;
  president_name?: string;
  president_phone?: string;
  established_date?: string;
}

export interface OperationFormData {
  operation_type: string;
  operation_date: string;
  description?: string;
  product_used?: string;
  dose_per_hectare?: string;
  total_dose?: string;
  unit?: string;
  cost_per_hectare?: string;
  total_cost?: string;
  notes?: string;
}

export interface ObservationFormData {
  observation_type: string;
  observation_date: string;
  emergence_percent?: string;
  pest_disease_name?: string;
  severity?: string;
  affected_area_percent?: string;
  description?: string;
  recommendations?: string;
}

export interface FarmFileFormData {
  responsible_producer_id: string;
  cooperative_id?: string;
  status: 'draft' | 'validated';
  total_area_hectares: string;
  equipment_inventory: EquipmentItem[];
  notes?: string;
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  hint?: string;
}

// ===== FILTER TYPES =====
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterOptions {
  regions: FilterOption[];
  departments: FilterOption[];
  communes: FilterOption[];
  cooperatives: FilterOption[];
  genders: FilterOption[];
  operation_types: FilterOption[];
  observation_types: FilterOption[];
}

// ===== EXPORT TYPES =====
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filters?: any;
  fields?: string[];
}

// ===== NOTIFICATION TYPES =====
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
}

// ===== VISIT TYPES =====
export interface Visit {
  id: string;
  agent_id: string;
  producer_id: string;
  plot_id?: string;
  cooperative_id?: string;
  visit_date: string;
  visit_type: 'planned' | 'follow_up' | 'emergency' | 'routine';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  duration_minutes?: number;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  weather_conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVisitData {
  agent_id: string;
  producer_id: string;
  plot_id?: string;
  cooperative_id?: string;
  visit_date: string;
  visit_type?: 'planned' | 'follow_up' | 'emergency' | 'routine';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  duration_minutes?: number;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  weather_conditions?: string;
}

export interface UpdateVisitData {
  id: string;
  visit_date?: string;
  visit_type?: 'planned' | 'follow_up' | 'emergency' | 'routine';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  duration_minutes?: number;
  location_latitude?: number;
  location_longitude?: number;
  notes?: string;
  weather_conditions?: string;
}

// ===== PLOT FILTERS & STATS =====
export interface PlotFilters {
  search?: string;
  producer_id?: string;
  status?: 'active' | 'inactive' | 'abandoned';
  soil_type?: string;
  water_source?: string;
  region?: string;
  cooperative_id?: string;
}

export interface PlotStats {
  totalPlots: number;
  activePlots: number;
  totalArea: number;
  averageArea: number;
  plotsByStatus: Record<string, number>;
  plotsBySoilType: Record<string, number>;
}

// ===== CROP FILTERS & STATS =====
export interface CropFilters {
  search?: string;
  plot_id?: string;
  crop_type?: string;
  status?: 'en_cours' | 'recolte' | 'abandonne';
  season?: string;
  producer_id?: string;
  region?: string;
  cooperative_id?: string;
}

export interface CropStats {
  totalCrops: number;
  activeCrops: number;
  harvestedCrops: number;
  failedCrops: number;
  totalArea: number;
  averageYield: number;
  cropsByType: Record<string, number>;
  cropsByStatus: Record<string, number>;
}

// ===== AUDIT TYPES =====
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id: string;
  created_at: string;
}

// ===== ALERTS & RECOMMENDATIONS TYPES =====
export interface Recommendation {
  id: string;
  crop_id?: string;
  plot_id?: string;
  producer_id?: string;
  rule_code?: string;
  title: string;
  message: string;
  recommendation_type: 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
  sent_at?: string;
  acknowledged_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  producer?: Producer;
  plot?: Plot;
  crop?: Crop;
}

export interface AgriRule {
  id: string;
  code: string;
  name: string;
  description?: string;
  condition_sql: string;
  action_type: 'notification' | 'recommendation' | 'alert' | 'reminder';
  action_message: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  applicable_crops?: string[];
  applicable_regions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  channel: 'sms' | 'whatsapp' | 'push' | 'email' | 'inapp';
  provider?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: User;
}

// ===== FILTERS & STATS FOR ALERTS =====
export interface RecommendationFilters {
  search?: string;
  recommendation_type?: 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
  producer_id?: string;
  region?: string;
  cooperative_id?: string;
  created_from?: string;
  created_to?: string;
}

export interface RecommendationStats {
  totalRecommendations: number;
  pendingRecommendations: number;
  completedRecommendations: number;
  criticalRecommendations: number;
  recommendationsByType: Record<string, number>;
  recommendationsByPriority: Record<string, number>;
  recommendationsByStatus: Record<string, number>;
}

export interface AgriRuleFilters {
  search?: string;
  action_type?: 'notification' | 'recommendation' | 'alert' | 'reminder';
  severity?: 'info' | 'warning' | 'critical';
  is_active?: boolean;
  applicable_crops?: string[];
  applicable_regions?: string[];
}

export interface NotificationFilters {
  search?: string;
  channel?: 'sms' | 'whatsapp' | 'push' | 'email' | 'inapp';
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
  profile_id?: string;
  sent_from?: string;
  sent_to?: string;
}

export interface NotificationStats {
  totalNotifications: number;
  pendingNotifications: number;
  deliveredNotifications: number;
  failedNotifications: number;
  notificationsByChannel: Record<string, number>;
  notificationsByStatus: Record<string, number>;
  deliveryRate: number;
}
