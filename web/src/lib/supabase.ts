/**
 * Supabase Client Configuration for Web - AgriConnect
 * Client spécifique pour l'application web
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase/types/database';

// Environment variables pour le web
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client for web
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Web uses localStorage by default
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'agriconnect-web',
    },
  },
});

// Export types for convenience
export type { User, Session, AuthError } from '@supabase/supabase-js';
export type { Database } from '../../../lib/supabase/types/database';

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
