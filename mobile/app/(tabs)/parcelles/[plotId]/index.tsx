import React, { useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RecommendationDisplay, OperationDisplay, InputDisplay, Crop } from '../../../../types/collecte';
import { PlotDisplay } from '../../../../lib/services/domain/plots/plots.types';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';
import { ScreenContainer } from '../../../../components/ui';
import { HStack as HStackIcon, Pressable as PressableIcon } from 'native-base';
import PhotoGallery from '../../../../components/ui/interactive/PhotoGallery';
import { OperationsCard } from '../../../../components/OperationsCard';
import { IntrantsCard } from '../../../../components/IntrantsCard';
import { ObservationsCard } from '../../../../components/ObservationsCard';
import { usePlotById, useActiveCrop, useParticipantsByPlot, useRecommendationsByPlot, useLatestRecommendations, useLatestOperations, useCrops, useLatestInputs } from '../../../../lib/hooks';
import { 
  Box, 
  Text, 
  ScrollView, 
  Pressable, 
  HStack, 
  VStack, 
  useTheme,
  Badge
} from 'native-base';

const InfoCard = ({ plot, activeCrop }: { plot: PlotDisplay | null; activeCrop: Crop | null }) => {
  const theme = useTheme();
  
  console.log('🏞️ [INFO_CARD] Rendu InfoCard:', {
    plot: plot ? { 
      name: plot.name_season_snapshot, 
      status: plot.status,
      area: plot.area_hectares,
      producer_name: plot.producer_name,
      id: plot.id,
      // Test des alias
      name_alias: plot.name,
      area_alias: plot.area,
      producerName_alias: plot.producerName,
      variety_alias: plot.variety,
      soilType_alias: plot.soilType,
      waterSource_alias: plot.waterSource
    } : null,
    activeCrop: activeCrop ? { 
      id: activeCrop.id, 
      variety: activeCrop.variety,
      crop_type: activeCrop.crop_type,
      status: activeCrop.status
    } : null
  });
  
  const statusConfig = {
    preparation: { text: 'En cours', color: theme.colors.success?.[500] || '#10b981' },
    active: { text: 'En cours', color: theme.colors.success?.[500] || '#10b981' },
    cultivated: { text: 'Récolté', color: theme.colors.warning?.[500] || '#f59e0b' },
    fallow: { text: 'Abandonné', color: theme.colors.error?.[500] || '#ef4444' },
  };
  const currentStatus = statusConfig[plot?.status as keyof typeof statusConfig] || statusConfig.preparation;

  // Utiliser la culture active si disponible, sinon fallback sur variety de plot
  const culturePrincipale = activeCrop?.variety || plot?.variety || 'N/A';
  
  // Construire la localisation à partir des données disponibles
  const localisation = plot?.location || 'N/A';

  // Utiliser lastSync si disponible
  const derniereSync = plot?.lastSync;
  const derniereSyncFormatted = derniereSync ? new Date(derniereSync).toLocaleString('fr-FR') : 'Non disponible';

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <Text fontSize="lg" fontWeight="bold" color="gray.900" mb={3}>
        Informations générales
      </Text>
      <VStack space={3}>
        <HStack justifyContent="space-between">
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              ID Parcelle
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.900">
              {plot?.name_season_snapshot || plot?.name || 'N/A'}
            </Text>
          </VStack>
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Surface
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.900">
              {plot?.area_hectares ? `${plot.area_hectares.toFixed(2)} ha` : 'N/A'}
            </Text>
          </VStack>
        </HStack>
        
        <VStack>
          <Text fontSize="xs" color="gray.600" mb={1}>
            Culture principale
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {culturePrincipale}
          </Text>
        </VStack>
        
        <VStack>
          <Text fontSize="xs" color="gray.600" mb={1}>
            Localisation
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {localisation}
          </Text>
        </VStack>
        
        <HStack justifyContent="space-between">
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Statut
            </Text>
            <Badge
              bg={`${currentStatus.color}20`}
              borderRadius="full"
              px={3}
              py={1}
              borderWidth={1}
              borderColor={`${currentStatus.color}40`}
              alignSelf="flex-start"
            >
              <Text fontSize="xs" fontWeight="bold" color={currentStatus.color}>
                {currentStatus.text}
              </Text>
            </Badge>
          </VStack>
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Dernière synchro
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {derniereSyncFormatted}
          </Text>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

const ParticipantsCard = ({ plotId, router }: { plotId: string; router: any }) => {
  const theme = useTheme();
  // Utiliser le hook pour récupérer les participants
  const { data: participants, loading: participantsLoading, error: participantsError } = useParticipantsByPlot(plotId!);

  console.log('👥 [PLOT_DETAIL] Participants récupérés:', { 
    count: participants?.length || 0, 
    loading: participantsLoading, 
    error: participantsError?.message 
  });

  // Le hook gère automatiquement le chargement

  const getRoleIcon = (role: string) => {
    if (!role) return 'user';
    switch (role.toLowerCase()) {
      case 'producteur':
        return 'user';
      case 'agent':
        return 'user-check';
      case 'ouvrier':
        return 'users';
      case 'superviseur':
        return 'shield';
      default:
        return 'user';
    }
  };

  const getRoleColor = (role: string) => {
    if (!role) return theme.colors.gray?.[600] || '#6b7280';
    switch (role.toLowerCase()) {
      case 'producteur':
        return theme.colors.primary?.[500] || '#3D944B';
      case 'agent':
        return theme.colors.blue?.[500] || '#2196F3';
      case 'ouvrier':
        return theme.colors.orange?.[500] || '#FF9800';
      case 'superviseur':
        return theme.colors.purple?.[500] || '#9C27B0';
      default:
        return theme.colors.gray?.[600] || '#6b7280';
    }
  };

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Participants
        </Text>
        <Pressable onPress={() => router.push(`/(tabs)/parcelles/${plotId}/intervenants`)}>
          <Text color={theme.colors.primary?.[500] || '#3D944B'} fontWeight="semibold" fontSize="sm">
            Gérer
          </Text>
        </Pressable>
      </HStack>
      
      {participantsLoading ? (
        <ActivityIndicator color={theme.colors.primary?.[500] || '#3D944B'} />
      ) : participantsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {participantsError.message}
        </Text>
      ) : participants?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4} fontStyle="italic">
          Aucun participant pour cette parcelle.
        </Text>
      ) : (
        <VStack space={3}>
          {participants?.slice(0, 3).map(item => (
            <HStack key={item.id} alignItems="center" py={2}>
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg={`${getRoleColor(item.role)}20`}
                alignItems="center"
                justifyContent="center"
                mr={3}
              >
                <Feather name={getRoleIcon(item.role)} size={20} color={getRoleColor(item.role)} />
              </Box>
              <VStack flex={1}>
                <Text fontSize="md" fontWeight="semibold" color="gray.900">
                  {item.name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {item.role}{item.age ? ` • ${item.age} ans` : ''}
                </Text>
              </VStack>
            </HStack>
          ))}
          <Pressable 
            onPress={() => router.push(`/(tabs)/parcelles/${plotId}/intervenants`)}
            py={2}
            alignItems="center"
          >
            <Text color={theme.colors.primary?.[500] || '#3D944B'} fontSize="sm" fontWeight="semibold">
              {participants.length > 3 ? 'Voir tous les intervenants' : 'Gérer les intervenants'}
            </Text>
          </Pressable>
        </VStack>
      )}
    </Box>
  );
};

const ConseilsCard = ({ plotId }: { plotId: string }) => {
  const router = useRouter();

  // Utiliser le hook pour récupérer les recommandations
  const { data: recommendations, loading: recommendationsLoading, error: recommendationsError } = useRecommendationsByPlot(plotId!);

  console.log('💡 [PLOT_DETAIL] Recommandations récupérées:', { 
    count: recommendations?.length || 0, 
    loading: recommendationsLoading, 
    error: recommendationsError?.message 
  });

  const getStatusStyle = (status: string) => {
    if (!status) return { container: 'gray.100', text: 'gray.600' };
    if (status.toLowerCase() === 'completed') return { container: 'green.100', text: 'green.600' };
    if (status.toLowerCase() === 'acknowledged') return { container: 'blue.100', text: 'blue.600' };
    return { container: 'gray.100', text: 'gray.600' };
  };


  const RecommendationItem = ({ item }: { item: RecommendationDisplay }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <HStack space={3} py={3} borderBottomWidth={1} borderBottomColor="gray.100">
        <Box
          w={12}
          h={12}
          borderRadius="full"
          bg="yellow.100"
          justifyContent="center"
          alignItems="center"
        >
          <Feather name="sun" size={24} color="#FFD65A" />
        </Box>
        <VStack flex={1} space={2}>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="md" fontWeight="600" color="gray.900">
              {item.title}
            </Text>
            <Badge
              bg="gray.100"
              _text={{ color: 'gray.600', fontSize: 'xs', fontWeight: 'bold' }}
              px={2}
              py={1}
              borderRadius="md"
            >
              Normale
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.600" lineHeight={20}>
            {item.message}
          </Text>
          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="xs" color="gray.500">
              {item.date}
            </Text>
            <Badge
              bg={statusStyle.container}
              _text={{ color: statusStyle.text, fontSize: 'xs', fontWeight: 'bold' }}
              px={2}
              py={1}
              borderRadius="md"
            >
              {item.status}
            </Badge>
          </HStack>
        </VStack>
      </HStack>
    );
  };
  
  if (recommendationsLoading) return <ActivityIndicator />;

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Conseils & Recommandations
        </Text>
        <Pressable onPress={() => router.push(`/(tabs)/parcelles/${plotId}/conseils/add`)}>
          <Feather name="plus-circle" size={24} color="#3D944B" />
        </Pressable>
      </HStack>
      {recommendationsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {recommendationsError.message}
        </Text>
      ) : recommendations?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4}>
          Aucun conseil pour cette parcelle.
        </Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={({ item }) => <RecommendationItem item={item} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </Box>
  );
};

const LatestConseilsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  // Utiliser le hook pour récupérer les dernières recommandations
  const { data: recommendations, loading: recsLoading, error: recsError } = useLatestRecommendations(plotId);

  console.log('💡 [PLOT_DETAIL] Dernières recommandations récupérées:', { 
    count: recommendations?.length || 0, 
    loading: recsLoading, 
    error: recsError?.message 
  });

  const renderItem = ({ item }: { item: RecommendationDisplay }) => (
    <HStack space={3} py={3} borderBottomWidth={1} borderBottomColor="gray.100">
      <Feather name="info" size={20} color="#3D944B" />
      <VStack flex={1} space={1}>
        <Text fontSize="md" fontWeight="600" color="gray.900">
          {item.title}
        </Text>
        <Text fontSize="sm" color="gray.600" lineHeight={20}>
          {item.message}
        </Text>
      </VStack>
    </HStack>
  );

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Derniers Conseils
        </Text>
        <Pressable onPress={onSeeAll}>
          <Text color="primary.500" fontWeight="600" fontSize="sm">
            Voir tout
          </Text>
        </Pressable>
      </HStack>
      {recsLoading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : recsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {recsError.message}
        </Text>
      ) : recommendations?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4}>
          Aucun conseil pour le moment.
        </Text>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </Box>
  );
};

const LatestOperationsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  // Utiliser le hook pour récupérer les dernières opérations
  const { data: operations, loading: operationsLoading, error: operationsError } = useLatestOperations(plotId);

  console.log('🚜 [PLOT_DETAIL] Dernières opérations récupérées:', { 
    count: operations?.length || 0, 
    loading: operationsLoading, 
    error: operationsError?.message 
  });

  const renderItem = ({ item }: { item: OperationDisplay }) => {
    const iconName = operationIcons[item.type] || 'settings';
    return (
      <HStack space={4} py={3} borderBottomWidth={1} borderBottomColor="gray.100">
        <Box
          w={12}
          h={12}
          borderRadius="full"
          bg="green.100"
          justifyContent="center"
          alignItems="center"
        >
          <Feather name={iconName} size={24} color="#3D944B" />
        </Box>
        <VStack flex={1} space={1}>
          <Text fontSize="md" fontWeight="600" color="gray.900" textTransform="capitalize">
            {item.type}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Par {item.author} le {item.date}
          </Text>
          {item.description && (
            <Text fontSize="sm" color="gray.600">
              {item.description}
            </Text>
          )}
        </VStack>
        <Box
          w={16}
          h={16}
          borderRadius="md"
          overflow="hidden"
          ml={3}
        >
          <PhotoGallery
            entityType="operation"
            entityId={item.id}
            title=""
            maxPhotos={1}
            showTitle={false}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      </HStack>
    );
  };

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Dernières Opérations
        </Text>
        <Pressable onPress={onSeeAll}>
          <Text color="primary.500" fontWeight="600" fontSize="sm">
            Voir tout
          </Text>
        </Pressable>
      </HStack>
      {operationsLoading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : operationsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {operationsError.message}
        </Text>
      ) : operations?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4}>
          Aucune opération récente.
        </Text>
      ) : (
        <FlatList
          data={operations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </Box>
  );
};


const CurrentCropCard = ({ crop }: { crop: Crop | null }) => {
  if (!crop) {
    return (
      <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900" mb={3}>
          Culture en cours
        </Text>
        <Text textAlign="center" color="gray.500" py={4}>
          Aucune culture active sur cette parcelle.
        </Text>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Culture en cours
        </Text>
        <Pressable>
          <Text color="primary.500" fontWeight="600" fontSize="sm">
            Voir détails
          </Text>
        </Pressable>
      </HStack>
      
      <HStack space={3} mb={4}>
        <Box
          w={12}
          h={12}
          borderRadius="full"
          bg="yellow.100"
          justifyContent="center"
          alignItems="center"
        >
          <Feather name="sun" size={24} color="#FFD65A" />
        </Box>
        <VStack flex={1} space={1}>
          <Text fontSize="md" fontWeight="600" color="gray.900">
            {crop.crop_type} - {crop.variety}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Saison hivernage 2024
          </Text>
        </VStack>
      </HStack>

      <VStack space={3}>
        <HStack space={4}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Semis
            </Text>
            <Text fontSize="sm" fontWeight="600" color="gray.900">
              {new Date(crop.sowing_date).toLocaleDateString('fr-FR')}
            </Text>
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Levée
            </Text>
            <Text fontSize="sm" fontWeight="600" color="gray.900">
              N/A
            </Text>
          </Box>
        </HStack>
        <HStack space={4}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Récolte prévue
            </Text>
            <Text fontSize="sm" fontWeight="600" color="gray.900">
              {crop.expected_harvest_date ? new Date(crop.expected_harvest_date).toLocaleDateString('fr-FR') : 'N/A'}
            </Text>
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Rendement estimé
            </Text>
            <Text fontSize="sm" fontWeight="600" color="gray.900">
              {crop.actual_yield_kg ? `${crop.actual_yield_kg} T/ha` : 'N/A'}
            </Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};

const CulturesCard = ({ plotId, router, agentId }: { plotId: string; router: any; agentId?: string }) => {
  // Utiliser le hook pour récupérer les cultures
  const { crops, loading: cropsLoading, error: cropsError } = useCrops(plotId);

  console.log('🌾 [PLOT_DETAIL] Cultures récupérées:', { 
    count: crops?.length || 0, 
    loading: cropsLoading, 
    error: cropsError?.message 
  });

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'en_cours':
      case 'active':
        return { backgroundColor: '#dcfce7', color: '#16a34a' };
      case 'completed':
      case 'terminé':
        return { backgroundColor: '#e0f2fe', color: '#0284c7' };
      case 'abandoned':
      case 'abandonné':
        return { backgroundColor: '#fef2f2', color: '#dc2626' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    }
  };

  const handleEditCrop = (cropId: string) => {
    router.push(`/(tabs)/parcelles/${plotId}/cultures/${cropId}/edit`);
  };

  const handleDeleteCrop = async (cropId: string) => {
    try {
      console.log('🌾 [PLOT_DETAIL] Suppression de la culture:', cropId);
      
      // Utiliser CropsService directement
      const { CropsServiceInstance } = await import('../../../../lib/services/domain/crops');
      await CropsServiceInstance.deleteCrop(cropId, plotId);
      
      console.log('✅ [PLOT_DETAIL] Culture supprimée avec succès');
      
      // Le hook se rafraîchira automatiquement
    } catch (error) {
      console.error('❌ [PLOT_DETAIL] Erreur lors de la suppression:', error);
    }
  };

  const renderCropItem = ({ item }: { item: Crop }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <HStack space={4} py={3} borderBottomWidth={1} borderBottomColor="gray.100">
        <VStack flex={1} space={1}>
          <Text fontSize="md" fontWeight="600" color="gray.900">
            {item.crop_type}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {item.variety}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Semis: {new Date(item.sowing_date).toLocaleDateString('fr-FR')}
          </Text>
        </VStack>
        <VStack space={2} alignItems="flex-end">
          <Badge
            bg={statusStyle.backgroundColor}
            _text={{ color: statusStyle.color, fontSize: 'xs', fontWeight: 'bold' }}
            px={2}
            py={1}
            borderRadius="md"
          >
            {item.status}
          </Badge>
          <HStack space={2}>
            <Pressable
              p={2}
              borderRadius="md"
              bg="gray.100"
              onPress={() => handleEditCrop(item.id)}
            >
              <Feather name="edit" size={16} color="#3D944B" />
            </Pressable>
            <Pressable
              p={2}
              borderRadius="md"
              bg="gray.100"
              onPress={() => handleDeleteCrop(item.id)}
            >
              <Feather name="trash-2" size={16} color="#ef4444" />
            </Pressable>
          </HStack>
        </VStack>
      </HStack>
    );
  };

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Cultures
        </Text>
        <Pressable onPress={() => router.push(`/(tabs)/parcelles/${plotId}/cultures/add`)}>
          <Feather name="plus-circle" size={24} color="#3D944B" />
        </Pressable>
      </HStack>
      {cropsLoading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }} />
      ) : cropsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {cropsError.message}
        </Text>
      ) : crops?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4}>
          Aucune culture enregistrée pour cette parcelle.
        </Text>
      ) : (
        <FlatList
          data={crops}
          renderItem={renderCropItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </Box>
  );
};

const LatestIntrantsCard = ({ plotId, onSeeAll }: { plotId: string; onSeeAll: () => void }) => {
  // Utiliser le hook pour récupérer les derniers intrants
  const { data: inputs, loading: inputsLoading, error: inputsError } = useLatestInputs(plotId);

  console.log('🌱 [PLOT_DETAIL] Derniers intrants récupérés:', { 
    count: inputs?.length || 0, 
    loading: inputsLoading, 
    error: inputsError?.message 
  });

  const getInputIcon = (category: string) => {
    if (!category) return 'package';
    switch (category.toLowerCase()) {
      case 'semence':
        return 'sun';
      case 'engrais':
        return 'trending-up';
      case 'pesticide':
        return 'shield';
      case 'herbicide':
        return 'slash';
      case 'autre':
        return 'package';
      default:
        return 'package';
    }
  };

  const getInputColor = (category: string) => {
    if (!category) return '#6b7280';
    switch (category.toLowerCase()) {
      case 'semence':
        return '#4CAF50';
      case 'engrais':
        return '#FF9800';
      case 'pesticide':
        return '#F44336';
      case 'herbicide':
        return '#9C27B0';
      case 'autre':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const renderItem = ({ item }: { item: InputDisplay }) => {
    const iconName = getInputIcon(item.category);
    const iconColor = getInputColor(item.category);
    
    return (
      <HStack space={4} py={3} borderBottomWidth={1} borderBottomColor="gray.100">
        <Box
          w={12}
          h={12}
          borderRadius="full"
          bg={`${iconColor}20`}
          justifyContent="center"
          alignItems="center"
        >
          <Feather name={iconName} size={24} color={iconColor} />
        </Box>
        <VStack flex={1} space={1}>
          <Text fontSize="md" fontWeight="600" color="gray.900" textTransform="capitalize">
            {item.category}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {item.label}
          </Text>
          <Text fontSize="sm" color="gray.700">
            {item.quantity} {item.unit}
          </Text>
        </VStack>
        <Text fontSize="xs" color="gray.500">
          {item.date}
        </Text>
      </HStack>
    );
  };
  
  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="gray.900">
          Derniers Intrants
        </Text>
        <Pressable onPress={onSeeAll}>
          <Text color="primary.500" fontWeight="600" fontSize="sm">
            Voir tout
          </Text>
        </Pressable>
      </HStack>
      {inputsLoading ? (
        <ActivityIndicator color="#3D944B" style={{ marginVertical: 20 }}/>
      ) : inputsError ? (
        <Text textAlign="center" color="red.500" py={4}>
          Erreur: {inputsError.message}
        </Text>
      ) : inputs?.length === 0 ? (
        <Text textAlign="center" color="gray.500" py={4}>
          Aucun intrant récent.
        </Text>
      ) : (
        <FlatList
          data={inputs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </Box>
  );
};

const operationIcons: { [key: string]: keyof typeof Feather.glyphMap } = {
  sowing: 'feather',
  fertilization: 'droplet',
  irrigation: 'cloud-drizzle',
  weeding: 'scissors',
  pesticide: 'shield',
  harvest: 'gift',
  tillage: 'grid',
  scouting: 'search',
  default: 'tool',
};







const ParcelleDashboardScreen: React.FC = () => {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState('Infos');

  console.log('🏞️ [PLOT_DETAIL] Écran de détail parcelle initialisé:', {
    plotId,
    user: user?.id,
    activeTab
  });

  // Utiliser les nouveaux hooks pour récupérer les données
  const { data: plot, loading: plotLoading, error: plotError } = usePlotById(plotId, {
    refetchOnMount: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { crop: activeCrop, loading: cropLoading, error: cropError } = useActiveCrop(plotId || '', {
    refetchOnMount: true,
    cacheTTL: 2 * 60 * 1000, // 2 minutes
  });

  const loading = plotLoading || cropLoading;
  const error = plotError || cropError;

  console.log('🏞️ [PLOT_DETAIL] État des hooks:', {
    plotId,
    plot: plot ? { 
      name: plot.name_season_snapshot, 
      area: plot.area_hectares,
      status: plot.status,
      producer_name: plot.producer_name,
      id: plot.id,
      // Test des alias
      name_alias: plot.name,
      area_alias: plot.area,
      producerName_alias: plot.producerName
    } : null,
    activeCrop: activeCrop ? { 
      id: activeCrop.id, 
      variety: activeCrop.variety,
      crop_type: activeCrop.crop_type,
      status: activeCrop.status
    } : null,
    plotLoading,
    cropLoading,
    plotError: plotError?.message,
    cropError: cropError?.message,
    loading,
    error: error?.message
  });

  const TabButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <Pressable 
      onPress={onPress} 
      py={3}
      px={4}
      borderBottomWidth={2}
      borderBottomColor={isActive ? (theme.colors.primary?.[500] || '#3D944B') : 'transparent'}
    >
      <Text 
        color={isActive ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.600'}
        fontWeight="semibold"
        fontSize="sm"
      >
        {title}
      </Text>
    </Pressable>
  );

  if (loading) {
    console.log('🏞️ [PLOT_DETAIL] État de chargement:', { plotLoading, cropLoading, loading });
    return (
      <ScreenContainer 
        title="Détail Parcelle"
        showSubHeader={true}
        showBackButton={false}
        animationEnabled={true}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text mt={4} fontSize="md" color="gray.600">Chargement des données...</Text>
        </Box>
      </ScreenContainer>
    );
  }

  if (error) {
    console.log('🏞️ [PLOT_DETAIL] Erreur détectée:', { 
      plotError: plotError?.message, 
      cropError: cropError?.message, 
      error: error?.message 
    });
    return (
      <ScreenContainer 
        title="Détail Parcelle"
        showSubHeader={true}
        showBackButton={false}
        animationEnabled={true}
      >
        <Box flex={1} justifyContent="center" alignItems="center" p={4}>
          <Feather name="alert-circle" size={48} color={theme.colors.error?.[500] || '#ef4444'} />
          <Text mt={4} fontSize="lg" fontWeight="semibold" color="gray.800" textAlign="center">
            Erreur de chargement
          </Text>
          <Text mt={2} fontSize="sm" color="gray.600" textAlign="center">
            Impossible de charger les données de la parcelle
          </Text>
          <Text mt={1} fontSize="xs" color="gray.500" textAlign="center">
            {error?.message || 'Erreur inconnue'}
          </Text>
        </Box>
      </ScreenContainer>
    );
  }

  console.log('🏞️ [PLOT_DETAIL] Rendu principal:', {
    plot: plot ? { 
      name: plot.name_season_snapshot, 
      area: plot.area_hectares,
      status: plot.status 
    } : null,
    activeCrop: activeCrop ? { 
      id: activeCrop.id, 
      variety: activeCrop.variety,
      crop_type: activeCrop.crop_type 
    } : null,
    activeTab
  });

  return (
    <ScreenContainer 
      title="Détail Parcelle"
      subtitle={plot?.name_season_snapshot || 'N/A'}
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <HStackIcon space={2}>
          <PressableIcon
            onPress={() => {
              // Action pour partager
              console.log('Partager parcelle');
            }}
            p={2}
            borderRadius="md"
            _pressed={{ bg: 'gray.100' }}
          >
            <Ionicons name="share-outline" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
          </PressableIcon>
          <PressableIcon
            onPress={() => {
              // Action pour menu
              console.log('Menu parcelle');
            }}
            p={2}
            borderRadius="md"
            _pressed={{ bg: 'gray.100' }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
          </PressableIcon>
        </HStackIcon>
      }
      animationEnabled={true}
    >
      <ScrollView flex={1} bg="gray.50">
        {/* Header avec photo de parcelle */}
        <Box h={200} position="relative">
          {plot ? (
            <PhotoGallery
              entityType="plot"
              entityId={plotId!}
              title=""
              maxPhotos={1}
              showTitle={false}
              isHeaderGallery={true}
            />
          ) : (
            <Box 
              flex={1} 
              bg="green.100" 
              justifyContent="center" 
              alignItems="center"
            >
              <Feather name="map-pin" size={48} color={theme.colors.primary?.[500] || '#3D944B'} />
              <Text color={theme.colors.primary?.[500] || '#3D944B'} fontSize="md" fontWeight="semibold" mt={2}>
                Photo de parcelle
              </Text>
            </Box>
          )}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0,0,0,0.4)"
            p={4}
            justifyContent="space-between"
          >
            <HStack justifyContent="space-between" alignItems="flex-start" mt={4}>
              <Text color="white" fontSize="xl" fontWeight="bold" flex={1} mr={3}>
                {plot?.producer_name} / {plot?.name_season_snapshot || plot?.name}
              </Text>
              <Badge bg="rgba(255,255,255,0.9)" borderRadius="full" px={3} py={1}>
                <Text color="gray.900" fontWeight="bold" fontSize="sm">
                  {plot?.area_hectares?.toFixed(2)} ha
                </Text>
              </Badge>
            </HStack>
            
            <VStack alignItems="flex-start" my={2}>
              <Badge bg="green.500" borderRadius="full" px={3} py={1}>
                <Text color="white" fontSize="xs" fontWeight="bold">
                  Cultivée
                </Text>
              </Badge>
            </VStack>
            
            <HStack alignItems="center" mb={2}>
              <Feather name="map-pin" size={16} color="green.400" />
              <Text color="white" fontSize="sm" ml={2} flex={1}>
                GPS: {plot?.center_point && typeof plot.center_point === 'object' && 'coordinates' in plot.center_point && Array.isArray((plot.center_point as any).coordinates) ? `${(plot.center_point as any).coordinates[1].toFixed(4)}°N` : '14.6928°N'}, {plot?.center_point && typeof plot.center_point === 'object' && 'coordinates' in plot.center_point && Array.isArray((plot.center_point as any).coordinates) ? `${(plot.center_point as any).coordinates[0].toFixed(4)}°W` : '17.4467°W'}
              </Text>
              <Pressable 
                bg="rgba(76, 175, 80, 0.8)" 
                px={3} 
                py={1.5} 
                borderRadius="lg" 
                ml={2}
              >
                <Text color="white" fontSize="xs" fontWeight="semibold">
                  Voir carte
                </Text>
              </Pressable>
            </HStack>
          </Box>
        </Box>

        {/* Tab Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          bg="white"
          px={2}
        >
          <TabButton title="Infos" isActive={activeTab === 'Infos'} onPress={() => setActiveTab('Infos')} />
          <TabButton title="Cultures" isActive={activeTab === 'Cultures'} onPress={() => setActiveTab('Cultures')} />
          <TabButton title="Intrants" isActive={activeTab === 'Intrants'} onPress={() => setActiveTab('Intrants')} />
          <TabButton title="Opérations" isActive={activeTab === 'Opérations'} onPress={() => setActiveTab('Opérations')} />
          <TabButton title="Observations" isActive={activeTab === 'Observations'} onPress={() => setActiveTab('Observations')} />
          <TabButton title="Conseils" isActive={activeTab === 'Conseils'} onPress={() => setActiveTab('Conseils')} />
        </ScrollView>

        {/* Tab Content */}
        <Box p={4}>
          {activeTab === 'Infos' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_INFOS] Rendu onglet Infos:', { plot: !!plot, activeCrop: !!activeCrop })}
              {plot && <InfoCard plot={plot} activeCrop={activeCrop} />}
              {plot && <CurrentCropCard crop={activeCrop} />}
              {plot && (
                <Box bg="white" borderRadius="xl" p={4} shadow={2}>
                  <PhotoGallery
                    entityType="plot"
                    entityId={plotId!}
                    title="Photos de la parcelle"
                    maxPhotos={10}
                    showTitle={true}
                  />
                </Box>
              )}
              {plot && <ParticipantsCard plotId={plotId!} router={router} />}
              {plot && <LatestIntrantsCard plotId={plotId!} onSeeAll={() => setActiveTab('Intrants')} />}
              {plot && <LatestOperationsCard plotId={plotId!} onSeeAll={() => setActiveTab('Opérations')} />}
              {plot && <ObservationsCard plotId={plotId!} onSeeAll={() => setActiveTab('Observations')} />}
              {plot && <LatestConseilsCard plotId={plotId!} onSeeAll={() => setActiveTab('Conseils')} />}
            </VStack>
          )}
          {activeTab === 'Cultures' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_CULTURES] Rendu onglet Cultures:', { plot: !!plot, plotId })}
              {plot && <CulturesCard plotId={plotId!} router={router} agentId={user?.id} />}
            </VStack>
          )}
          {activeTab === 'Conseils' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_CONSEILS] Rendu onglet Conseils:', { plot: !!plot, plotId })}
              {plot && <ConseilsCard plotId={plotId!} />}
            </VStack>
          )}
          {activeTab === 'Opérations' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_OPERATIONS] Rendu onglet Opérations:', { plot: !!plot, plotId })}
              {plot && <OperationsCard plotId={plotId!} onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/operations`)} />}
            </VStack>
          )}
          {activeTab === 'Observations' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_OBSERVATIONS] Rendu onglet Observations:', { plot: !!plot, plotId })}
              {plot && <ObservationsCard plotId={plotId!} onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/observations`)} />}
            </VStack>
          )}
          {activeTab === 'Intrants' && (
            <VStack space={4}>
              {console.log('🏞️ [TAB_INTRANTS] Rendu onglet Intrants:', { plot: !!plot, plotId })}
              {plot && <IntrantsCard plotId={plotId!} onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/intrants`)} />}
            </VStack>
          )}
        </Box>
      </ScrollView>
      
    </ScreenContainer>
  );
};

export default ParcelleDashboardScreen;