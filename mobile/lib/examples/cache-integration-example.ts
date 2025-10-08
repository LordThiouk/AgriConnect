/**
 * Exemple d'intégration du système de cache AgriConnect
 * Montre comment remplacer les appels directs par le système de cache
 */

import { agriConnectApi, agriConnectCache, CacheKeys } from '../services/core';
import { usePlotsCache, usePlotCache, useCropsCache, useOperationsCache } from '../hooks/useCache';

// ============================================================================
// EXEMPLE 1: Remplacement d'un service existant par le cache
// ============================================================================

// AVANT: Appel direct sans cache (comme dans collecte.ts)
export class OldCollecteService {
  static async getPlots(agentId: string) {
    console.log('🌾 Récupération de toutes les parcelles pour l\'agent:', agentId);
    
    // Appel direct à Supabase (sans cache)
    const { data, error } = await this.supabase
      .from('plots')
      .select('*')
      .eq('agent_id', agentId);
    
    if (error) throw error;
    return data;
  }
}

// APRÈS: Service avec cache intelligent
export class NewPlotsService {
  static async getPlots(agentId: string, useCache = true) {
    if (useCache) {
      // Utiliser le cache avec l'API client
      const response = await agriConnectApi.getPlots(agentId);
      return response.data;
    }
    
    // Fallback vers l'ancienne méthode si nécessaire
    console.log('🌾 Récupération de toutes les parcelles pour l\'agent:', agentId);
    // ... ancien code ...
  }
}

// ============================================================================
// EXEMPLE 2: Utilisation des hooks dans les composants
// ============================================================================

// AVANT: État manuel avec useEffect
export function OldPlotsComponent({ agentId }: { agentId: string }) {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlots = async () => {
      try {
        setLoading(true);
        const data = await CollecteService.getPlots(agentId);
        setPlots(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPlots();
  }, [agentId]);

  // ... rendu ...
}

// APRÈS: Hook avec cache automatique
export function NewPlotsComponent({ agentId }: { agentId: string }) {
  const { 
    data: plots, 
    loading, 
    error, 
    refetch 
  } = usePlotsCache(agentId, {
    refetchOnMount: true,
    onError: (error) => console.error('Erreur parcelles:', error),
    onSuccess: (data) => console.log(`${data.length} parcelles chargées`),
  });

  // ... rendu identique ...
}

// ============================================================================
// EXEMPLE 3: Optimisation des requêtes répétitives
// ============================================================================

// PROBLÈME: Requêtes répétitives visibles dans les logs
// - Cultures chargées plusieurs fois (lignes 987-990)
// - Médias dupliqués (lignes 991-1022)
// - Opérations répétées (lignes 995, 999)

// SOLUTION: Cache intelligent avec invalidation
export class OptimizedPlotDetailService {
  static async loadPlotData(plotId: string) {
    // Charger toutes les données en parallèle avec cache
    const [plot, crops, operations, observations, media] = await Promise.all([
      agriConnectApi.getPlot(plotId),           // Cache: 5 minutes
      agriConnectApi.getCrops(plotId),          // Cache: 5 minutes
      agriConnectApi.getOperations(plotId),     // Cache: 1 minute
      agriConnectApi.getObservations(plotId),   // Cache: 1 minute
      agriConnectApi.getMedia('plot', plotId),  // Cache: 15 minutes
    ]);

    return {
      plot: plot.data,
      crops: crops.data,
      operations: operations.data,
      observations: observations.data,
      media: media.data,
    };
  }

  // Invalider le cache après modification
  static async updatePlot(plotId: string, updates: any) {
    // Mettre à jour en base
    await agriConnectApi.supabaseRequest({
      table: 'plots',
      action: 'update',
      filter: { id: plotId },
      body: updates,
    });

    // Invalider le cache de cette parcelle
    await agriConnectCache.invalidate({ 
      pattern: `plot:${plotId}*` 
    });

    // Invalider aussi les listes d'agents qui pourraient contenir cette parcelle
    await agriConnectCache.invalidate({ 
      pattern: 'plots:agent:*' 
    });
  }
}

// ============================================================================
// EXEMPLE 4: Gestion des erreurs et retry
// ============================================================================

export class RobustApiService {
  static async getDashboardData(agentId: string) {
    try {
      // Premier essai avec cache
      const response = await agriConnectApi.getDashboard(agentId);
      return response.data;
    } catch (error) {
      console.warn('Erreur API, fallback vers cache local:', error);
      
      // Fallback: essayer de récupérer depuis le cache même expiré
      const cachedData = await agriConnectCache.get(`dashboard:agent:${agentId}`);
      if (cachedData) {
        console.log('✅ Données récupérées depuis le cache local');
        return cachedData;
      }
      
      throw error;
    }
  }
}

// ============================================================================
// EXEMPLE 5: Métriques et monitoring
// ============================================================================

export class CacheMonitoringService {
  static logPerformance() {
    const metrics = agriConnectCache.getMetrics();
    const apiMetrics = agriConnectApi.getMetrics();
    
    console.log('📊 [CACHE] Métriques:', {
      hitRate: `${metrics.hitRate.toFixed(1)}%`,
      totalRequests: metrics.hits + metrics.misses,
      memoryEntries: agriConnectCache.getStats().memoryKeys,
    });
    
    console.log('📊 [API] Métriques:', {
      totalRequests: apiMetrics.totalRequests,
      cachedResponses: apiMetrics.cachedResponses,
      errorRate: `${apiMetrics.errorRate.toFixed(1)}%`,
      avgResponseTime: `${apiMetrics.averageResponseTime.toFixed(0)}ms`,
    });
  }

  static async cleanupOldData() {
    // Nettoyer les données de plus de 24h
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    await agriConnectCache.invalidate({ before: oneDayAgo });
    console.log('🧹 [CACHE] Données anciennes nettoyées');
  }
}

// ============================================================================
// EXEMPLE 6: Migration progressive
// ============================================================================

export class MigrationService {
  // Wrapper pour maintenir la compatibilité pendant la migration
  static async getPlots(agentId: string) {
    try {
      // Essayer le nouveau système avec cache
      const response = await agriConnectApi.getPlots(agentId);
      console.log('✅ [MIGRATION] Utilisation du nouveau système de cache');
      return response.data;
    } catch (error) {
      // Fallback vers l'ancien système
      console.warn('⚠️ [MIGRATION] Fallback vers l\'ancien système:', error);
      return await OldCollecteService.getPlots(agentId);
    }
  }

  // Invalider le cache après les opérations de modification
  static async addPlot(plotData: any) {
    const result = await OldCollecteService.addPlot(plotData);
    
    // Invalider le cache pour forcer le rechargement
    await agriConnectCache.invalidate({ 
      pattern: `plots:agent:${plotData.agent_id}` 
    });
    
    return result;
  }
}

// ============================================================================
// EXEMPLE 7: Configuration avancée
// ============================================================================

export class CacheConfigurationService {
  static setupProductionCache() {
    // Configuration pour la production
    agriConnectCache.initialize();
    
    // Ajouter des listeners pour le monitoring
    agriConnectCache.addEventListener((event) => {
      if (event.type === 'miss' && event.responseTime > 1000) {
        console.warn(`⚠️ [CACHE] Cache miss lent: ${event.key} (${event.responseTime}ms)`);
      }
    });

    // Configuration des interceptors
    agriConnectApi.addInterceptor({
      response: (response) => {
        if (response.cached) {
          console.log(`⚡ [CACHE] Hit pour ${response.data?.length || 1} éléments`);
        }
        return response;
      },
    });
  }
}

// ============================================================================
// EXEMPLE 8: Tests d'intégration
// ============================================================================

export class CacheIntegrationTests {
  static async testCacheIntegration() {
    console.log('🧪 [TEST] Test d\'intégration du cache');
    
    const agentId = 'test-agent-123';
    
    // Test 1: Premier appel (cache miss)
    const start1 = Date.now();
    await agriConnectApi.getPlots(agentId);
    const time1 = Date.now() - start1;
    
    // Test 2: Deuxième appel (cache hit)
    const start2 = Date.now();
    await agriConnectApi.getPlots(agentId);
    const time2 = Date.now() - start2;
    
    console.log(`📊 [TEST] Premier appel: ${time1}ms`);
    console.log(`📊 [TEST] Deuxième appel: ${time2}ms`);
    console.log(`📊 [TEST] Amélioration: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    
    // Test 3: Invalidation
    await agriConnectCache.invalidate({ pattern: `plots:agent:${agentId}` });
    console.log('✅ [TEST] Cache invalidé avec succès');
    
    return {
      firstCall: time1,
      secondCall: time2,
      improvement: ((time1 - time2) / time1 * 100),
    };
  }
}
