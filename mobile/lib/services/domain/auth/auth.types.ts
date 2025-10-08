import { Database, CacheTTL } from '../lib/types/core';

type Auth = Database['public']['Tables']['profiles']['Row'];
type AuthInsert = Database['public']['Tables']['profiles']['Insert'];
type AuthUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Types pour le service d'authentification
 */

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'agent' | 'superviseur' | 'admin' | 'producteur';
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  phone: string;
  role: 'agent' | 'superviseur' | 'admin' | 'producteur';
  full_name?: string;
  display_name?: string;
  region?: string;
  department?: string;
  commune?: string;
  cooperative_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

export interface LoginCredentials {
  phone: string;
  password?: string;
  otp?: string;
}

export interface RegisterData {
  phone: string;
  password?: string;
  full_name?: string;
  role: 'agent' | 'superviseur' | 'admin' | 'producteur';
  region?: string;
  department?: string;
  commune?: string;
  cooperative_id?: string;
}

export interface PasswordResetData {
  phone: string;
  new_password: string;
  otp: string;
}

export interface AuthFilters {
  role?: string;
  region?: string;
  department?: string;
  commune?: string;
  cooperative_id?: string;
  is_active?: boolean;
}

export interface AuthSort {
  field: 'full_name' | 'role' | 'created_at' | 'last_sign_in_at';
  direction: 'asc' | 'desc';
}

export interface AuthServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
  refreshCache?: boolean;
}

export interface AuthStats {
  total_users: number;
  active_users: number;
  agents_count: number;
  superviseurs_count: number;
  admins_count: number;
  producteurs_count: number;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  expires_at?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}
