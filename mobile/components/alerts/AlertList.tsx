/**
 * AlertList - Composant moderne pour afficher la liste des alertes
 */

import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { 
  VStack, 
  HStack, 
  Text, 
  IconButton,
  Spinner,
  Box,
  useTheme
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { AlertCard } from './AlertCard';
import { AlertFilterModal } from './AlertFilterModal';
import { useAgentAlerts } from '../../lib/hooks/useAlerts';
import { AlertFilters as AlertFiltersType } from '../../lib/services/domain/alerts/alerts.types';

interface AlertListProps {
  agentId: string;
  onAlertPress: (alert: any) => void;
  onAlertResolve: (alertId: string) => void;
  onAlertCreateVisit: (alert: any) => void;
  loading?: boolean;
  maxHeight?: number;
  alerts?: any[]; // Alertes passées en props
  alertsLoading?: boolean; // État de chargement passé en props
  alertsError?: Error | null; // Erreur passée en props
  onRefresh?: () => void; // Fonction de refresh passée en props
  showFilters?: boolean; // Afficher les filtres
}

export const AlertList: React.FC<AlertListProps> = ({
  agentId,
  onAlertPress,
  onAlertResolve,
  onAlertCreateVisit,
  loading = false,
  maxHeight = 400,
  alerts: propsAlerts,
  alertsLoading: propsAlertsLoading,
  alertsError: propsAlertsError,
  onRefresh: propsOnRefresh,
  showFilters = true
}) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<AlertFiltersType>({});
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fonction pour appliquer les filtres côté client
  const applyClientFilters = (alerts: any[], filters: AlertFiltersType) => {
    return alerts.filter(alert => {
      // Filtre par sévérité
      if (filters.severity !== undefined) {
        if (filters.severity === 4 && alert.severity < 4) return false;
        if (filters.severity === 3 && alert.severity !== 3) return false;
        if (filters.severity === 1 && alert.severity > 2) return false;
      }

      // Filtre par type d'alerte
      if (filters.alert_type && alert.alert_type !== filters.alert_type) {
        return false;
      }

      // Filtre par statut de résolution
      if (filters.is_resolved !== undefined && alert.is_resolved !== filters.is_resolved) {
        return false;
      }

      // Filtre par période (jours)
      if (filters.days) {
        const alertDate = new Date(alert.created_at);
        const now = new Date();
        
        if (filters.days === 1) {
          // Filtre "Aujourd'hui" - vérifier si l'alerte a été créée aujourd'hui
          const isToday = alertDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else {
          // Autres filtres de période (7 jours, 30 jours, etc.)
          const daysDiff = (now.getTime() - alertDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff > filters.days) return false;
        }
      }

      return true;
    });
  };

  // Utiliser les props si disponibles, sinon utiliser le hook
  const { data: hookAlerts, loading: hookAlertsLoading, error: hookAlertsError, refetch: hookRefetch } = useAgentAlerts(
    agentId, 
    filters, // Utiliser les filtres
    { enabled: !!agentId && !propsAlerts } // Désactiver le hook si on a des props
  );

  // Utiliser les props en priorité, sinon le hook
  const allAlerts = propsAlerts || hookAlerts || [];
  const alertsLoading = propsAlertsLoading !== undefined ? propsAlertsLoading : hookAlertsLoading;
  const alertsError = propsAlertsError !== undefined ? propsAlertsError : hookAlertsError;
  const refetch = propsOnRefresh || hookRefetch;

  // Appliquer les filtres côté client si on utilise les props
  const alerts = propsAlerts ? applyClientFilters(allAlerts, filters) : allAlerts;

  // Debug logs
  console.log('🔍 [AlertList] État des alertes:', {
    agentId,
    alerts: alerts?.length || 0,
    alertsLoading,
    alertsError: alertsError?.message,
    enabled: !!agentId
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAlertResolve = async (alertId: string) => {
    console.log('🔧 [AlertList] handleAlertResolve appelé avec ID:', alertId);
    console.log('🔧 [AlertList] onAlertResolve function:', typeof onAlertResolve);
    try {
      console.log('🔧 [AlertList] Appel de onAlertResolve...');
      await onAlertResolve(alertId);
      console.log('✅ [AlertList] onAlertResolve terminé avec succès');
      // Rafraîchir la liste après résolution
      console.log('🔄 [AlertList] Rafraîchissement de la liste...');
      await refetch();
      console.log('✅ [AlertList] Liste rafraîchie');
    } catch (error) {
      console.error('❌ [AlertList] Erreur lors de la résolution de l\'alerte:', error);
    }
  };

  const handleAlertCreateVisit = (alert: any) => {
    onAlertCreateVisit(alert);
  };

  const handleFiltersChange = (newFilters: AlertFiltersType) => {
    setFilters(newFilters);
  };


  if (alertsLoading && !alerts) {
    return (
      <VStack alignItems="center" justifyContent="center" p={8}>
        <Spinner size="lg" color="primary.500" />
        <Text color="gray.600" mt={2}>Chargement des alertes...</Text>
      </VStack>
    );
  }

  if (alertsError) {
    return (
      <VStack alignItems="center" justifyContent="center" p={8}>
        <Ionicons name="alert-circle" size={48} color="error.500" />
        <Text fontSize="md" fontWeight="semibold" color="error.600" mt={3} textAlign="center">
          Erreur de chargement
        </Text>
        <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
          Impossible de charger les alertes
        </Text>
        <IconButton
          icon={<Ionicons name="refresh" size={20} color="primary.500" />}
          onPress={handleRefresh}
          mt={4}
        />
      </VStack>
    );
  }

  const alertsList = alerts || [];

  return (
    <VStack space={4}>
      {/* Header avec titre et actions - Style comme VisitList */}
      <HStack justifyContent="space-between" alignItems="center">
        <VStack space={1}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Alertes terrain
          </Text>
          <HStack alignItems="center" space={2}>
            <Box
              w={6}
              h={6}
              borderRadius="full"
              bg="error.100"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="warning" size={14} color="error.600" />
            </Box>
            <Text fontSize="sm" color="gray.600">
              {alertsList.length} {alertsList.length === 1 ? 'alerte critique' : 'alertes critiques'}
            </Text>
          </HStack>
        </VStack>

        <HStack space={2}>
          {/* Bouton de filtre */}
          {showFilters && (
            <IconButton
              icon={<Ionicons name="filter" size={20} color={theme.colors.primary?.[500]} />}
              onPress={() => setShowFilterModal(true)}
              variant="outline"
              borderColor="primary.300"
              _pressed={{ bg: 'primary.50' }}
            />
          )}
          
          {/* Bouton de refresh */}
          <IconButton
            icon={<Ionicons name="refresh" size={20} color={theme.colors.primary?.[500]} />}
            onPress={handleRefresh}
            variant="outline"
            borderColor="primary.300"
            _pressed={{ bg: 'primary.50' }}
            disabled={refreshing}
          />
        </HStack>
      </HStack>

      {/* Modal de filtres - Style comme VisitList */}
      {showFilters && (
        <AlertFilterModal
          visible={showFilterModal}
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {/* Liste des alertes */}
      {alertsList.length === 0 ? (
        <VStack alignItems="center" p={8} bg="gray.50" borderRadius="lg">
          <Ionicons name="checkmark-circle-outline" size={48} color="success.500" />
          <Text fontSize="md" fontWeight="semibold" color="gray.600" mt={3} textAlign="center">
            Aucune alerte
          </Text>
          <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
            Toutes les parcelles sont en bon état
          </Text>
        </VStack>
      ) : (
        <Box maxHeight={maxHeight}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3D944B']}
                tintColor="#3D944B"
              />
            }
          >
            <VStack space={3}>
              {alertsList.map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onPress={() => onAlertPress(alert)}
                  onResolve={() => handleAlertResolve(alert.id)}
                  onCreateVisit={() => handleAlertCreateVisit(alert)}
                  loading={loading}
                />
              ))}
            </VStack>
          </ScrollView>
        </Box>
      )}
    </VStack>
  );
};
