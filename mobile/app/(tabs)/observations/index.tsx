import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useObservationsForAgent } from '../../../lib/hooks/useObservations';
import { GlobalObservationDisplay } from '../../../lib/services/domain/observations/observations.types';
import { ScreenContainer } from '../../../components/ui';
import { Feather } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  ScrollView, 
  Pressable, 
  VStack, 
  HStack, 
  Badge, 
  useTheme
} from 'native-base';

// Types pour les filtres
type FilterType = 'all' | 'fertilization' | 'disease' | 'irrigation' | 'harvest';


export default function ObservationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [filteredObservations, setFilteredObservations] = useState<GlobalObservationDisplay[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [criticalAlert, setCriticalAlert] = useState<GlobalObservationDisplay | null>(null);

  // Utiliser le hook pour récupérer les observations
  const { 
    data: observations, 
    loading, 
    refetch 
  } = useObservationsForAgent(
    user?.id || '',
    50, // limit
    0,  // offset
    undefined, // observationTypeFilter
    undefined, // severityFilter
    { 
      refetchOnMount: true,
      onError: (err) => console.error('Erreur lors du chargement des observations:', err),
      onSuccess: (data) => {
        // Trouver l'alerte critique (severity >= 4)
        const critical = data.find(obs => obs.severity >= 4);
        setCriticalAlert(critical as GlobalObservationDisplay || null);
      }
    }
  );

  // Appliquer les filtres
  useEffect(() => {
    if (!observations) return;
    
    if (activeFilter === 'all') {
      setFilteredObservations(observations as GlobalObservationDisplay[]);
    } else {
      const filtered = observations.filter(obs => obs.type === activeFilter);
      setFilteredObservations(filtered as GlobalObservationDisplay[]);
    }
  }, [observations, activeFilter]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleMarkAsRead = async (observationId: string) => {
    try {
      // TODO: Implémenter la logique de marquage comme lu
      console.log('Marquer comme lu:', observationId);
      Alert.alert('Succès', 'Observation marquée comme lue');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme lu');
    }
  };

  const handleMarkAsExecuted = async (observationId: string) => {
    try {
      // TODO: Implémenter la logique de marquage comme exécuté
      console.log('Marquer comme exécuté:', observationId);
      Alert.alert('Succès', 'Observation marquée comme exécutée');
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Impossible de marquer comme exécuté');
    }
  };

  const handleObservationPress = (observation: GlobalObservationDisplay) => {
    // Naviguer vers le détail de la parcelle
    router.push(`/(tabs)/parcelles/${observation.plotId}`);
  };


  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nouveau';
      case 'read': return 'Lu';
      case 'executed': return 'Exécuté';
      case 'critical': return 'Critique';
      default: return 'N/A';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffHours < 48) return 'Hier';
    return `Il y a ${Math.floor(diffHours / 24)} jours`;
  };

  const FilterButton = ({ type, label, icon, isActive, onPress }: {
    type: FilterType;
    label: string;
    icon: string;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      bg={isActive ? 'primary.500' : 'white'}
      borderWidth={1}
      borderColor={isActive ? 'primary.500' : 'gray.200'}
      borderRadius="full"
      px={3}
      py={2}
      flexDirection="row"
      alignItems="center"
      _pressed={{ opacity: 0.8 }}
    >
      <Feather 
        name={icon as any} 
        size={16} 
        color={isActive ? 'white' : (theme.colors.primary?.[500] || '#3D944B')} 
        style={{ marginRight: 4 }}
      />
      <Text 
        fontSize="sm" 
        fontWeight="medium" 
        color={isActive ? 'white' : (theme.colors.primary?.[500] || '#3D944B')}
      >
        {label}
      </Text>
    </Pressable>
  );

  const ObservationCard = ({ item }: { item: GlobalObservationDisplay }) => {
    const getStatusColorScheme = (status: string) => {
      switch (status) {
        case 'new': return 'info';
        case 'read': return 'gray';
        case 'executed': return 'success';
        case 'critical': return 'error';
        default: return 'gray';
      }
    };

    return (
      <Pressable 
        onPress={() => handleObservationPress(item)}
        _pressed={{ opacity: 0.7 }}
        bg="white"
        mx={4}
        my={2}
        borderRadius="lg"
        borderLeftWidth={4}
        borderLeftColor={item.color}
        shadow={1}
      >
        <HStack alignItems="flex-start" p={4} space={3}>
          {/* Icône avec couleur */}
          <Box
            w={10}
            h={10}
            borderRadius="lg"
            bg={`${item.color}20`}
            alignItems="center"
            justifyContent="center"
          >
            <Feather name={item.icon as any} size={20} color={item.color} />
          </Box>

          {/* Contenu principal */}
          <VStack flex={1} space={2}>
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space={1}>
                <Text fontSize="md" fontWeight="semibold" color="gray.800" numberOfLines={1}>
                  {item.title}
                </Text>
                <HStack alignItems="center" space={1}>
                  <Feather name="map-pin" size={14} color={theme.colors.primary?.[500] || '#3D944B'} />
                  <Text fontSize="sm" fontWeight="medium" color="primary.500">
                    {item.plotName}
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {item.cropType} • {item.producerName}
                </Text>
                <Text fontSize="sm" color="gray.700" numberOfLines={2}>
                  {item.description}
                </Text>
                {item.pestDiseaseName && (
                  <Text fontSize="sm" color="error.600" fontStyle="italic">
                    Maladie/Ravageur: {item.pestDiseaseName}
                  </Text>
                )}
                {item.emergencePercent !== undefined && (
                  <Text fontSize="sm" color="success.600" fontWeight="medium">
                    Levée: {item.emergencePercent}%
                  </Text>
                )}
              </VStack>

              {/* Statut et timestamp */}
              <VStack alignItems="flex-end" space={1}>
                <Badge colorScheme={getStatusColorScheme(item.status)} borderRadius="full" px={2} py={1}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    {getStatusText(item.status)}
                  </Text>
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {formatTimestamp(item.timestamp)}
                </Text>
              </VStack>
            </HStack>

            {/* Actions */}
            <HStack justifyContent="space-between" alignItems="center" mt={2}>
              <HStack space={2}>
                {item.status === 'new' && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(item.id);
                    }}
                    bg="primary.500"
                    px={4}
                    py={2}
                    borderRadius="md"
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      Marquer lu
                    </Text>
                  </Pressable>
                )}
                {item.status === 'read' && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkAsExecuted(item.id);
                    }}
                    bg="success.500"
                    px={4}
                    py={2}
                    borderRadius="md"
                    _pressed={{ opacity: 0.8 }}
                  >
                    <Text fontSize="sm" fontWeight="medium" color="white">
                      Exécuté
                    </Text>
                  </Pressable>
                )}
              </HStack>

              <HStack alignItems="center" space={1}>
                <Text fontSize="sm" fontWeight="medium" color="blue.500">
                  Voir parcelle
                </Text>
                <Feather name="chevron-right" size={16} color={theme.colors.blue?.[500] || '#3B82F6'} />
              </HStack>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
    );
  };


  if (loading) {
    return (
      <ScreenContainer title="Observations">
        <Box flex={1} justifyContent="center" alignItems="center" p={5}>
          <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text mt={4} fontSize="md" color="gray.600">Chargement des observations...</Text>
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Observations">
      <ScrollView 
        flex={1}
        bg="gray.50"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Bannière d'alerte critique */}
        {criticalAlert && (
          <Pressable
            onPress={() => handleObservationPress(criticalAlert)}
            bg="error.500"
            mx={4}
            my={4}
            p={4}
            borderRadius="lg"
            flexDirection="row"
            alignItems="center"
            _pressed={{ opacity: 0.8 }}
          >
            <Feather name="alert-triangle" size={20} color="white" />
            <Text flex={1} color="white" fontSize="md" fontWeight="semibold" ml={2}>
              Alerte critique - {criticalAlert.title} sur {criticalAlert.plotName}
            </Text>
            <Feather name="chevron-right" size={20} color="white" />
          </Pressable>
        )}

        {/* Filtres */}
        <HStack space={2} px={4} py={2} flexWrap="wrap">
          <FilterButton
            type="all"
            label="Tous"
            icon="list"
            isActive={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
          />
          <FilterButton
            type="fertilization"
            label="Fertilisation"
            icon="layers"
            isActive={activeFilter === 'fertilization'}
            onPress={() => setActiveFilter('fertilization')}
          />
          <FilterButton
            type="disease"
            label="Maladies"
            icon="alert-triangle"
            isActive={activeFilter === 'disease'}
            onPress={() => setActiveFilter('disease')}
          />
          <FilterButton
            type="irrigation"
            label="Irrigation"
            icon="droplet"
            isActive={activeFilter === 'irrigation'}
            onPress={() => setActiveFilter('irrigation')}
          />
          <FilterButton
            type="harvest"
            label="Récolte"
            icon="scissors"
            isActive={activeFilter === 'harvest'}
            onPress={() => setActiveFilter('harvest')}
          />
        </HStack>

        {/* Liste des observations */}
        {filteredObservations.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" py={20}>
            <Feather name="eye" size={48} color={theme.colors.gray?.[400] || '#9CA3AF'} />
            <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.600">
              Aucune observation trouvée
            </Text>
            <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
              {activeFilter === 'all' 
                ? 'Aucune observation enregistrée pour le moment'
                : `Aucune observation de type "${activeFilter}" trouvée`
              }
            </Text>
          </Box>
        ) : (
          <VStack space={2} py={4}>
            {filteredObservations.map((item) => (
              <ObservationCard key={item.id} item={item} />
            ))}
          </VStack>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

