/**
 * Tableau de bord Agent - AgriConnect
 * Interface principale pour les agents de terrain
 */

import React, { useState } from 'react';
import { Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import {
  useProducerStats,
  usePlotStats,
  useFarmFiles,
  useAgentVisits,
  useAgentAlerts, // Utilise le hook pour les alertes
  // useAlertStats, // Utilise le hook pour les stats d'alertes
  // useAgentAssignments, // Commenté - utilise producerStats
} from '../../lib/hooks';
import { VisitsServiceInstance as VisitsService } from '../../lib/services/domain/visits';
import { AlertsServiceInstance as AlertsService, AlertsServiceInstance } from '../../lib/services/domain/alerts';
import { 
  ScreenContainer, 
  VStack, 
  HStack, 
  Box, 
  Text, 
  Button, 
  Pressable, 
  Spinner
} from '../../components/ui';
import { Card } from '../../components/ui/Card';
import { VisitList, VisitDetailModal } from '../../components/visits';
import { AlertList, AlertDetailModal } from '../../components/alerts';
// import { LinearGradient } from 'expo-linear-gradient';

export default function AgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { refresh: refreshParam } = useLocalSearchParams<{ refresh?: string }>();
  const agentId = user?.id || null;
  const enabled = Boolean(agentId && isFocused);

  // --- Gestion de l'état local ---
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<any>(null);
  const [visitDetailModalVisible, setVisitDetailModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  // Ancien filtre (supprimé, géré désormais par VisitList)

  // --- Récupération des données avec les nouveaux hooks ---

  const { data: producerStats, loading: loadingProducers, error: errorProducers, refetch: refetchProducers } = useProducerStats(agentId || '', { enabled });
  const { data: plotStats, loading: loadingPlots, error: errorPlots, refetch: refetchPlots } = usePlotStats(agentId, { enabled });
  const { data: farmFilesData, loading: loadingFarmFiles, error: errorFarmFiles, refetch: refetchFarmFiles } = useFarmFiles(agentId || '');
  const { data: visitsData, loading: loadingVisits, error: errorVisits, refetch: refetchVisits } = useAgentVisits(agentId, undefined as any, { enabled });
  const { data: alertsData, loading: loadingAlerts, error: errorAlerts, refetch: refetchAlerts } = useAgentAlerts(agentId, undefined, { enabled, force: false });
  // const { assignments, loading: loadingAssignments, error: errorAssignments, refetch: refetchAssignments, producersCount } = useAgentAssignments({ agentId, enabled, refetchOnMount: true });

  const visits = visitsData || [];
  const alerts = alertsData || [];
  const farmFiles = farmFilesData || [];

  // Debug logs pour les visites
  console.log('🔍 [DASHBOARD] Debug visites:', {
    agentId,
    enabled,
    loadingVisits,
    errorVisits: errorVisits?.message,
    visitsData,
    visitsCount: visits.length,
    visits: visits.map(v => ({
      id: v.id,
      type: v.visit_type,
      status: v.status,
      date: v.visit_date,
      producer: v.producer_name,
      plot: v.plot_name
    }))
  });

  // Debug logs pour les alertes
  console.log('🔍 [DASHBOARD] Debug alertes:', {
    agentId,
    enabled,
    loadingAlerts,
    errorAlerts: errorAlerts?.message,
    alertsData,
    alertsCount: alerts.length,
    userInfo: {
      id: user?.id,
      email: user?.email,
      role: user?.user_metadata?.role
    }
  });




  // Debug logs pour les producteurs
  console.log('🔍 [DASHBOARD] Debug producteurs:', {
    agentId,
    enabled,
    producerStats,
    totalProducers: producerStats?.total || 0
  });
  
  // Test avec l'ID qui a des assignations
  if (agentId === 'b00a283f-0a46-41d2-af95-8a256c9c2771') {
    console.log('🧪 [DASHBOARD] Test avec ID sans assignations - affichage correct: 0');
  }

  // --- Fonction de rafraîchissement unifiée ---
  const refresh = React.useCallback(async () => {
    if (!enabled) return;
    console.log('🔄 Refreshing all dashboard data...');
    
    // Vider le cache des stats producteurs pour forcer le rechargement
    if (agentId) {
      const { ProducersServiceInstance } = await import('../../lib/services/domain/producers');
      await ProducersServiceInstance.clearStatsCache(agentId);
    }
    
    await Promise.all([
      refetchProducers(),
      refetchPlots(),
      refetchFarmFiles(),
      refetchVisits(),
      refetchAlerts(), // Utilise le hook useAgentAlerts
      // refetchAssignments(), // Commenté - utilise producerStats
    ]);
  }, [enabled, agentId, refetchProducers, refetchPlots, refetchFarmFiles, refetchVisits, refetchAlerts]);

  // Rafraîchir les données quand on revient du formulaire de visite
  useFocusEffect(
    React.useCallback(() => {
      if (refreshParam === 'true') {
        console.log('🔄 Rafraîchissement des données après modification de visite');
        refresh();
        // Nettoyer le paramètre refresh
        router.replace('/(tabs)/agent-dashboard');
      }
    }, [refreshParam, router, refresh])
  );
  
  const today = new Date().toLocaleDateString();
  const agentName = user?.user_metadata?.display_name || 'Agent terrain';
  const agentFirstName = (agentName || '').split(' ')[0] || agentName;

  // --- KPIs basés sur les vraies données des hooks ---
  const kpiStats = [
    { 
      title: 'Producteurs assignés', 
      value: (producerStats?.total || 0).toString(), 
      icon: 'people', 
      color: '#3D944B' 
    },
    { 
      title: 'Parcelles actives', 
      value: (plotStats?.active_plots ?? 0).toString(), 
      icon: 'map', 
      color: '#FFD65A' 
    },
  ];

  // Calcul du pourcentage de fiches complétées
  const completedFarmFiles = farmFiles.filter((file: any) => file.status === 'completed').length;
  const totalFarmFiles = farmFiles.length;
  const percent = totalFarmFiles > 0 ? Math.round((completedFarmFiles / totalFarmFiles) * 100) : 0;

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [DASHBOARD] Focus effect - Cache will handle data freshness.');
      if (enabled) {
        // Optionnel: déclenche un léger refresh quand on revient sur l'écran
        // void refresh();
      }
    }, [enabled])
  );

  // --- Fonctions CRUD (inchangées car elles utilisent déjà les services) ---


  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return;
    setActionLoading(visitToDelete.id);
    try {
      await VisitsService.deleteVisit(visitToDelete.id);
      setDeleteModalVisible(false);
      setVisitToDelete(null);
      await refresh();
      Alert.alert('Succès', 'Visite supprimée avec succès');
    } catch (err) {
      Alert.alert('Erreur', `Impossible de supprimer la visite: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const cancelDeleteVisit = () => {
    setDeleteModalVisible(false);
    setVisitToDelete(null);
  };
  


  // Nouveaux handlers pour VisitList et VisitDetailModal
  const handleVisitPress = (visit: any) => {
    setSelectedVisit(visit);
    setVisitDetailModalVisible(true);
  };

  const handleVisitEdit = (visit: any) => {
    console.log('🔍 [DASHBOARD] handleVisitEdit appelé avec visit:', {
      id: visit.id,
      type: visit.visit_type,
      status: visit.status,
      producer: visit.producer_name,
      plot: visit.plot_name
    });
    
    setVisitDetailModalVisible(false);
    
    console.log('🔄 [DASHBOARD] Navigation vers visite-form avec edit:', visit.id);
    
    router.push({
      pathname: '/(tabs)/visite-form',
      params: { edit: visit.id }
    });
  };

  const handleVisitComplete = async (visit: any) => {
    setActionLoading(visit.id);
    try {
      await VisitsService.updateVisit(visit.id, { status: 'completed' });
      await refresh();
      setVisitDetailModalVisible(false);
      Alert.alert('Succès', 'Visite marquée comme terminée');
    } catch (err) {
      Alert.alert('Erreur', `Impossible de marquer la visite comme terminée: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVisitDelete = (visit: any) => {
    setVisitToDelete(visit);
    setDeleteModalVisible(true);
    setVisitDetailModalVisible(false);
  };

  const handleViewAlertDetails = (alert: any) => {
    setSelectedAlert(alert);
    setAlertModalVisible(true);
  };

  const closeAlertModal = () => {
    setAlertModalVisible(false);
    setSelectedAlert(null);
  };

  const handleMarkAlertAsResolved = async (alertId: string) => {
    console.log('🔧 [DASHBOARD] Tentative de résolution de l\'alerte:', alertId);
    setActionLoading(alertId);
    try {
      await AlertsService.markAlertAsResolved(alertId);
      console.log('✅ [DASHBOARD] Alerte résolue avec succès:', alertId);
      
      // Attendre un peu pour que la base de données soit mise à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔄 [DASHBOARD] Rafraîchissement des données...');
      // Rafraîchir toutes les données
      await refresh();
      console.log('✅ [DASHBOARD] Données rafraîchies');
      
      Alert.alert('Succès', 'Alerte marquée comme résolue');
    } catch (err) {
      console.error('❌ [DASHBOARD] Erreur lors de la résolution:', err);
      Alert.alert('Erreur', `Impossible de marquer l'alerte comme résolue: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateVisitFromAlert = (alert: any) => {
    closeAlertModal();
    const { producerId, plotId, title, description } = alert;
    if (!producerId || !plotId) {
      Alert.alert('Erreur', 'Données manquantes pour créer la visite d\'urgence.');
      return;
    }
    router.push({
      pathname: '/(tabs)/visite-form',
      params: {
        emergency: 'true',
        alertId: alert.id,
        producerId,
        plotId,
        notes: `Visite d'urgence suite à: ${title}`,
        alertTitle: title,
        alertDescription: description
      }
    });
  };


  // --- Rendu des états de chargement et d'erreur ---
  if (!enabled) {
    return (
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle="Connexion en cours..."
        showBackButton={false}
        contentPadding={5}
        contentPaddingTop={25}
      >
        <VStack flex={1} justifyContent="center" alignItems="center" space={4}>
          <Spinner size="lg" color="primary.500" />
          <Text fontSize="md" color="gray.600">
            En attente de session agent...
          </Text>
        </VStack>
      </ScreenContainer>
    );
  }

  const errorMessage = (errorProducers?.message || errorPlots?.message || errorFarmFiles?.message || errorVisits?.message);

  if (loadingProducers || loadingPlots || loadingFarmFiles) {
    return (
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle="Chargement..."
        showBackButton={false}
        contentPadding={5}
        contentPaddingTop={25}
      >
        <VStack flex={1} justifyContent="center" alignItems="center" space={4}>
          <Spinner size="lg" color="primary.500" />
          <Text fontSize="md" color="gray.600">
            Chargement des données...
          </Text>
        </VStack>
      </ScreenContainer>
    );
  }

  if (errorMessage) {
    return (
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle="Erreur"
        showBackButton={false}
        contentPadding={5}
        contentPaddingTop={25}
      >
        <VStack flex={1} justifyContent="center" alignItems="center" space={4} p={8}>
          <Ionicons name="alert-circle" size={48} color="error.500" />
          <Text fontSize="lg" fontWeight="bold" color="error.600" textAlign="center">
            Erreur de chargement
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            {errorMessage}
          </Text>
          <Button
            variant="solid"
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            onPress={refresh}
            mt={4}
          >
            Réessayer
          </Button>
        </VStack>
      </ScreenContainer>
    );
  }

  return (
    <>
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle={`Bonjour ${agentFirstName}, ${today}`}
        showBackButton={false}
        showProfileButton={true}
        showNotifications={true}
        contentScrollable={true}
        contentPadding={5}
        contentPaddingTop={100}
      >
        {/* Cartes KPI */}
        <Card p={5} mb={4}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
            Vue d&apos;ensemble
          </Text>
          <VStack space={3}>
            <HStack space={3}>
              {kpiStats.slice(0, 2).map((stat, index) => (
                <Box key={index} flex={1} p={4} bg="gray.50" borderRadius="lg">
                  <VStack alignItems="center" space={2}>
                    <Box
                      w={9}
                      h={9}
                      borderRadius="full"
                      bg={stat.color}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name={stat.icon as any} size={20} color="white" />
                    </Box>
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                      {stat.value}
                    </Text>
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {stat.title}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </HStack>
            <HStack space={3}>
              {kpiStats.slice(2, 4).map((stat, index) => (
                <Box key={index} flex={1} p={4} bg="gray.50" borderRadius="lg">
                  <VStack alignItems="center" space={2}>
                    <Box
                      w={9}
                      h={9}
                      borderRadius="full"
                      bg={stat.color}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name={stat.icon as any} size={20} color="white" />
                    </Box>
                    <Text fontSize="xl" fontWeight="bold" color="gray.800">
                      {stat.value}
                    </Text>
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      {stat.title}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </HStack>
          </VStack>
        </Card>

        {/* Barre de progression fiches complétées */}
        <Card p={4} mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Fiches complétées
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="success.600">
              {percent}%
            </Text>
          </HStack>
          <Box
            h={2}
            w="100%"
            borderRadius="full"
            bg="gray.200"
            overflow="hidden"
          >
            <Box
              h="100%"
              bg="success.500"
              borderRadius="full"
              style={{ width: `${percent}%` }}
            />
          </Box>
        </Card>

        {/* Filtres de visites */}
        

        {/* Visites - Nouveau composant moderne */}
        <Card p={4} mb={4}>
          <VisitList
            agentId={agentId!}
            onVisitPress={handleVisitPress}
            onVisitEdit={handleVisitEdit}
            onVisitComplete={handleVisitComplete}
            onVisitDelete={handleVisitDelete}
            showFilter={true}
            showRefresh={true}
            maxHeight={400}
          />
        </Card>

        {/* Alertes terrain - Nouveau composant moderne */}
        <Card p={4} mb={4}>
          <AlertList
            agentId={agentId!}
            onAlertPress={handleViewAlertDetails}
            onAlertResolve={handleMarkAlertAsResolved}
            onAlertCreateVisit={handleCreateVisitFromAlert}
            loading={!!actionLoading}
            maxHeight={400}
            alerts={alerts}
            alertsLoading={loadingAlerts}
            alertsError={errorAlerts}
            onRefresh={refetchAlerts}
          />
        </Card>

        {/* Actions de fin de page */}
        <HStack space={3} mb={4}>
          <Button
            flex={1}
            variant="solid"
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            leftIcon={<Ionicons name="add" size={20} color="white" />}
            onPress={() => router.push('/(tabs)/visite-form')}
            h={12}
          >
            Nouvelle visite
          </Button>
          <Button
            flex={1}
            variant="outline"
            borderColor="primary.500"
            _text={{ color: 'primary.500' }}
            leftIcon={<Ionicons name="map" size={20} color="primary.500" />}
            onPress={() => router.push('/(tabs)/parcelles')}
            h={12}
          >
            Carte
          </Button>
        </HStack>

      </ScreenContainer>


      {/* Modal de détail d'alerte - Nouveau composant moderne */}
      <AlertDetailModal
        visible={alertModalVisible}
        alert={selectedAlert}
        onClose={closeAlertModal}
        onResolve={() => {
          closeAlertModal();
          handleMarkAlertAsResolved(selectedAlert?.id);
        }}
        onCreateVisit={() => {
          closeAlertModal();
          handleCreateVisitFromAlert(selectedAlert);
        }}
        loading={!!actionLoading}
      />

      {/* Modal de suppression de visite */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelDeleteVisit}
      >
        <Box flex={1} bg="gray.50">
          <HStack
            justifyContent="space-between"
            alignItems="center"
            p={4}
            bg="white"
            borderBottomWidth={1}
            borderBottomColor="gray.200"
          >
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Supprimer la visite
            </Text>
            <Pressable
              onPress={cancelDeleteVisit}
              p={2}
              borderRadius="md"
              _pressed={{ opacity: 0.7 }}
            >
              <Ionicons name="close" size={24} color="gray.600" />
            </Pressable>
          </HStack>

          {visitToDelete && (
            <VStack flex={1} p={4} space={6}>
              <VStack alignItems="center" p={8} bg="error.50" borderRadius="lg">
                <Ionicons name="warning" size={48} color="error.600" />
                <Text fontSize="lg" fontWeight="bold" color="error.700" mt={3} textAlign="center">
                  Attention !
                </Text>
                <Text fontSize="sm" color="error.600" mt={2} textAlign="center">
                  Êtes-vous sûr de vouloir supprimer cette visite ?
                </Text>
              </VStack>

              <Card p={4}>
                <VStack space={3}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                    Visite concernée :
                  </Text>
                  <Text fontSize="md" fontWeight="bold" color="gray.800">
                    {visitToDelete.producer} - {visitToDelete.location}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {visitToDelete.visit_type} • {visitToDelete.visit_date}
                  </Text>
                </VStack>
              </Card>

              <HStack space={3}>
                <Button
                  flex={1}
                  variant="outline"
                  borderColor="gray.500"
                  _text={{ color: 'gray.500' }}
                  onPress={cancelDeleteVisit}
                  leftIcon={<Ionicons name="close" size={20} color="gray.500" />}
                  h={12}
                >
                  Annuler
                </Button>

                <Button
                  flex={1}
                  variant="solid"
                  bg="error.500"
                  _pressed={{ bg: 'error.600' }}
                  onPress={confirmDeleteVisit}
                  disabled={actionLoading === visitToDelete.id}
                  leftIcon={
                    actionLoading === visitToDelete.id ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <Ionicons name="trash" size={20} color="white" />
                    )
                  }
                  h={12}
                >
                  Supprimer
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>
      </Modal>

      {/* Ancien modal de filtres supprimé: VisitList gère les filtres */}

      {/* Modal de détails des visites - Nouveau composant moderne */}
      <VisitDetailModal
        visit={selectedVisit}
        visible={visitDetailModalVisible}
        onClose={() => setVisitDetailModalVisible(false)}
        onEdit={handleVisitEdit}
        onComplete={handleVisitComplete}
        onDelete={handleVisitDelete}
      />
    </>
  );
}

// Styles section removed - using NativeBase components instead
