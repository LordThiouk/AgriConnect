/**
 * API Client centralisé AgriConnect
 * Gestion des requêtes avec interceptors, cache automatique et retry logic
 */

import { createClient } from '@supabase/supabase-js';
import { agriConnectCache } from './cache';
import { 
  ApiRequest, 
  ApiResponse, 
  ApiError, 
  ApiInterceptor, 
  ApiConfig, 
  ApiMetrics,
  SupabaseRequest,
  SupabaseResponse,
  RPCRequest,
  DEFAULT_API_CONFIG,
  ApiEvent,
  ApiEventListener
} from '../../types/core';

class AgriConnectApiClient {
  private supabase: any;
  private config: ApiConfig;
  private metrics: ApiMetrics;
  private listeners: ApiEventListener[] = [];
  private retryQueue: Map<string, number> = new Map();

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_API_CONFIG, ...config };
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      averageResponseTime: 0,
      requestsByEndpoint: {},
      errorRate: 0,
    };

    // Initialiser Supabase
    this.supabase = createClient(
      this.config.baseURL,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Initialiser le cache
    agriConnectCache.initialize();
  }

  /**
   * Effectue une requête avec gestion du cache et retry
   */
  async request<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    // const requestId = `${request.method}:${request.url}:${Date.now()}`;
    
    try {
      // Appliquer les interceptors de requête
      let processedRequest = request;
      for (const interceptor of this.config.interceptors) {
        if (interceptor.request) {
          processedRequest = await interceptor.request(processedRequest);
        }
      }

      // Vérifier le cache si activé
      if (processedRequest.cache) {
        const cacheKey = this.generateCacheKey(processedRequest);
        const cachedData = await agriConnectCache.get<T>(cacheKey);
        
        if (cachedData) {
          this.metrics.cachedResponses++;
          this.metrics.requestsByEndpoint[request.url] = (this.metrics.requestsByEndpoint[request.url] || 0) + 1;
          
          const response: ApiResponse<T> = {
            data: cachedData,
            status: 200,
            headers: {},
            cached: true,
            responseTime: Date.now() - startTime,
            timestamp: Date.now(),
          };

          this.emitEvent('cache_hit', request.url, request.method, Date.now() - startTime);
          return response;
        }
      }

      // Effectuer la requête
      const response = await this.executeRequest<T>(processedRequest);
      
      // Mettre en cache si activé
      if (processedRequest.cache && response.status < 400) {
        const cacheKey = this.generateCacheKey(processedRequest);
        const ttl = typeof processedRequest.cache === 'boolean' ? 'medium' : processedRequest.cache;
        await agriConnectCache.set(cacheKey, response.data, ttl);
      }

      // Appliquer les interceptors de réponse
      let processedResponse = response;
      for (const interceptor of this.config.interceptors) {
        if (interceptor.response) {
          processedResponse = await interceptor.response(processedResponse);
        }
      }

      // Mettre à jour les métriques
      this.updateMetrics(request.url, response.status, Date.now() - startTime);
      
      this.emitEvent('response', request.url, request.method, Date.now() - startTime, response.status);
      
      return processedResponse;

    } catch (error) {
      const apiError = this.handleError(error, request);
      
      // Retry automatique si activé
      if (request.retry !== false && this.shouldRetry(apiError)) {
        return this.retryRequest(request, apiError);
      }

      // Appliquer les interceptors d'erreur
      let processedError = apiError;
      for (const interceptor of this.config.interceptors) {
        if (interceptor.error) {
          processedError = await interceptor.error(processedError);
        }
      }

      this.metrics.failedRequests++;
      this.updateErrorRate();
      
      this.emitEvent('error', request.url, request.method, Date.now() - startTime);
      
      throw processedError;
    }
  }

  /**
   * Requête Supabase spécifique
   */
  async supabaseRequest<T>(request: SupabaseRequest): Promise<SupabaseResponse<T>> {
    const apiRequest: ApiRequest = {
      url: `supabase:${request.table}:${request.action}`,
      method: this.getSupabaseMethod(request.action),
      body: request.filter,
      params: {
        columns: request.columns,
        order: request.order,
        limit: request.limit,
        offset: request.offset,
      },
      cache: true,
    };

    const response = await this.request<T>(apiRequest);
    
    return {
      ...response,
      count: (response.data as any)?.length || 0,
    };
  }

  /**
   * Appel RPC Supabase
   */
  async rpc<T>(request: RPCRequest): Promise<ApiResponse<T>> {
    const apiRequest: ApiRequest = {
      url: `rpc:${request.function}`,
      method: 'POST',
      body: request.args,
      cache: true,
    };

    return this.request<T>(apiRequest);
  }

  /**
   * Ajoute un interceptor
   */
  addInterceptor(interceptor: ApiInterceptor): void {
    this.config.interceptors.push(interceptor);
  }

  /**
   * Supprime un interceptor
   */
  removeInterceptor(interceptor: ApiInterceptor): void {
    const index = this.config.interceptors.indexOf(interceptor);
    if (index > -1) {
      this.config.interceptors.splice(index, 1);
    }
  }

  /**
   * Récupère les métriques
   */
  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  /**
   * Ajoute un listener pour les événements
   */
  addEventListener(listener: ApiEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Supprime un listener
   */
  removeEventListener(listener: ApiEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Invalide le cache pour un pattern donné
   */
  async invalidateCache(pattern: string): Promise<number> {
    return agriConnectCache.invalidate({ pattern });
  }

  // Méthodes privées

  private async executeRequest<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    this.metrics.totalRequests++;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeout || this.config.timeout);

    try {
      let response: any;
      
      if (request.url.startsWith('supabase:')) {
        response = await this.executeSupabaseRequest(request);
      } else if (request.url.startsWith('rpc:')) {
        response = await this.executeRPCRequest(request);
      } else {
        // Requête HTTP standard (si nécessaire)
        response = await this.executeHttpRequest(request, controller.signal);
      }

      clearTimeout(timeoutId);
      
      return {
        data: response,
        status: 200,
        headers: {},
        cached: false,
        responseTime: 0, // Sera calculé par l'appelant
        timestamp: Date.now(),
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async executeSupabaseRequest(request: ApiRequest): Promise<any> {
    const [, table, action] = request.url.split(':');
    
    switch (action) {
      case 'select':
        return this.supabase.from(table).select(request.params?.columns);
      
      case 'insert':
        return this.supabase.from(table).insert(request.body);
      
      case 'update':
        return this.supabase.from(table).update(request.body);
      
      case 'delete':
        return this.supabase.from(table).delete();
      
      default:
        throw new Error(`Action Supabase non supportée: ${action}`);
    }
  }

  private async executeRPCRequest(request: ApiRequest): Promise<any> {
    const [, functionName] = request.url.split(':');
    return this.supabase.rpc(functionName, request.body);
  }

  private async executeHttpRequest(request: ApiRequest, signal: AbortSignal): Promise<any> {
    // Implémentation pour les requêtes HTTP standard si nécessaire
    throw new Error('Requêtes HTTP standard non implémentées');
  }

  private getSupabaseMethod(action: string): 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' {
    switch (action) {
      case 'select': return 'GET';
      case 'insert': return 'POST';
      case 'update': return 'PUT';
      case 'delete': return 'DELETE';
      case 'upsert': return 'POST';
      default: return 'GET';
    }
  }

  private generateCacheKey(request: ApiRequest): string {
    const url = request.url;
    const params = request.params ? JSON.stringify(request.params) : '';
    const body = request.body ? JSON.stringify(request.body) : '';
    return `${url}:${params}:${body}`;
  }

  private handleError(error: any, request: ApiRequest): ApiError {
    return {
      message: error.message || 'Erreur inconnue',
      code: error.code || 'UNKNOWN_ERROR',
      status: error.status || 500,
      data: error.data,
      originalError: error,
      timestamp: Date.now(),
    };
  }

  private shouldRetry(error: ApiError): boolean {
    return (
      (error.status && error.status >= 500) || // Erreurs serveur
      error.status === 408 || // Timeout
      error.status === 429    // Rate limit
    );
  }

  private async retryRequest<T>(request: ApiRequest, error: ApiError): Promise<ApiResponse<T>> {
    const retryCount = this.retryQueue.get(request.url) || 0;
    
    if (retryCount >= this.config.retryAttempts) {
      this.retryQueue.delete(request.url);
      throw error;
    }

    this.retryQueue.set(request.url, retryCount + 1);
    
    // Attendre avant de retry
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
    
    console.log(`🔄 [API] Retry ${retryCount + 1}/${this.config.retryAttempts} pour ${request.url}`);
    
    return this.request<T>(request);
  }

  private updateMetrics(url: string, status: number, responseTime: number): void {
    this.metrics.requestsByEndpoint[url] = (this.metrics.requestsByEndpoint[url] || 0) + 1;
    
    if (status < 400) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Mettre à jour le temps de réponse moyen
    const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
  }

  private updateErrorRate(): void {
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    this.metrics.errorRate = total > 0 ? (this.metrics.failedRequests / total) * 100 : 0;
  }

  private emitEvent(
    type: ApiEvent['type'], 
    url: string, 
    method: string, 
    responseTime?: number, 
    status?: number,
    cached?: boolean
  ): void {
    if (!this.config.enableMetrics) return;

    const event: ApiEvent = {
      type,
      url,
      method,
      timestamp: Date.now(),
      responseTime,
      status,
      cached,
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ [API] Erreur dans le listener:', error);
      }
    });
  }
}

// Instance singleton
export const agriConnectApi = new AgriConnectApiClient();

// Fonctions utilitaires pour les requêtes courantes
export const ApiRequests = {
  // Parcelles
  getPlots: (agentId: string) => agriConnectApi.rpc({ method: 'POST', function: 'get_agent_plots_with_geolocation', args: { agent_id_param: agentId } }),
  getPlot: (plotId: string) => agriConnectApi.rpc({ method: 'POST', function: 'get_plot_by_id', args: { plot_id_param: plotId } }),
  
  // Cultures
  getCrops: (plotId: string) => agriConnectApi.rpc({ method: 'POST', function: 'get_crops_by_plot_id', args: { plot_id_param: plotId } }),
  
  // Opérations
  getOperations: (plotId: string) => agriConnectApi.rpc({ method: 'POST', function: 'get_latest_operations', args: { plot_id_param: plotId } }),
  
  // Observations
  getObservations: (plotId: string) => agriConnectApi.rpc({ method: 'POST', function: 'get_observations_for_plot', args: { plot_id_param: plotId } }),
  
  // Médias
  getMedia: (entityType: string, entityId: string) => 
    agriConnectApi.rpc({ 
      method: 'POST',
      function: 'get_media_by_entity', 
      args: { p_entity_type: entityType, p_entity_id: entityId } 
    }),
  
  // Visites
  getVisits: (agentId: string, filter?: string) => 
    agriConnectApi.rpc({ 
      method: 'POST',
      function: 'get_agent_all_visits_with_filters', 
      args: { p_agent_id: agentId, p_filter: filter || 'all' } 
    }),
  
  // Dashboard
  getDashboard: (agentId: string) => 
    agriConnectApi.rpc({ method: 'POST', function: 'get_agent_dashboard_data', args: { agent_id_param: agentId } }),
} as const;

export default AgriConnectApiClient;

// Instance par défaut
export const AgriConnectApiClientInstance = new AgriConnectApiClient();
