// AgriConnect Web App Configuration
// Centralized configuration management

export const config = {
  // App Information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AgriConnect',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.VITE_APP_ENV || 'development',
    language: 'fr', // Français par défaut
  },

  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://swggnqbymblnyjcocqxi.supabase.co/functions/v1',
    timeout: 30000, // 30 secondes
  },

  // Feature Flags
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  },

  // Pagination Defaults
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },

  // Validation Rules
  validation: {
    phone: {
      pattern: /^\+221[0-9]{9}$/,
      message: 'Le numéro de téléphone doit être au format +221XXXXXXXXX',
    },
    coordinates: {
      lat: { min: -90, max: 90 },
      lng: { min: -180, max: 180 },
    },
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#3D944B', // Vert AgriConnect
      secondary: '#FFD65A', // Jaune clair
      accent: '#4F46E5', // Indigo
      success: '#10B981', // Vert
      warning: '#F59E0B', // Ambre
      error: '#EF4444', // Rouge
    },
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Helper function to get environment variable with fallback
export function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback;
}

// Helper function to check if we're in development mode
export function isDevelopment(): boolean {
  return config.app.environment === 'development';
}

// Helper function to check if we're in production mode
export function isProduction(): boolean {
  return config.app.environment === 'production';
}

// Helper function to get API endpoint URL
export function getApiUrl(endpoint: string): string {
  return `${config.api.baseUrl}${endpoint}`;
}

// Export default config
export default config;
