import { Database, CacheTTL } from '../lib/types/core';

type Participants = Database['public']['Tables']['participants']['Row'];
type ParticipantsInsert = Database['public']['Tables']['participants']['Insert'];
type ParticipantsUpdate = Database['public']['Tables']['participants']['Update'];

/**
 * Types pour le service Participants
 */

export interface Participant {
  id: string;
  name: string;
  role: 'owner' | 'family_member' | 'worker' | 'supervisor' | 'other';
  phone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  education_level?: 'none' | 'primary' | 'secondary' | 'high_school' | 'university' | 'other';
  experience_years?: number;
  skills?: string[];
  plot_id?: string;
  farm_file_id?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface ParticipantCreate {
  name: string;
  role: 'owner' | 'family_member' | 'worker' | 'supervisor' | 'other';
  phone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  education_level?: 'none' | 'primary' | 'secondary' | 'high_school' | 'university' | 'other';
  experience_years?: number;
  skills?: string[];
  plot_id?: string;
  farm_file_id?: string;
  is_active?: boolean;
  notes?: string;
}

export interface ParticipantUpdate {
  name?: string;
  role?: 'owner' | 'family_member' | 'worker' | 'supervisor' | 'other';
  phone?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  education_level?: 'none' | 'primary' | 'secondary' | 'high_school' | 'university' | 'other';
  experience_years?: number;
  skills?: string[];
  plot_id?: string;
  farm_file_id?: string;
  is_active?: boolean;
  notes?: string;
}

export interface ParticipantFilters {
  role?: 'owner' | 'family_member' | 'worker' | 'supervisor' | 'other';
  plot_id?: string;
  farm_file_id?: string;
  is_active?: boolean;
  gender?: 'male' | 'female' | 'other';
  education_level?: 'none' | 'primary' | 'secondary' | 'high_school' | 'university' | 'other';
  age_min?: number;
  age_max?: number;
  experience_min?: number;
  experience_max?: number;
  search?: string;
}

export interface ParticipantStats {
  total_participants: number;
  active_participants: number;
  inactive_participants: number;
  by_role: Record<string, number>;
  by_gender: Record<string, number>;
  by_education: Record<string, number>;
  by_plot: Record<string, number>;
  by_farm_file: Record<string, number>;
  average_age: number;
  average_experience: number;
}

export interface ParticipantWithDetails extends Participant {
  plot_name?: string;
  farm_file_name?: string;
  created_by_name?: string;
  activity_summary?: {
    total_operations: number;
    total_observations: number;
    last_activity?: string;
  };
}

export interface ParticipantWorkload {
  participant_id: string;
  participant_name: string;
  role: string;
  total_activities: number;
  recent_activities: number;
  workload_score: number; // 0-100
  skills_utilization: string[];
  performance_rating?: number;
}

export interface ParticipantSkill {
  participant_id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  years_experience: number;
  last_used?: string;
  certification?: string;
  notes?: string;
}

export interface ParticipantTraining {
  id: string;
  participant_id: string;
  training_name: string;
  training_type: 'on_farm' | 'classroom' | 'online' | 'workshop' | 'other';
  provider: string;
  start_date: string;
  end_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  certificate_url?: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
}
