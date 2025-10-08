/**
 * Types pour l'API client centralisé AgriConnect
 * Gestion des requêtes avec interceptors et cache automatique
 */

import { CacheEntry, CacheTTL } from './cache';

export interface ApiRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  cache?: boolean | CacheTTL; // Cache automatique
  retry?: boolean; // Retry automatique en cas d'erreur
  timeout?: number; // Timeout en ms
}

export interface ApiResponse<T = any> {
  data: T;
  error?: ApiError;
  status: number;
  headers: Record<string, string>;
  cached: boolean; // Indique si la réponse vient du cache
  responseTime: number; // Temps de réponse en ms
  timestamp: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  data?: any;
  originalError?: Error;
  timestamp: number;
}

export interface ApiInterceptor {
  request?: (request: ApiRequest) => ApiRequest | Promise<ApiRequest>;
  response?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
  error?: (error: ApiError) => ApiError | Promise<ApiError>;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCache: boolean;
  enableMetrics: boolean;
  interceptors: ApiInterceptor[];
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedResponses: number;
  averageResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  errorRate: number;
}

// Types pour les requêtes Supabase spécifiques
export interface SupabaseRequest extends Omit<ApiRequest, 'url'> {
  table: string;
  action: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  columns?: string[];
  filter?: Record<string, any>;
  order?: string;
  limit?: number;
  offset?: number;
}

export interface SupabaseResponse<T = any> extends ApiResponse<T> {
  count?: number;
}

// Types pour les RPC calls
export interface RPCRequest extends Omit<ApiRequest, 'url'> {
  function: string;
  args?: Record<string, any>;
}

// Configuration par défaut
export const DEFAULT_API_CONFIG: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  timeout: 10000, // 10 secondes
  retryAttempts: 3,
  retryDelay: 1000, // 1 seconde
  enableCache: true,
  enableMetrics: __DEV__,
  interceptors: [],
};

// Types pour les événements API
export interface ApiEvent {
  type: 'request' | 'response' | 'error' | 'cache_hit' | 'cache_miss';
  url: string;
  method: string;
  timestamp: number;
  responseTime?: number;
  status?: number;
  cached?: boolean;
}

export type ApiEventListener = (event: ApiEvent) => void;
