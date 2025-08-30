// TypeScript types for AgriConnect database schema
// Generated from the database migrations

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          role: 'admin' | 'superviseur' | 'agent' | 'coop_admin' | 'producteur';
          full_name: string | null;
          phone: string | null;
          language: string | null;
          region: string | null;
          department: string | null;
          commune: string | null;
          state: string | null;
          meta: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin' | 'superviseur' | 'agent' | 'coop_admin' | 'producteur';
          full_name?: string | null;
          phone?: string | null;
          language?: string | null;
          region?: string | null;
          department?: string | null;
          commune?: string | null;
          state?: string | null;
          meta?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'admin' | 'superviseur' | 'agent' | 'coop_admin' | 'producteur';
          full_name?: string | null;
          phone?: string | null;
          language?: string | null;
          region?: string | null;
          department?: string | null;
          commune?: string | null;
          state?: string | null;
          meta?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cooperatives: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          region: string | null;
          department: string | null;
          commune: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          contact_person: string | null;
          geom: unknown | null; // PostGIS Point
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          region?: string | null;
          department?: string | null;
          commune?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          contact_person?: string | null;
          geom?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          region?: string | null;
          department?: string | null;
          commune?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          contact_person?: string | null;
          geom?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      seasons: {
        Row: {
          id: string;
          label: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      producers: {
        Row: {
          id: string;
          profile_id: string | null;
          cooperative_id: string | null;
          first_name: string;
          last_name: string;
          phone: string;
          email: string | null;
          birth_date: string | null;
          gender: 'M' | 'F' | 'O' | null;
          village: string | null;
          commune: string | null;
          department: string | null;
          region: string | null;
          address: string | null;
          household_size: number | null;
          farming_experience_years: number | null;
          primary_language: string | null;
          education_level: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          cooperative_id?: string | null;
          first_name: string;
          last_name: string;
          phone: string;
          email?: string | null;
          birth_date?: string | null;
          gender?: 'M' | 'F' | 'O' | null;
          village?: string | null;
          commune?: string | null;
          department?: string | null;
          region?: string | null;
          address?: string | null;
          household_size?: number | null;
          farming_experience_years?: number | null;
          primary_language?: string | null;
          education_level?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          cooperative_id?: string | null;
          first_name?: string;
          last_name?: string;
          phone?: string;
          email?: string | null;
          birth_date?: string | null;
          gender?: 'M' | 'F' | 'O' | null;
          village?: string | null;
          commune?: string | null;
          department?: string | null;
          region?: string | null;
          address?: string | null;
          household_size?: number | null;
          farming_experience_years?: number | null;
          primary_language?: string | null;
          education_level?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      plots: {
        Row: {
          id: string;
          producer_id: string;
          cooperative_id: string | null;
          name: string;
          area_hectares: number;
          soil_type: 'sandy' | 'clay' | 'loam' | 'silt' | 'organic' | 'other' | null;
          soil_ph: number | null;
          water_source: 'rain' | 'irrigation' | 'well' | 'river' | 'other' | null;
          irrigation_type: 'none' | 'drip' | 'sprinkler' | 'flood' | 'other' | null;
          slope_percent: number | null;
          elevation_meters: number | null;
          geom: unknown | null; // PostGIS Polygon
          center_point: unknown | null; // PostGIS Point
          status: 'active' | 'inactive' | 'abandoned';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          producer_id: string;
          cooperative_id?: string | null;
          name: string;
          area_hectares: number;
          soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'organic' | 'other' | null;
          soil_ph?: number | null;
          water_source?: 'rain' | 'irrigation' | 'well' | 'river' | 'other' | null;
          irrigation_type?: 'none' | 'drip' | 'sprinkler' | 'flood' | 'other' | null;
          slope_percent?: number | null;
          elevation_meters?: number | null;
          geom?: unknown | null;
          center_point?: unknown | null;
          status?: 'active' | 'inactive' | 'abandoned';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          producer_id?: string;
          cooperative_id?: string | null;
          name?: string;
          area_hectares?: number;
          soil_type?: 'sandy' | 'clay' | 'loam' | 'silt' | 'organic' | 'other' | null;
          soil_ph?: number | null;
          water_source?: 'rain' | 'irrigation' | 'well' | 'river' | 'other' | null;
          irrigation_type?: 'none' | 'drip' | 'sprinkler' | 'flood' | 'other' | null;
          slope_percent?: number | null;
          elevation_meters?: number | null;
          geom?: unknown | null;
          center_point?: unknown | null;
          status?: 'active' | 'inactive' | 'abandoned';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      crops: {
        Row: {
          id: string;
          plot_id: string;
          season_id: string;
          crop_type: 'maize' | 'millet' | 'sorghum' | 'rice' | 'peanuts' | 'cotton' | 'vegetables' | 'fruits' | 'other';
          variety: string | null;
          sowing_date: string;
          expected_harvest_date: string | null;
          actual_harvest_date: string | null;
          expected_yield_kg: number | null;
          actual_yield_kg: number | null;
          status: 'en_cours' | 'recolte' | 'abandonne';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plot_id: string;
          season_id: string;
          crop_type: 'maize' | 'millet' | 'sorghum' | 'rice' | 'peanuts' | 'cotton' | 'vegetables' | 'fruits' | 'other';
          variety?: string | null;
          sowing_date: string;
          expected_harvest_date?: string | null;
          actual_harvest_date?: string | null;
          expected_yield_kg?: number | null;
          actual_yield_kg?: number | null;
          status?: 'en_cours' | 'recolte' | 'abandonne';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plot_id?: string;
          season_id?: string;
          crop_type?: 'maize' | 'millet' | 'sorghum' | 'rice' | 'peanuts' | 'cotton' | 'vegetables' | 'fruits' | 'other';
          variety?: string | null;
          sowing_date?: string;
          expected_harvest_date?: string | null;
          actual_harvest_date?: string | null;
          expected_yield_kg?: number | null;
          actual_yield_kg?: number | null;
          status?: 'en_cours' | 'recolte' | 'abandonne';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      operations: {
        Row: {
          id: string;
          crop_id: string;
          plot_id: string;
          operation_type: 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance';
          operation_date: string;
          description: string | null;
          product_used: string | null;
          dose_per_hectare: number | null;
          total_dose: number | null;
          unit: 'kg' | 'l' | 'pieces' | 'other' | null;
          cost_per_hectare: number | null;
          total_cost: number | null;
          performed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          crop_id: string;
          plot_id: string;
          operation_type: 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance';
          operation_date: string;
          description?: string | null;
          product_used?: string | null;
          dose_per_hectare?: number | null;
          total_dose?: number | null;
          unit?: 'kg' | 'l' | 'pieces' | 'other' | null;
          cost_per_hectare?: number | null;
          total_cost?: number | null;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          crop_id?: string;
          plot_id?: string;
          operation_type?: 'semis' | 'fertilisation' | 'irrigation' | 'desherbage' | 'phytosanitaire' | 'recolte' | 'labour' | 'reconnaissance';
          operation_date?: string;
          description?: string | null;
          product_used?: string | null;
          dose_per_hectare?: number | null;
          total_dose?: number | null;
          unit?: 'kg' | 'l' | 'pieces' | 'other' | null;
          cost_per_hectare?: number | null;
          total_cost?: number | null;
          performed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      observations: {
        Row: {
          id: string;
          crop_id: string;
          plot_id: string;
          observation_date: string;
          observation_type: 'levée' | 'maladie' | 'ravageur' | 'stress_hydrique' | 'stress_nutritionnel' | 'développement' | 'other';
          emergence_percent: number | null;
          pest_disease_name: string | null;
          severity: number | null;
          affected_area_percent: number | null;
          description: string | null;
          recommendations: string | null;
          observed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          crop_id: string;
          plot_id: string;
          observation_date: string;
          observation_type: 'levée' | 'maladie' | 'ravageur' | 'stress_hydrique' | 'stress_nutritionnel' | 'développement' | 'other';
          emergence_percent?: number | null;
          pest_disease_name?: string | null;
          severity?: number | null;
          affected_area_percent?: number | null;
          description?: string | null;
          recommendations?: string | null;
          observed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          crop_id?: string;
          plot_id?: string;
          observation_date?: string;
          observation_type?: 'levée' | 'maladie' | 'ravageur' | 'stress_hydrique' | 'stress_nutritionnel' | 'développement' | 'other';
          emergence_percent?: number | null;
          pest_disease_name?: string | null;
          severity?: number | null;
          affected_area_percent?: number | null;
          description?: string | null;
          recommendations?: string | null;
          observed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      media: {
        Row: {
          id: string;
          owner_profile_id: string;
          entity_type: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
          entity_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          file_size_bytes: number | null;
          gps_coordinates: unknown | null; // PostGIS Point
          taken_at: string | null;
          description: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_profile_id: string;
          entity_type: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
          entity_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          file_size_bytes?: number | null;
          gps_coordinates?: unknown | null;
          taken_at?: string | null;
          description?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_profile_id?: string;
          entity_type?: 'plot' | 'crop' | 'operation' | 'observation' | 'producer';
          entity_id?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          file_size_bytes?: number | null;
          gps_coordinates?: unknown | null;
          taken_at?: string | null;
          description?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      agri_rules: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          condition_sql: string;
          action_type: 'notification' | 'recommendation' | 'alert' | 'reminder';
          action_message: string;
          severity: 'info' | 'warning' | 'critical';
          is_active: boolean;
          applicable_crops: string[] | null;
          applicable_regions: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          condition_sql: string;
          action_type: 'notification' | 'recommendation' | 'alert' | 'reminder';
          action_message: string;
          severity?: 'info' | 'warning' | 'critical';
          is_active?: boolean;
          applicable_crops?: string[] | null;
          applicable_regions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          condition_sql?: string;
          action_type?: 'notification' | 'recommendation' | 'alert' | 'reminder';
          action_message?: string;
          severity?: 'info' | 'warning' | 'critical';
          is_active?: boolean;
          applicable_crops?: string[] | null;
          applicable_regions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recommendations: {
        Row: {
          id: string;
          crop_id: string | null;
          plot_id: string | null;
          producer_id: string | null;
          rule_code: string | null;
          title: string;
          message: string;
          recommendation_type: 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
          sent_at: string | null;
          acknowledged_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          crop_id?: string | null;
          plot_id?: string | null;
          producer_id?: string | null;
          rule_code?: string | null;
          title: string;
          message: string;
          recommendation_type: 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
          sent_at?: string | null;
          acknowledged_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          crop_id?: string | null;
          plot_id?: string | null;
          producer_id?: string | null;
          rule_code?: string | null;
          title?: string;
          message?: string;
          recommendation_type?: 'fertilisation' | 'irrigation' | 'pest_control' | 'harvest' | 'other';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'dismissed';
          sent_at?: string | null;
          acknowledged_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          body: string;
          channel: 'sms' | 'whatsapp' | 'push' | 'email' | 'inapp';
          provider: string | null;
          status: 'pending' | 'sent' | 'delivered' | 'failed';
          sent_at: string | null;
          delivered_at: string | null;
          error_message: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          body: string;
          channel: 'sms' | 'whatsapp' | 'push' | 'email' | 'inapp';
          provider?: string | null;
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          sent_at?: string | null;
          delivered_at?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          title?: string;
          body?: string;
          channel?: 'sms' | 'whatsapp' | 'push' | 'email' | 'inapp';
          provider?: string | null;
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          sent_at?: string | null;
          delivered_at?: string | null;
          error_message?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_values: Json | null;
          new_values: Json | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_values?: Json | null;
          new_values?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string;
          action?: 'INSERT' | 'UPDATE' | 'DELETE';
          old_values?: Json | null;
          new_values?: Json | null;
          changed_by?: string | null;
          changed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_cooperative_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      is_admin_or_supervisor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean | null;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper types for common operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types
export type Profile = Tables<'profiles'>;
export type Cooperative = Tables<'cooperatives'>;
export type Season = Tables<'seasons'>;
export type Producer = Tables<'producers'>;
export type Plot = Tables<'plots'>;
export type Crop = Tables<'crops'>;
export type Operation = Tables<'operations'>;
export type Observation = Tables<'observations'>;
export type Media = Tables<'media'>;
export type AgriRule = Tables<'agri_rules'>;
export type Recommendation = Tables<'recommendations'>;
export type Notification = Tables<'notifications'>;
export type AuditLog = Tables<'audit_logs'>;

// Extended types with relationships
export interface ProducerWithPlots extends Producer {
  plots: Plot[];
}

export interface PlotWithCrops extends Plot {
  crops: Crop[];
  producer: Producer;
}

export interface CropWithOperations extends Crop {
  operations: Operation[];
  observations: Observation[];
  plot: Plot;
}

export interface OperationWithDetails extends Operation {
  crop: Crop;
  plot: Plot;
}

export interface ObservationWithDetails extends Observation {
  crop: Crop;
  plot: Plot;
}

// Utility types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
