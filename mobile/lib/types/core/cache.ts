/**
 * Types pour le système de cache intelligent AgriConnect
 * Résout les requêtes répétitives visibles dans les logs
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live en millisecondes
  key: string;
  tags?: string[]; // Tags pour invalidation par pattern
  size?: number; // Taille approximative en bytes
}

export interface CacheConfig {
  defaultTTL: number; // TTL par défaut en ms (5 minutes)
  maxMemoryEntries: number; // Nombre max d'entrées en mémoire
  maxStorageSize: number; // Taille max du cache AsyncStorage en MB
  enableMetrics: boolean; // Activer les métriques de performance
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memorySize: number; // Taille du cache mémoire en bytes
  storageSize: number; // Taille du cache AsyncStorage en bytes
  hitRate: number; // Pourcentage de hits
  averageResponseTime: number; // Temps moyen de réponse en ms
}

export interface CacheInvalidationOptions {
  pattern?: string; // Pattern pour invalidation (ex: "plots:agent:*")
  tags?: string[]; // Tags pour invalidation
  before?: number; // Invalider les entrées avant cette date
  force?: boolean; // Forcer l'invalidation même si pas expiré
}

export type CacheKey = string;

export type CacheTTL = 
  | number // TTL fixe en ms
  | 'short' // 1 minute
  | 'medium' // 5 minutes  
  | 'long' // 15 minutes
  | 'very-long'; // 1 heure

export interface CacheStats {
  totalKeys: number;
  expiredKeys: number;
  memoryKeys: number;
  storageKeys: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

// Types pour les patterns de cache spécifiques à AgriConnect
export type CachePattern = 
  | `plots:agent:${string}` // Parcelles d'un agent
  | `plots:agent:${string}:*` // Toutes les parcelles d'un agent
  | `crops:plot:${string}` // Cultures d'une parcelle
  | `operations:plot:${string}` // Opérations d'une parcelle
  | `observations:plot:${string}` // Observations d'une parcelle
  | `media:${string}:${string}` // Médias d'une entité
  | `visits:agent:${string}` // Visites d'un agent
  | `dashboard:agent:${string}` // Dashboard d'un agent
  | `producers:agent:${string}` // Producteurs d'un agent
  | `intrants:plot:${string}`; // Intrants d'une parcelle

// Configuration par défaut
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxMemoryEntries: 100,
  maxStorageSize: 50, // 50 MB
  enableMetrics: __DEV__, // Métriques en dev seulement
};

// Mapping des TTL prédéfinis
export const TTL_MAPPING: Record<CacheTTL, number> = {
  'short': 1 * 60 * 1000, // 1 minute
  'medium': 5 * 60 * 1000, // 5 minutes
  'long': 15 * 60 * 1000, // 15 minutes
  'very-long': 60 * 60 * 1000, // 1 heure
};

// Types pour les événements de cache
export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'expire' | 'invalidate';
  key: string;
  timestamp: number;
  responseTime?: number;
  size?: number;
}

export type CacheEventListener = (event: CacheEvent) => void;
