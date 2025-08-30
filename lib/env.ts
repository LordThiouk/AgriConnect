/**
 * Shared Environment Configuration for AgriConnect
 * This file provides environment variable validation and access
 * for both web and mobile applications.
 */

export interface EnvironmentConfig {
  SUPABASE_PROJECT_ID: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NODE_ENV: string;
  WEB_APP_URL?: string;
  MOBILE_APP_URL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
}

/**
 * Validate required environment variables
 * @throws Error if required variables are missing
 */
export const validateEnv = (): EnvironmentConfig => {
  const required = [
    'SUPABASE_PROJECT_ID',
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY'
  ];
  
  for (const var_name of required) {
    if (!process.env[var_name]) {
      throw new Error(`Missing required environment variable: ${var_name}`);
    }
  }

  return {
    SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID!,
    SUPABASE_URL: process.env.SUPABASE_URL!,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV || 'development',
    WEB_APP_URL: process.env.WEB_APP_URL,
    MOBILE_APP_URL: process.env.MOBILE_APP_URL,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  };
};

/**
 * Get environment configuration with validation
 */
export const getEnv = (): EnvironmentConfig => {
  try {
    return validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};
