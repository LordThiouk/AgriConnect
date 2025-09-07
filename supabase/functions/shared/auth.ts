// Shared Authentication Module for AgriConnect Edge Functions
// Provides JWT validation, role checking, and user context

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent' | 'coop_admin' | 'producer';
  cooperative_id?: string;
  profile_id: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  token: string;
}

/**
 * Extract and validate JWT token from request headers
 */
export const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Validate JWT token and return user information
 */
export const validateToken = async (token: string): Promise<AuthenticatedUser> => {
  try {
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Get user profile with role and cooperative information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, cooperative_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    return {
      id: user.id,
      email: profile.email || user.email || '',
      role: profile.role,
      cooperative_id: profile.cooperative_id,
      profile_id: profile.id
    };
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

/**
 * Require authentication for an endpoint
 */
export const requireAuth = async (req: Request): Promise<AuthContext> => {
  const token = extractToken(req);
  if (!token) {
    throw new Error('Missing authorization token');
  }

  const user = await validateToken(token);
  return { user, token };
};

/**
 * Check if user has required role
 */
export const requireRole = (user: AuthenticatedUser, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(user.role);
};

/**
 * Check if user can access cooperative data
 */
export const canAccessCooperative = (user: AuthenticatedUser, cooperativeId: string): boolean => {
  // Admin and supervisor can access all cooperatives
  if (user.role === 'admin' || user.role === 'supervisor') {
    return true;
  }
  
  // Other roles can only access their own cooperative
  return user.cooperative_id === cooperativeId;
};

/**
 * Get user's cooperative ID (for RLS policies)
 */
export const getUserCooperativeId = (user: AuthenticatedUser): string | null => {
  return user.cooperative_id || null;
};

/**
 * Create error response for authentication failures
 */
export const createAuthErrorResponse = (message: string, status: number = 401) => {
  return new Response(JSON.stringify({
    error: 'Authentication failed',
    message,
    status
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
  });
};

/**
 * Middleware for role-based access control
 */
export const withRole = (requiredRoles: string[]) => {
  return async (req: Request): Promise<AuthContext> => {
    const authContext = await requireAuth(req);
    
    if (!requireRole(authContext.user, requiredRoles)) {
      throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }
    
    return authContext;
  };
};

/**
 * Middleware for cooperative-based access control
 */
export const withCooperativeAccess = (cooperativeId: string) => {
  return async (req: Request): Promise<AuthContext> => {
    const authContext = await requireAuth(req);
    
    if (!canAccessCooperative(authContext.user, cooperativeId)) {
      throw new Error('Access denied to this cooperative');
    }
    
    return authContext;
  };
};
