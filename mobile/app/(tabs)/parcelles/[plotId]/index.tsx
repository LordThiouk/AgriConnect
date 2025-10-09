import React from 'react';
import { usePathname, useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useFormActivity } from '../../../../context/FormActivityContext';
import { Crop } from '../../../../types/collecte';
import { PlotDisplay } from '../../../../lib/services/domain/plots/plots.types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../context/AuthContext';
import { ScreenContainer, SectionCard } from '../../../../components/ui';
import PhotoGallery from '../../../../components/ui/interactive/PhotoGallery';
import { usePlotById, useActiveCrop, useParticipantsByPlot, useRecommendationsByPlot, useCrops, useInputsByPlot, useOperationsByPlot, useObservationsByPlot } from '../../../../lib/hooks';
import { 
  Box, 
  Text, 
  ScrollView, 
  HStack, 
  VStack, 
  useTheme,
  Badge,
  Pressable
} from 'native-base';

const InfoCard = ({ plot, activeCrop }: { plot: PlotDisplay | null; activeCrop: Crop | null }) => {
  const theme = useTheme();
  
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

        <HStack justifyContent="space-between">
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Producteur
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="gray.900">
              {plot?.producer_name || plot?.producerName || 'N/A'}
            </Text>
          </VStack>
          <VStack flex={1}>
            <Text fontSize="xs" color="gray.600" mb={1}>
              Statut
            </Text>
            <Badge bg={`${currentStatus.color}20`} _text={{ color: currentStatus.color }} px={2} py={1} borderRadius="md">
              {currentStatus.text}
            </Badge>
          </VStack>
        </HStack>

        <VStack>
          <Text fontSize="xs" color="gray.600" mb={1}>
            Localisation
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {localisation}
          </Text>
        </VStack>

        <VStack>
          <Text fontSize="xs" color="gray.600" mb={1}>
            Dernière synchronisation
          </Text>
          <Text fontSize="sm" fontWeight="semibold" color="gray.900">
            {derniereSyncFormatted}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};


export default function PlotDetailScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const { isFormActive } = useFormActivity();

  // État pour contrôler le chargement des données
  const canFetch = isFocused && !isFormActive && plotId;

  console.log('🏞️ [PLOT_DETAIL] Écran de détail parcelle initialisé:', {
    activeTab: 'Sections',
    plotId,
    user: user?.id
  });

  console.log('🏞️ [PLOT_DETAIL] canFetch state:', {
    canFetch,
    inAddForm: isFormActive,
    isFocused,
    isFormActive,
    pathname
  });

  // Hooks de données avec canFetch
  const plotResult = usePlotById(plotId!, { enabled: !!canFetch });
  const activeCropResult = useActiveCrop(plotId!, { enabled: !!canFetch });
  const participantsResult = useParticipantsByPlot(plotId!, { enabled: !!canFetch });
  
  // Hooks pour les sections
  const intrantsResult = useInputsByPlot(plotId!, { enabled: !!canFetch });
  const operationsResult = useOperationsByPlot(plotId!, { enabled: !!canFetch });
  const observationsResult = useObservationsByPlot(plotId!, { enabled: !!canFetch });
  const recommendationsResult = useRecommendationsByPlot(plotId!, { enabled: !!canFetch });
  const cropsResult = useCrops(plotId!, undefined, { enabled: !!canFetch });

  // Extraire les données
  const plot = plotResult.data;
  const plotLoading = plotResult.loading;
  const plotError = plotResult.error;
  
  const activeCrop = activeCropResult.crop;
  const cropLoading = activeCropResult.loading;
  const cropError = activeCropResult.error;
  
  const participants = participantsResult.data;
  const participantsLoading = participantsResult.loading;
  const participantsError = participantsResult.error;
  
  const intrants = intrantsResult.data;
  const intrantsLoading = intrantsResult.loading;
  const intrantsError = intrantsResult.error;
  
  const operations = operationsResult.data;
  const operationsLoading = operationsResult.loading;
  const operationsError = operationsResult.error;
  
  const observations = observationsResult.data;
  const observationsLoading = observationsResult.loading;
  const observationsError = observationsResult.error;
  
  const recommendations = recommendationsResult.data;
  const recommendationsLoading = recommendationsResult.loading;
  const recommendationsError = recommendationsResult.error;
  
  const crops = cropsResult.crops;
  const cropsLoading = cropsResult.loading;
  const cropsError = cropsResult.error;

  console.log('🏞️ [PLOT_DETAIL] État des hooks:', {
    plotId,
    plot: plot ? 'loaded' : 'null',
    plotLoading,
    plotError,
    activeCrop: activeCrop ? 'loaded' : 'null',
    cropLoading,
    cropError,
    loading: plotLoading,
    error: plotError
  });

  console.log('🏞️ [PLOT_DETAIL] État de chargement:', {
    plotLoading,
    cropLoading,
    loading: plotLoading
  });

  // Si pas de plotId, ne pas afficher
  if (!plotId) {
    return (
      <ScreenContainer
        title="Parcelle"
        showBackButton
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="red.500">ID de parcelle manquant</Text>
        </Box>
      </ScreenContainer>
    );
  }

  // Si pas en focus, afficher un conteneur minimal pour éviter les re-renders
  if (!isFocused) {
    return (
      <ScreenContainer
        title="Parcelle"
        showBackButton
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Text color="gray.500">Chargement...</Text>
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Détail Parcelle"
      subtitle={plot?.name_season_snapshot || 'N/A'}
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <HStack space={2}>
          <Pressable
            onPress={() => {
              // Action pour partager
              console.log('Partager parcelle');
            }}
            p={2}
            borderRadius="md"
            _pressed={{ bg: 'gray.100' }}
          >
            <Ionicons name="share-outline" size={20} color="#3D944B" />
          </Pressable>
          <Pressable
            onPress={() => {
              // Action pour menu
              console.log('Menu parcelle');
            }}
            p={2}
            borderRadius="md"
            _pressed={{ bg: 'gray.100' }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#3D944B" />
          </Pressable>
        </HStack>
      }
      animationEnabled={true}
    >
      <ScrollView flex={1} bg="gray.50" showsVerticalScrollIndicator={false}>
        {/* Header avec photo de parcelle */}
        <Box h={200} position="relative" mb={4}>
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
              <Ionicons name="map" size={48} color="#3D944B" />
              <Text color="#3D944B" fontSize="md" fontWeight="semibold" mt={2}>
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
              <Ionicons name="location" size={16} color="green.400" />
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

        <Box p={4}>
          {/* Section Infos */}
          <InfoCard plot={plot} activeCrop={activeCrop} />

          {/* Section Cultures */}
          <SectionCard
            title="Cultures"
            icon="leaf"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/cultures`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/cultures/add`)}
            addButtonText="Ajouter"
            data={crops || []}
            loading={cropsLoading}
            error={cropsError?.message || null}
            renderItem={(crop) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {crop.crop_type} - {crop.variety}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {crop.description || `Semis: ${crop.sowing_date ? new Date(crop.sowing_date).toLocaleDateString('fr-FR') : 'Non défini'}`}
                </Text>
                {crop.sowing_date && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Semé le {new Date(crop.sowing_date).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Section Intrants */}
          <SectionCard
            title="Intrants"
            icon="cube"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/intrants`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/intrants/add`)}
            addButtonText="Ajouter"
            data={intrants || []}
            loading={intrantsLoading}
            error={intrantsError?.message || null}
            renderItem={(intrant) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {intrant.product_name || intrant.name || 'Intrant'}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {intrant.description || `${intrant.quantity ? `${intrant.quantity} ${intrant.unit || ''}` : ''}`}
                </Text>
                {intrant.purchase_date && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Acheté le {new Date(intrant.purchase_date).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Section Intervenants */}
          <SectionCard
            title="Intervenants"
            icon="people"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/intervenants`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/intervenants/add`)}
            addButtonText="Ajouter"
            data={participants || []}
            loading={participantsLoading}
            error={participantsError?.message || null}
            renderItem={(participant) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {participant.name || 'Intervenant'}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {participant.role || 'Rôle non défini'}
                </Text>
                {participant.age && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {participant.age} ans
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Section Opérations */}
          <SectionCard
            title="Opérations"
            icon="construct"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/operations`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/operations/add`)}
            addButtonText="Ajouter"
            data={operations || []}
            loading={operationsLoading}
            error={operationsError?.message || null}
            renderItem={(operation) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {operation.operation_type || 'Opération'}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {operation.description || `${operation.area_hectares ? `${operation.area_hectares} ha` : ''}`}
                </Text>
                {operation.operation_date && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Effectué le {new Date(operation.operation_date).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Section Observations */}
          <SectionCard
            title="Observations"
            icon="eye"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/observations`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/observations/add`)}
            addButtonText="Ajouter"
            data={observations || []}
            loading={observationsLoading}
            error={observationsError?.message || null}
            renderItem={(observation) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {observation.observation_type || 'Observation'}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {observation.description || `${observation.emergence_percent ? `Levée: ${observation.emergence_percent}%` : ''}`}
                </Text>
                {observation.observation_date && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Observé le {new Date(observation.observation_date).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Section Conseils */}
          <SectionCard
            title="Conseils"
            icon="bulb"
            onSeeAll={() => router.push(`/(tabs)/parcelles/${plotId}/conseils`)}
            onAdd={() => router.push(`/(tabs)/parcelles/${plotId}/conseils/add`)}
            addButtonText="Ajouter"
            data={recommendations || []}
            loading={recommendationsLoading}
            error={recommendationsError?.message || null}
            renderItem={(recommendation) => (
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {recommendation.title || 'Conseil'}
                </Text>
                <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                  {recommendation.description || recommendation.content || ''}
                </Text>
                {recommendation.created_at && (
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Créé le {new Date(recommendation.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Galerie de photos - Temporairement désactivée */}
          {/* {plot?.photos && plot.photos.length > 0 && (
            <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
              <Text fontSize="lg" fontWeight="bold" color="gray.900" mb={3}>
                Photos de la parcelle
              </Text>
              <PhotoGallery images={plot.photos} />
            </Box>
          )} */}
        </Box>
      </ScrollView>
    </ScreenContainer>
  );
}