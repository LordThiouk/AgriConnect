/**
 * Interceptors par défaut pour l'API Client AgriConnect
 * Gestion d'erreurs, authentification, et logging
 */

import { ApiInterceptor, ApiRequest, ApiResponse, ApiError } from '../lib/types/core';

/**
 * Interceptor pour la gestion des erreurs Supabase
 */
export const supabaseErrorInterceptor: ApiInterceptor = {
  error: (error: ApiError): ApiError => {
    // Gestion spécifique des erreurs Supabase
    if (error.code === 'PGRST116') {
      return {
        ...error,
        message: 'Aucun résultat trouvé',
        code: 'NOT_FOUND',
      };
    }
    
    if (error.code === 'PGRST202') {
      return {
        ...error,
        message: 'Fonction RPC non trouvée',
        code: 'RPC_NOT_FOUND',
      };
    }

    if (error.code === '42P01') {
      return {
        ...error,
        message: 'Table ou vue non trouvée',
        code: 'TABLE_NOT_FOUND',
      };
    }

    if (error.code === '23503') {
      return {
        ...error,
        message: 'Violation de contrainte de clé étrangère',
        code: 'FOREIGN_KEY_VIOLATION',
      };
    }

    // Gestion des erreurs de réseau
    if (error.message.includes('Network request failed')) {
      return {
        ...error,
        message: 'Erreur de connexion réseau',
        code: 'NETWORK_ERROR',
      };
    }

    // Gestion des timeouts
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return {
        ...error,
        message: 'Délai d\'attente dépassé',
        code: 'TIMEOUT',
      };
    }

    return error;
  },
};

/**
 * Interceptor pour l'authentification
 */
export const authInterceptor: ApiInterceptor = {
  request: async (request: ApiRequest): Promise<ApiRequest> => {
    // Vérifier si l'utilisateur est authentifié
    // Cette logique sera implémentée avec le contexte d'authentification
    
    // Ajouter les headers d'authentification si nécessaire
    const headers = {
      ...request.headers,
      'Content-Type': 'application/json',
    };

    return {
      ...request,
      headers,
    };
  },

  error: (error: ApiError): ApiError => {
    // Gestion des erreurs d'authentification
    if (error.status === 401) {
      return {
        ...error,
        message: 'Session expirée. Veuillez vous reconnecter.',
        code: 'AUTH_EXPIRED',
      };
    }

    if (error.status === 403) {
      return {
        ...error,
        message: 'Accès non autorisé',
        code: 'FORBIDDEN',
      };
    }

    return error;
  },
};

/**
 * Interceptor pour le logging des performances
 */
export const performanceInterceptor: ApiInterceptor = {
  request: (request: ApiRequest): ApiRequest => {
    // Marquer le début de la requête pour le calcul du temps de réponse
    return {
      ...request,
      _startTime: Date.now(),
    } as any;
  },

  response: <T>(response: ApiResponse<T>): ApiResponse<T> => {
    // Log des performances si en mode debug
    if (__DEV__) {
      const responseTime = response.responseTime;
      const status = response.status;
      
      if (responseTime > 1000) {
        console.warn(`⚠️ [API] Requête lente détectée: ${responseTime}ms`);
      }
      
      if (status >= 400) {
        console.error(`❌ [API] Erreur ${status}: ${responseTime}ms`);
      } else {
        console.log(`✅ [API] Succès ${status}: ${responseTime}ms`);
      }
    }

    return response;
  },

  error: (error: ApiError): ApiError => {
    // Log des erreurs
    if (__DEV__) {
      console.error(`❌ [API] Erreur:`, {
        code: error.code,
        message: error.message,
        status: error.status,
        timestamp: error.timestamp,
      });
    }

    return error;
  },
};

/**
 * Interceptor pour la validation des réponses
 */
export const validationInterceptor: ApiInterceptor = {
  response: <T>(response: ApiResponse<T>): ApiResponse<T> => {
    // Validation basique des réponses
    if (response.status >= 400) {
      console.warn(`⚠️ [API] Réponse avec erreur: ${response.status}`);
    }

    // Vérifier la structure des données
    if (response.data && typeof response.data === 'object') {
      // Validation basique - peut être étendue avec Zod
      if (Array.isArray(response.data)) {
        console.log(`📊 [API] Réponse avec ${response.data.length} éléments`);
      }
    }

    return response;
  },
};

/**
 * Interceptor pour la gestion du cache
 */
export const cacheInterceptor: ApiInterceptor = {
  request: (request: ApiRequest): ApiRequest => {
    // Définir le cache par défaut selon le type de requête
    if (request.cache === undefined) {
      if (request.method === 'GET' || request.url.includes('rpc:')) {
        request.cache = 'medium'; // 5 minutes par défaut
      } else {
        request.cache = false; // Pas de cache pour POST/PUT/DELETE
      }
    }

    return request;
  },

  response: <T>(response: ApiResponse<T>): ApiResponse<T> => {
    // Invalider le cache si nécessaire après certaines opérations
    if (response.status >= 200 && response.status < 300) {
      // Les opérations de modification peuvent nécessiter l'invalidation
      // Cette logique sera implémentée selon les besoins spécifiques
    }

    return response;
  },
};

/**
 * Interceptor pour la gestion offline
 */
export const offlineInterceptor: ApiInterceptor = {
  request: (request: ApiRequest): ApiRequest => {
    // Vérifier la connectivité réseau
    // Cette logique sera implémentée avec NetInfo
    
    return request;
  },

  error: (error: ApiError): ApiError => {
    // Gestion des erreurs offline
    if (error.message.includes('Network request failed') || 
        error.message.includes('No internet connection')) {
      return {
        ...error,
        message: 'Pas de connexion internet. Les données seront synchronisées quand la connexion sera rétablie.',
        code: 'OFFLINE',
      };
    }

    return error;
  },
};

/**
 * Configuration des interceptors par défaut
 */
export const defaultInterceptors: ApiInterceptor[] = [
  authInterceptor,
  supabaseErrorInterceptor,
  cacheInterceptor,
  performanceInterceptor,
  validationInterceptor,
  offlineInterceptor,
];

/**
 * Fonction utilitaire pour créer un interceptor personnalisé
 */
export const createInterceptor = (config: Partial<ApiInterceptor>): ApiInterceptor => {
  return {
    request: config.request,
    response: config.response,
    error: config.error,
  };
};
