import { Database, CacheTTL } from '../lib/types/core';

type Recommendations = Database['public']['Tables']['recommendations']['Row'];
type RecommendationsInsert = Database['public']['Tables']['recommendations']['Insert'];
type RecommendationsUpdate = Database['public']['Tables']['recommendations']['Update'];

/**
 * Types pour le service Recommendations
 */

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'planting' | 'general' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired';
  applicable_crops: string[];
  applicable_regions: string[];
  applicable_seasons: string[];
  conditions: string;
  actions: string[];
  expected_benefits: string;
  implementation_date?: string;
  completion_date?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationCreate {
  title: string;
  description: string;
  type: 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'planting' | 'general' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  applicable_crops: string[];
  applicable_regions: string[];
  applicable_seasons: string[];
  conditions: string;
  actions: string[];
  expected_benefits: string;
  implementation_date?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationUpdate {
  title?: string;
  description?: string;
  type?: 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'planting' | 'general' | 'alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired';
  applicable_crops?: string[];
  applicable_regions?: string[];
  applicable_seasons?: string[];
  conditions?: string;
  actions?: string[];
  expected_benefits?: string;
  implementation_date?: string;
  completion_date?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
}

export interface RecommendationFilters {
  type?: 'fertilizer' | 'pesticide' | 'irrigation' | 'harvest' | 'planting' | 'general' | 'alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired';
  applicable_crops?: string[];
  applicable_regions?: string[];
  applicable_seasons?: string[];
  created_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface RecommendationStats {
  total_recommendations: number;
  pending_recommendations: number;
  accepted_recommendations: number;
  rejected_recommendations: number;
  implemented_recommendations: number;
  expired_recommendations: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  by_region: Record<string, number>;
  by_crop: Record<string, number>;
}

export interface RecommendationWithDetails extends Recommendation {
  created_by_name?: string;
  implementation_progress?: number;
  related_plots?: string[];
  related_producers?: string[];
  feedback?: {
    rating?: number;
    comments?: string;
    submitted_at?: string;
  };
}

export interface RecommendationAssignment {
  recommendation_id: string;
  producer_id?: string;
  plot_id?: string;
  agent_id?: string;
  assigned_at: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface RecommendationFeedback {
  recommendation_id: string;
  producer_id: string;
  rating: number;
  comments?: string;
  implementation_notes?: string;
  submitted_at: string;
  submitted_by: string;
}
