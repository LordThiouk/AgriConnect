/**
 * Export de tous les hooks AgriConnect
 * Hooks pour la gestion des données avec cache intelligent
 */

// Hooks existants (déjà conformes)
export * from './useCache';
export * from './useProducers';
export * from './usePlots';
export * from './useAlerts';
export * from './useSeasons';
export * from './useRecommendations';

// Hooks pour les nouveaux services domain
export * from './useFarmFiles';
export * from './useObservations';
export * from './useOperations';
export * from './useInputs';
export * from './useParticipants';
export * from './useVisits';
export * from './useAgentVisits';
export * from './useAgentAssignments';

// Hooks pour les services existants (si nécessaire)
export * from './useCrops';
// export * from './useIntervenants';
// export * from './useNotifications';