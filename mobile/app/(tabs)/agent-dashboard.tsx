/**
 * Tableau de bord Agent - AgriConnect
 * Interface principale pour les agents de terrain
 */

import React, { useState, useMemo } from 'react';
import { ScrollView, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useIsFocused } from '@react-navigation/native';
import {
  useProducerStats,
  usePlotStats,
  useFarmFiles,
  useAgentVisits,
  useAgentAlerts,
  // useAgentAssignments, // Commenté - utilise producerStats
} from '../../lib/hooks';
import { Visit } from '../../lib/services/domain/visits/visits.types';
import { VisitsServiceInstance as VisitsService } from '../../lib/services/domain/visits';
import { AlertsServiceInstance as AlertsService } from '../../lib/services/domain/alerts';
import { 
  ScreenContainer, 
  VStack, 
  HStack, 
  Box, 
  Text, 
  Button, 
  Badge, 
  Pressable, 
  Spinner
} from '../../components/ui';
import { Card } from '../../components/ui/Card';
import { VisitFilterModal } from '../../components/VisitFilterModal';
// import { LinearGradient } from 'expo-linear-gradient';

export default function AgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
  const agentId = user?.id || null;
  const enabled = Boolean(agentId && isFocused);

  // --- Gestion de l'état local ---
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<any>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [currentFilter, setFilter] = useState<string>('today');

  // --- Récupération des données avec les nouveaux hooks ---
  const visitFilter: any = useMemo(() => {
    if (['completed', 'pending', 'in_progress'].includes(currentFilter)) {
      return { status: currentFilter };
    }
    if (['today', 'week', 'month', 'past', 'future'].includes(currentFilter)) {
      return { period: currentFilter };
    }
    return {};
  }, [currentFilter]);

  const { data: producerStats, loading: loadingProducers, error: errorProducers, refetch: refetchProducers } = useProducerStats(agentId || '', { enabled, refetchOnMount: true });
  const { data: plotStats, loading: loadingPlots, error: errorPlots, refetch: refetchPlots } = usePlotStats(agentId, { enabled, refetchOnMount: false });
  const { data: farmFilesData, loading: loadingFarmFiles, error: errorFarmFiles, refetch: refetchFarmFiles } = useFarmFiles(agentId || '');
  const { data: visitsData, loading: loadingVisits, error: errorVisits, refetch: refetchVisits } = useAgentVisits(agentId, visitFilter as any, { enabled, refetchOnMount: false });
  const { data: alertsData, /* loading: loadingAlerts, */ error: errorAlerts, refetch: refetchAlerts } = useAgentAlerts(agentId, { is_resolved: false } as any, { enabled, refetchOnMount: false });
  // const { assignments, loading: loadingAssignments, error: errorAssignments, refetch: refetchAssignments, producersCount } = useAgentAssignments({ agentId, enabled, refetchOnMount: true });

  const visits = visitsData || [];
  const alerts = alertsData || [];
  const farmFiles = farmFilesData || [];

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
  const refresh = async () => {
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
      refetchAlerts(),
      // refetchAssignments(), // Commenté - utilise producerStats
    ]);
  };
  
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
  const handleEditVisit = (visitId: string) => {
    router.push(`/(tabs)/visite-form?edit=${visitId}`);
  };

  const handleDeleteVisit = (visit: any) => {
    setVisitToDelete(visit);
    setDeleteModalVisible(true);
  };

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
  
  const handleMarkAsCompleted = async (visitId: string) => {
    setActionLoading(visitId);
    try {
      await VisitsService.updateVisit(visitId, { status: 'completed' });
      await refresh();
      Alert.alert('Succès', 'Visite marquée comme terminée');
    } catch (err) {
      Alert.alert('Erreur', `Impossible de mettre à jour la visite: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewVisitDetails = (visit: any) => {
    setSelectedVisit(visit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedVisit(null);
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
    setActionLoading(alertId);
    try {
      await AlertsService.markAlertAsResolved(alertId);
      await refresh();
      Alert.alert('Succès', 'Alerte marquée comme résolue');
    } catch (err) {
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

  const handleMarkVisitAsCompleted = async (visitId: string) => {
    setActionLoading(visitId);
    try {
      await VisitsService.updateVisit(visitId, { status: 'completed' });
      await refresh();
      Alert.alert('Succès', 'Visite marquée comme terminée');
    } catch (err) {
      Alert.alert('Erreur', `Impossible de marquer la visite comme terminée: ${(err as Error).message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // --- Rendu des états de chargement et d'erreur ---
  if (!enabled) {
    return (
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle="Connexion en cours..."
        showBackButton={false}
        contentPadding={5}
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

  const errorMessage = (errorProducers?.message || errorPlots?.message || errorFarmFiles?.message || errorVisits?.message || errorAlerts?.message);

  if (loadingProducers || loadingPlots || loadingFarmFiles) {
    return (
      <ScreenContainer
        title="Tableau de Bord Agent"
        subtitle="Chargement..."
        showBackButton={false}
        contentPadding={5}
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
        <Card p={4} mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={3}>
            <Text fontSize="md" fontWeight="semibold" color="gray.800">
              Filtrer les visites
            </Text>
            <HStack alignItems="center" space={2}>
              <Badge bg="gray.100" borderRadius="full" px={2} py={1}>
                <Text fontSize="xs" color="gray.600">
                  {visits.length} visite{visits.length !== 1 ? 's' : ''}
                </Text>
              </Badge>
              <Pressable
                onPress={async () => {
                  console.log('🔍 DEBUG: État actuel des visites:', {
                    filter: currentFilter,
                    count: visits.length,
                    visits: visits.map(v => ({
                      id: v.id,
                      type: v.visit_type,
                      status: v.status,
                      date: v.visit_date
                    }))
                  });
                  
                  console.log('🔄 Refresh forcé...');
                  await refresh();
                }}
                p={2}
                borderRadius="md"
                bg="gray.50"
                _pressed={{ opacity: 0.7 }}
              >
                <Ionicons name="refresh" size={16} color="gray.600" />
              </Pressable>
            </HStack>
          </HStack>
          
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            disabled={loadingVisits}
            _pressed={{ opacity: loadingVisits ? 1 : 0.7 }}
            bg="white"
            borderRadius="lg"
            borderWidth={1}
            borderColor="gray.200"
            p={4}
            shadow={1}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <HStack alignItems="center" space={3} flex={1}>
                <Box
                  w={9}
                  h={9}
                  borderRadius="full"
                  bg="primary.50"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Ionicons name="calendar" size={20} color="primary.500" />
                </Box>
                <VStack flex={1}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.800">
                    {currentFilter === 'today' ? 'Aujourd\'hui' : 
                     currentFilter === 'week' ? 'Cette semaine' :
                     currentFilter === 'month' ? 'Ce mois' :
                     currentFilter === 'past' ? 'Passées' :
                     currentFilter === 'future' ? 'À venir' :
                     currentFilter === 'completed' ? 'Faites' :
                     currentFilter === 'pending' ? 'À faire' :
                     currentFilter === 'in_progress' ? 'En cours' :
                     'Toutes les visites'}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {currentFilter === 'today' ? 'Visites du jour' : 
                     currentFilter === 'week' ? '7 prochains jours' :
                     currentFilter === 'month' ? '30 prochains jours' :
                     currentFilter === 'past' ? 'Visites terminées' :
                     currentFilter === 'future' ? 'Visites planifiées' :
                     currentFilter === 'completed' ? 'Visites terminées' :
                     currentFilter === 'pending' ? 'Visites en attente' :
                     currentFilter === 'in_progress' ? 'Visites en cours' :
                     'Toutes les visites'}
                  </Text>
                </VStack>
              </HStack>
              <Ionicons name="chevron-down" size={20} color="gray.500" />
            </HStack>
          </Pressable>
        </Card>

        {/* Visites */}
        <Card p={4} mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <HStack alignItems="center" space={3}>
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg="primary.100"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="calendar" size={22} color="primary.500" />
              </Box>
              <VStack>
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                  {currentFilter === 'today' ? 'Visites du jour' : 
                   currentFilter === 'week' ? 'Visites de la semaine' :
                   currentFilter === 'month' ? 'Visites du mois' :
                   currentFilter === 'past' ? 'Visites passées' :
                   currentFilter === 'future' ? 'Visites à venir' :
                   currentFilter === 'completed' ? 'Visites terminées' :
                   currentFilter === 'pending' ? 'Visites à faire' :
                   currentFilter === 'in_progress' ? 'Visites en cours' :
                   'Toutes les visites'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {visits.length} {visits.length === 1 ? 'visite' : 'visites'}
                </Text>
              </VStack>
            </HStack>
            <Button
              size="sm"
              variant="solid"
              bg="primary.500"
              _pressed={{ bg: 'primary.600' }}
              leftIcon={<Ionicons name="add" size={16} color="white" />}
              onPress={() => router.push('/(tabs)/visite-form')}
            >
              Nouvelle
            </Button>
          </HStack>
          
          {visits.length === 0 ? (
            <VStack alignItems="center" p={8} bg="gray.50" borderRadius="lg">
              <Ionicons name="calendar-outline" size={48} color="gray.400" />
              <Text fontSize="md" fontWeight="semibold" color="gray.600" mt={3} textAlign="center">
                {currentFilter === 'today' ? 'Aucune visite aujourd&apos;hui' :
                 currentFilter === 'week' ? 'Aucune visite cette semaine' :
                 currentFilter === 'month' ? 'Aucune visite ce mois' :
                 currentFilter === 'past' ? 'Aucune visite passée' :
                 currentFilter === 'future' ? 'Aucune visite à venir' :
                 currentFilter === 'completed' ? 'Aucune visite terminée' :
                 currentFilter === 'pending' ? 'Aucune visite à faire' :
                 currentFilter === 'in_progress' ? 'Aucune visite en cours' :
                 'Aucune visite trouvée'}
              </Text>
              <Text fontSize="sm" color="gray.500" mt={2} textAlign="center">
                {currentFilter === 'today' ? 'Planifiez vos visites pour commencer' :
                 currentFilter === 'week' ? 'Aucune visite planifiée cette semaine' :
                 currentFilter === 'month' ? 'Aucune visite planifiée ce mois' :
                 currentFilter === 'past' ? 'Aucune visite passée enregistrée' :
                 currentFilter === 'future' ? 'Aucune visite à venir planifiée' :
                 currentFilter === 'completed' ? 'Aucune visite terminée enregistrée' :
                 currentFilter === 'pending' ? 'Aucune visite en attente' :
                 currentFilter === 'in_progress' ? 'Aucune visite en cours' :
                 'Aucune visite trouvée avec ce filtre'}
              </Text>
            </VStack>
          ) : (
            <VStack space={3}>
              {visits.map((v: Visit, index: number) => (
                <Pressable 
                  key={v.id} 
                  onPress={() => handleViewVisitDetails(v)}
                  _pressed={{ opacity: 0.7 }}
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  borderWidth={1}
                  borderColor={(v as any).urgency ? "error.200" : "gray.200"}
                  shadow={1}
                >
                  {/* Header avec type et priorité */}
                  <HStack justifyContent="space-between" alignItems="center" mb={3}>
                    <HStack alignItems="center" space={2}>
                      <Box
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg={(v as any).visit_type_color || 'gray.500'}
                        alignItems="center"
                        justifyContent="center"
                      >
                   <Ionicons 
                     name={(v as any).visit_type_icon || 'list'} 
                     size={16} 
                     color="white" 
                   />
                      </Box>
                      <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        {(v as any).visit_type_label || v.visit_type || 'Visite'}
                      </Text>
                    </HStack>
                    <HStack alignItems="center" space={2}>
                   {(v as any).urgency && (
                     <Badge bg="error.100" borderRadius="full" px={2} py={1}>
                       <HStack alignItems="center" space={1}>
                         <Ionicons name="warning" size={12} color="error.600" />
                         <Text fontSize="xs" fontWeight="medium" color="error.600">
                           Urgent
                         </Text>
                       </HStack>
                     </Badge>
                   )}
                      <Badge
                        bg={
                          v.status === 'terminé' ? 'success.100' : 
                          v.status === 'en cours' ? 'warning.100' : 
                          'gray.100'
                        }
                        borderRadius="full"
                        px={2}
                        py={1}
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color={
                            v.status === 'terminé' ? 'success.700' : 
                            v.status === 'en cours' ? 'warning.700' : 
                            'gray.700'
                          }
                        >
                          {v.status === 'terminé' ? 'Fait' : v.status}
                        </Text>
                      </Badge>
                    </HStack>
                  </HStack>

                  {/* Informations principales */}
                  <VStack space={3}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">
                      {v.producer_name}
                    </Text>
                    
                    {/* Informations de la parcelle */}
                    <VStack space={2}>
                      <HStack alignItems="center" space={2}>
                        <Ionicons name="leaf" size={16} color="primary.500" />
                        <Text fontSize="sm" color="gray.700">
                          {v.plot_name}
                        </Text>
                      </HStack>
                      
                      {v.parcel_area && (
                        <HStack alignItems="center" space={2}>
                          <Ionicons name="resize" size={14} color="gray.500" />
                          <Text fontSize="sm" color="gray.600">
                            {v.parcel_area} ha
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                    
                    {/* Métadonnées */}
                    <VStack space={2}>
                      <HStack alignItems="center" space={2}>
                        <Ionicons name="time" size={14} color="gray.500" />
                        <Text fontSize="sm" color="gray.600">
                          {v.visit_date || 'N/A'}
                        </Text>
                      </HStack>
                      
                      <HStack alignItems="center" space={2}>
                        <Ionicons 
                          name="location" 
                          size={14} 
                          color={v.parcel_location ? 'success.500' : 'gray.300'} 
                        />
                        <Text 
                          fontSize="sm" 
                          color={v.parcel_location ? 'success.600' : 'gray.400'}
                        >
                          {v.parcel_location ? 'GPS disponible' : 'Localisation non disponible'}
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>

                  {/* Actions rapides */}
                  <HStack justifyContent="flex-end" space={2} mt={3}>
                    {v.status !== 'terminé' && (
                      <Button
                        size="sm"
                        variant="solid"
                        bg="success.500"
                        _pressed={{ bg: 'success.600' }}
                        onPress={() => handleMarkVisitAsCompleted(v.id)}
                        disabled={actionLoading === v.id}
                        leftIcon={
                          actionLoading === v.id ? (
                            <Spinner size="sm" color="white" />
                          ) : (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )
                        }
                      >
                        Terminer
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="primary.500"
                      _text={{ color: 'primary.500' }}
                      onPress={() => handleEditVisit(v.id)}
                      disabled={actionLoading === v.id}
                      leftIcon={<Ionicons name="pencil" size={16} color="primary.500" />}
                    >
                      Modifier
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="error.500"
                      _text={{ color: 'error.500' }}
                      onPress={() => handleDeleteVisit(v)}
                      disabled={actionLoading === v.id}
                      leftIcon={
                        actionLoading === v.id ? (
                          <Spinner size="sm" color="error.500" />
                        ) : (
                          <Ionicons name="trash" size={16} color="error.500" />
                        )
                      }
                    >
                      Supprimer
                    </Button>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}
        </Card>

        {/* Alertes terrain */}
        <Card p={4} mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <HStack alignItems="center" space={3}>
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg="error.100"
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="warning" size={22} color="error.600" />
              </Box>
              <VStack>
                <Text fontSize="md" fontWeight="bold" color="gray.800">
                  Alertes terrain
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {alerts.length} {alerts.length === 1 ? 'alerte critique' : 'alertes critiques'}
                </Text>
              </VStack>
            </HStack>
            <Badge bg="error.100" borderRadius="full" px={3} py={2}>
              <Text fontSize="xs" fontWeight="bold" color="error.700">
                {alerts.length} {alerts.length === 1 ? 'critique' : 'critiques'}
              </Text>
            </Badge>
          </HStack>
          
          {alerts.length === 0 ? (
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
            <VStack space={3}>
              {alerts.map((a: any, index: number) => (
                <Pressable 
                  key={a.id} 
                  onPress={() => handleViewAlertDetails(a)}
                  _pressed={{ opacity: 0.7 }}
                  bg="white"
                  borderRadius="lg"
                  p={4}
                  borderWidth={1}
                  borderColor={a.severity === 'high' ? "error.200" : "warning.200"}
                  borderLeftWidth={4}
                  borderLeftColor={a.severity === 'high' ? "error.500" : "warning.500"}
                  shadow={1}
                >
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <HStack alignItems="flex-start" space={3} flex={1}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={a.severity === 'high' ? "error.500" : "warning.500"}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons 
                          name={a.severity === 'high' ? 'warning' : 'alert-circle'} 
                          size={20} 
                          color="white" 
                        />
                      </Box>
                      <VStack flex={1} space={2}>
                        <Text fontSize="md" fontWeight="semibold" color="gray.800">
                          {a.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                          {a.description}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    <HStack alignItems="center" space={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="success.500"
                        _text={{ color: 'success.500' }}
                        onPress={() => handleMarkAlertAsResolved(a.id)}
                        disabled={actionLoading === a.id}
                        leftIcon={
                          actionLoading === a.id ? (
                            <Spinner size="sm" color="success.500" />
                          ) : (
                            <Ionicons name="checkmark" size={16} color="success.500" />
                          )
                        }
                      >
                        Résoudre
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="primary.500"
                        _text={{ color: 'primary.500' }}
                        onPress={() => handleCreateVisitFromAlert(a)}
                        disabled={actionLoading === a.id}
                        leftIcon={<Ionicons name="calendar" size={16} color="primary.500" />}
                      >
                        Visite
                      </Button>
                    </HStack>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          )}
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

      {/* Modal de détail de visite */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
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
              Détails de la visite
            </Text>
            <Pressable
              onPress={closeModal}
              p={2}
              borderRadius="md"
              _pressed={{ opacity: 0.7 }}
            >
              <Ionicons name="close" size={24} color="gray.600" />
            </Pressable>
          </HStack>
          
          {selectedVisit && (
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Informations producteur */}
              <Card p={4} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                  Producteur
                </Text>
                <VStack space={3}>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="person" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700">
                      {selectedVisit.producer}
                    </Text>
                  </HStack>
                  {selectedVisit.producer_phone && (
                    <HStack alignItems="center" space={3}>
                      <Ionicons name="call" size={20} color="primary.500" />
                      <Text fontSize="sm" color="gray.700">
                        {selectedVisit.producer_phone}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Card>

              {/* Informations parcelle */}
              <Card p={4} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                  Parcelle
                </Text>
                <VStack space={3}>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="location" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700">
                      {selectedVisit.location}
                    </Text>
                  </HStack>
                  {selectedVisit.plot_area && (
                    <HStack alignItems="center" space={3}>
                      <Ionicons name="resize" size={20} color="primary.500" />
                      <Text fontSize="sm" color="gray.700">
                        {selectedVisit.plot_area} hectares
                      </Text>
                    </HStack>
                  )}
                  <HStack alignItems="center" space={3}>
                    <Ionicons 
                      name="navigate" 
                      size={20} 
                      color={selectedVisit.has_gps ? "primary.500" : "gray.300"} 
                    />
                    <Text 
                      fontSize="sm" 
                      color={selectedVisit.has_gps ? "gray.700" : "gray.400"}
                    >
                      {selectedVisit.has_gps ? 'GPS disponible' : 'Localisation non disponible'}
                    </Text>
                  </HStack>
                </VStack>
              </Card>

              {/* Informations visite */}
              <Card p={4} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                  Visite
                </Text>
                <VStack space={3}>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="calendar" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700">
                      {new Date(selectedVisit.visit_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </HStack>
                  {selectedVisit.visit_type && (
                    <HStack alignItems="center" space={3}>
                      <Ionicons name="list" size={20} color="primary.500" />
                      <Text fontSize="sm" color="gray.700">
                        Type: {selectedVisit.visit_type}
                      </Text>
                    </HStack>
                  )}
                  {selectedVisit.duration_minutes && (
                    <HStack alignItems="center" space={3}>
                      <Ionicons name="time" size={20} color="primary.500" />
                      <Text fontSize="sm" color="gray.700">
                        Durée prévue: {selectedVisit.duration_minutes} minutes
                      </Text>
                    </HStack>
                  )}
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="flag" size={20} color="primary.500" />
                    <Badge
                      bg={
                        selectedVisit.status === 'terminé' ? 'success.100' : 
                        selectedVisit.status === 'en cours' ? 'warning.100' : 
                        'gray.100'
                      }
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="medium"
                        color={
                          selectedVisit.status === 'terminé' ? 'success.700' : 
                          selectedVisit.status === 'en cours' ? 'warning.700' : 
                          'gray.700'
                        }
                      >
                        {selectedVisit.status === 'terminé' ? 'Terminé' : selectedVisit.status}
                      </Text>
                    </Badge>
                  </HStack>
                </VStack>
              </Card>

              {/* Conditions météo */}
              {selectedVisit.weather_conditions && (
                <Card p={4} mb={4}>
                  <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                    Conditions météo
                  </Text>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="partly-sunny" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700">
                      {selectedVisit.weather_conditions}
                    </Text>
                  </HStack>
                </Card>
              )}

              {/* Notes */}
              {selectedVisit.notes && (
                <Card p={4} mb={4}>
                  <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                    Notes
                  </Text>
                  <Box bg="gray.50" p={3} borderRadius="md">
                    <Text fontSize="sm" color="gray.700" lineHeight={20}>
                      {selectedVisit.notes}
                    </Text>
                  </Box>
                </Card>
              )}

              {/* Actions */}
              <VStack space={3} p={4}>
                {selectedVisit.status !== 'terminé' && (
                  <Button
                    variant="solid"
                    bg="success.500"
                    _pressed={{ bg: 'success.600' }}
                    onPress={() => {
                      closeModal();
                      handleMarkAsCompleted(selectedVisit.id);
                    }}
                    disabled={actionLoading === selectedVisit.id}
                    leftIcon={
                      actionLoading === selectedVisit.id ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        <Ionicons name="checkmark" size={20} color="white" />
                      )
                    }
                    h={12}
                  >
                    Marquer comme terminé
                  </Button>
                )}
                
                {selectedVisit.has_gps && selectedVisit.lat && selectedVisit.lon && (
                  <Button
                    variant="solid"
                    bg="primary.500"
                    _pressed={{ bg: 'primary.600' }}
                    onPress={() => {
                      console.log('🗺️ [NAVIGATION] Données de selectedVisit:', {
                        id: selectedVisit.id,
                        plotId: selectedVisit.plotId,
                        lat: selectedVisit.lat,
                        lon: selectedVisit.lon,
                        has_gps: selectedVisit.has_gps,
                        plot_name: selectedVisit.plot_name
                      });
                      
                      closeModal();
                      // Navigation vers la carte avec focus sur la parcelle spécifique
                      router.push({
                        pathname: '/(tabs)/parcelles',
                        params: {
                          focusPlotId: selectedVisit.plotId,
                          centerLat: selectedVisit.lat!.toString(),
                          centerLng: selectedVisit.lon!.toString(),
                          zoom: '18'
                        }
                      });
                    }}
                    leftIcon={<Ionicons name="map" size={20} color="white" />}
                    h={12}
                  >
                    Voir localisation parcelle
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  borderColor="primary.500"
                  _text={{ color: 'primary.500' }}
                  onPress={() => {
                    closeModal();
                    handleEditVisit(selectedVisit.id);
                  }}
                  leftIcon={<Ionicons name="pencil" size={20} color="primary.500" />}
                  h={12}
                >
                  Modifier
                </Button>
              </VStack>
            </ScrollView>
          )}
        </Box>
      </Modal>

      {/* Modal de détail d'alerte */}
      <Modal
        visible={alertModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAlertModal}
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
              Détails de l&apos;alerte
            </Text>
            <Pressable
              onPress={closeAlertModal}
              p={2}
              borderRadius="md"
              _pressed={{ opacity: 0.7 }}
            >
              <Ionicons name="close" size={24} color="gray.600" />
            </Pressable>
          </HStack>
          
          {selectedAlert && (
            <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
              {/* Informations de l'alerte */}
              <Card p={4} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                  Alerte
                </Text>
                <VStack space={3}>
                  <HStack alignItems="center" space={3}>
                    <Ionicons 
                      name="warning" 
                      size={20} 
                      color={selectedAlert.severity === 'high' ? 'error.500' : 'warning.500'} 
                    />
                    <Text fontSize="sm" color="gray.700">
                      {selectedAlert.title}
                    </Text>
                  </HStack>
                  <HStack alignItems="flex-start" space={3}>
                    <Ionicons name="information-circle" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700" flex={1}>
                      {selectedAlert.description}
                    </Text>
                  </HStack>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="flag" size={20} color="primary.500" />
                    <Badge
                      bg={selectedAlert.severity === 'high' ? 'error.100' : 'warning.100'}
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      <Text
                        fontSize="xs"
                        fontWeight="medium"
                        color={selectedAlert.severity === 'high' ? 'error.700' : 'warning.700'}
                      >
                        {selectedAlert.severity === 'high' ? 'Critique' : 'Moyenne'}
                      </Text>
                    </Badge>
                  </HStack>
                </VStack>
              </Card>

              {/* Informations producteur */}
              {selectedAlert.producerName && (
                <Card p={4} mb={4}>
                  <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                    Producteur concerné
                  </Text>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="person" size={20} color="primary.500" />
                    <Text fontSize="sm" color="gray.700">
                      {selectedAlert.producerName}
                    </Text>
                  </HStack>
                </Card>
              )}

              {/* Informations parcelle */}
              {selectedAlert.plotId && (
                <Card p={4} mb={4}>
                  <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                    Parcelle concernée
                  </Text>
                  <HStack alignItems="center" space={3}>
                    <Ionicons name="map" size={20} color="primary.500" />
                    <VStack flex={1}>
                      <Text fontSize="sm" color="gray.700">
                        {selectedAlert.plotName || 'Parcelle non nommée'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        ID: {selectedAlert.plotId}
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              )}

              {/* Date de création */}
              <Card p={4} mb={4}>
                <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                  Date de détection
                </Text>
                <HStack alignItems="center" space={3}>
                  <Ionicons name="time" size={20} color="primary.500" />
                  <Text fontSize="sm" color="gray.700">
                    {new Date(selectedAlert.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </HStack>
              </Card>

              {/* Actions */}
              <VStack space={3} p={4}>
                <Button
                  variant="solid"
                  bg="success.500"
                  _pressed={{ bg: 'success.600' }}
                  onPress={() => {
                    closeAlertModal();
                    handleMarkAlertAsResolved(selectedAlert.id);
                  }}
                  disabled={actionLoading === selectedAlert.id}
                  leftIcon={
                    actionLoading === selectedAlert.id ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )
                  }
                  h={12}
                >
                  Marquer comme résolue
                </Button>
                
                <Button
                  variant="solid"
                  bg="primary.500"
                  _pressed={{ bg: 'primary.600' }}
                  onPress={() => {
                    closeAlertModal();
                    handleCreateVisitFromAlert(selectedAlert);
                  }}
                  leftIcon={<Ionicons name="calendar" size={20} color="white" />}
                  h={12}
                >
                  Créer visite d&apos;urgence
                </Button>
              </VStack>
            </ScrollView>
          )}
        </Box>
      </Modal>

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

      {/* Modal de filtres de visites */}
      <VisitFilterModal
        visible={filterModalVisible}
        currentFilter={currentFilter}
        onFilterSelect={(newFilter) => {
          setFilter(newFilter);
          setFilterModalVisible(false);
        }}
        onClose={() => setFilterModalVisible(false)}
      />
    </>
  );
}

// Styles section removed - using NativeBase components instead
