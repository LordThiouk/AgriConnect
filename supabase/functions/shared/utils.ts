// Shared utilities for AgriConnect Edge Functions API

import { createClient } from '@supabase/supabase-js';
import { ApiResponse, UserContext, QueryParams } from './types';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Response helpers
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(error: string, status = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

export function notFoundResponse(resource: string): Response {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(): Response {
  return errorResponse('Unauthorized', 401);
}

export function forbiddenResponse(): Response {
  return errorResponse('Forbidden', 403);
}

export function validationErrorResponse(errors: string[]): Response {
  return errorResponse(`Validation error: ${errors.join(', ')}`, 400);
}

// Authentication helpers
export async function authenticateUser(req: Request): Promise<UserContext | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile with role and cooperative
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, cooperative_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: user.id,
      role: profile.role,
      cooperative_id: profile.cooperative_id
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Authorization helpers
export function canAccessProducer(user: UserContext, producerCooperativeId?: string): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'supervisor') return true;
  if (user.role === 'agent' || user.role === 'coop_admin') {
    return user.cooperative_id === producerCooperativeId;
  }
  return false;
}

export function canAccessPlot(user: UserContext, plotCooperativeId?: string): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'supervisor') return true;
  if (user.role === 'agent' || user.role === 'coop_admin') {
    return user.cooperative_id === plotCooperativeId;
  }
  return false;
}

export function canModifyData(user: UserContext): boolean {
  return ['admin', 'supervisor', 'agent'].includes(user.role);
}

export function canDeleteData(user: UserContext): boolean {
  return ['admin', 'supervisor'].includes(user.role);
}

// Query parameter helpers
export function parseQueryParams(url: URL): QueryParams {
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: Math.min(parseInt(url.searchParams.get('limit') || '50'), 100), // Max 100 items
    search: url.searchParams.get('search') || undefined,
    cooperative_id: url.searchParams.get('cooperative_id') || undefined,
    region: url.searchParams.get('region') || undefined,
    department: url.searchParams.get('department') || undefined,
    status: url.searchParams.get('status') || undefined,
    crop_type: url.searchParams.get('crop_type') || undefined,
    op_type: url.searchParams.get('op_type') || undefined,
    date_from: url.searchParams.get('date_from') || undefined,
    date_to: url.searchParams.get('date_to') || undefined
  };
}

// Pagination helpers
export function buildPaginationQuery(query: any, params: QueryParams) {
  if (params.page && params.limit) {
    const offset = (params.page - 1) * params.limit;
    query = query.range(offset, offset + params.limit - 1);
  }
  return query;
}

export function buildSearchQuery(query: any, search?: string, searchFields: string[] = []) {
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map(field => 
      `${field}.ilike.%${search}%`
    );
    query = query.or(searchConditions.join(','));
  }
  return query;
}

export function buildFilterQuery(query: any, params: QueryParams, filters: Record<string, string> = {}) {
  Object.entries(params).forEach(([key, value]) => {
    if (value && filters[key]) {
      query = query.eq(filters[key], value);
    }
  });
  return query;
}

// Date helpers
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Validation helpers
export function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const errors: string[] = [];
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone validation for Senegal (+221)
  const phoneRegex = /^(\+221|221)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// CORS helpers
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders()
    });
  }
  return null;
}

// Logging helpers
export function logRequest(method: string, path: string, user?: UserContext) {
  console.log(`[${new Date().toISOString()}] ${method} ${path} - User: ${user?.id || 'anonymous'} (${user?.role || 'none'})`);
}

export function logError(error: any, context: string) {
  console.error(`[${new Date().toISOString()}] Error in ${context}:`, error);
}
