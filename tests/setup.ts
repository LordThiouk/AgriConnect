/**
 * Configuration des tests - AgriConnect
 * Setup global pour l'environnement de test
 */

import { vi } from 'vitest';

// Configuration globale des mocks
global.console = {
  ...console,
  // Réduire le bruit des logs pendant les tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_MESSAGE_SERVICE_SID = 'test-message-service-sid';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'test@agriconnect.sn';

// Mock des APIs du navigateur pour les tests web
if (typeof window === 'undefined') {
  global.window = {} as any;
  global.document = {} as any;
  global.navigator = {} as any;
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  } as any;
  global.sessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  } as any;
}

// Mock des timers pour les tests de session
vi.useFakeTimers();

// Configuration des mocks globaux
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((obj: any) => obj.ios)
  },
  Alert: {
    alert: vi.fn()
  },
  Linking: {
    openURL: vi.fn()
  }
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn()
}));

vi.mock('expo-notifications', () => ({
  getPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: vi.fn(() => Promise.resolve({ data: 'test-push-token' })),
  addNotificationReceivedListener: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn()
}));

// Mock des services externes
vi.mock('twilio', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(() => Promise.resolve({ sid: 'test-message-sid' }))
    }
  }))
}));

// Mock des fonctions de validation
vi.mock('zod', () => ({
  z: {
    string: () => ({
      min: () => ({
        max: () => ({
          regex: () => ({
            parse: vi.fn(),
            safeParse: vi.fn(),
            parseAsync: vi.fn(),
            safeParseAsync: vi.fn()
          })
        })
      }),
      email: () => ({
        parse: vi.fn(),
        safeParse: vi.fn(),
        parseAsync: vi.fn(),
        safeParseAsync: vi.fn()
      }),
      object: () => ({
        parse: vi.fn(),
        safeParse: vi.fn(),
        parseAsync: vi.fn(),
        safeParseAsync: vi.fn()
      })
    }),
    object: () => ({
      parse: vi.fn(),
      safeParse: vi.fn(),
      parseAsync: vi.fn(),
      safeParseAsync: vi.fn()
    })
  }
}));

// Configuration des tests d'authentification
export const mockAuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  phone: '+221701234567',
  user_metadata: {
    role: 'agent',
    full_name: 'Test User',
    platform: 'mobile'
  },
  app_metadata: {
    provider: 'phone'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockAuthSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: mockAuthUser
};

export const mockMobileAuthResponse = {
  success: true,
  message: 'Opération réussie',
  user: mockAuthUser,
  session: mockAuthSession,
  error: null
};

export const mockWebAuthResponse = {
  success: true,
  message: 'Opération réussie',
  user: mockAuthUser,
  session: mockAuthSession,
  error: null
};

// Fonctions utilitaires pour les tests
export const createMockUser = (overrides: Partial<typeof mockAuthUser> = {}) => ({
  ...mockAuthUser,
  ...overrides
});

export const createMockSession = (overrides: Partial<typeof mockAuthSession> = {}) => ({
  ...mockAuthSession,
  ...overrides
});

export const createMockAuthResponse = (
  type: 'mobile' | 'web',
  overrides: Partial<typeof mockMobileAuthResponse> = {}
) => {
  const baseResponse = type === 'mobile' ? mockMobileAuthResponse : mockWebAuthResponse;
  return {
    ...baseResponse,
    ...overrides
  };
};

// Configuration des tests de performance
export const performanceTestConfig = {
  timeout: 5000,
  threshold: 100, // ms
  iterations: 100
};

// Configuration des tests de sécurité
export const securityTestConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordMaxLength: 128,
  otpLength: 6,
  otpExpiry: 5 * 60 * 1000 // 5 minutes
};

// Nettoyage après chaque test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Nettoyage global après tous les tests
afterAll(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// Configuration des tests d'intégration
export const integrationTestConfig = {
  database: {
    url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
    resetBeforeTest: true,
    seedData: true
  },
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    timeout: 10000
  },
  auth: {
    testUser: {
      email: 'test@agriconnect.sn',
      password: 'TestPass123!',
      role: 'admin'
    },
    testPhone: '+221701234567'
  }
};

// Export des configurations de test
export default {
  mockAuthUser,
  mockAuthSession,
  mockMobileAuthResponse,
  mockWebAuthResponse,
  createMockUser,
  createMockSession,
  createMockAuthResponse,
  performanceTestConfig,
  securityTestConfig,
  integrationTestConfig
};
