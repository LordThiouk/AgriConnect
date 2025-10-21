import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Modal, BackHandler, TextInput, Dimensions, FlatList } from 'react-native';
import { router, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { PlotsServiceInstance } from '../../../lib/services/domain/plots';
import { CropsServiceInstance } from '../../../lib/services/domain/crops';
import type { PlotDisplay } from '../../../lib/services/domain/plots/plots.types';
import { Feather } from '@expo/vector-icons';
import MapComponent from '../../../components/MapComponent';
import { ScreenContainer } from '../../../components/ui';
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

const PlotCard = ({ item, agentId, isTablet, isSmallScreen }: { 
  item: PlotDisplay; 
  agentId?: string; 
  isTablet: boolean;
  isSmallScreen: boolean; 
}) => {
  const router = useRouter();
  const theme = useTheme();
  const [cultures, setCultures] = useState<any[]>([]);
  const [loadingCultures, setLoadingCultures] = useState(false);
  const [culturesLoaded, setCulturesLoaded] = useState(false);

  const loadCultures = useCallback(async () => {
    if (culturesLoaded || loadingCultures) return; // Eviter les chargements multiples
        
    try {
      setLoadingCultures(true);
      setCulturesLoaded(true);
      console.log('🌾 [PLOT_CARD] Chargement des cultures pour parcelle:', item.id);
      console.log('🔍 [PLOT_CARD] Vérification CropsServiceInstance:', {
        CropsServiceInstanceExists: !!CropsServiceInstance,
        getCropsByPlotIdExists: !!CropsServiceInstance?.getCropsByPlotId,
        plotId: item.id,
        agentId
      });
      
      const cropData = await CropsServiceInstance.getCropsByPlotId(item.id, agentId, undefined, undefined, { useCache: true });
      console.log('✅ [PLOT_CARD] Cultures récupérées:', cropData?.length || 0);
      console.log('🔍 [PLOT_CARD] Détails des cultures:', cropData);
      setCultures(cropData || []);
    } catch (error) {
      console.error('❌ [PLOT_CARD] Erreur lors du chargement des cultures:', error);
      console.error('🔍 [PLOT_CARD] Détails de l\'erreur:', {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        plotId: item.id,
        agentId
      });
      setCultures([]);
    } finally {
      setLoadingCultures(false);
    }
  }, [item.id, agentId, culturesLoaded, loadingCultures]);

  // Pas de useEffect automatique - chargement sur demande uniquement
  // useEffect(() => {
  //   loadCultures();
  // }, [loadCultures]);

  const statusConfig = {
    preparation: { text: 'En cours', color: theme.colors.success?.[500] || '#10b981' },
    cultivated: { text: 'Récolté', color: theme.colors.warning?.[500] || '#f59e0b' },
    fallow: { text: 'Abandonné', color: theme.colors.error?.[500] || '#ef4444' },
  };
  const currentStatus = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.preparation;

  // Affichage du type de culture principal si disponible
  const primaryCulture = cultures.length > 0 ? cultures[0] : null;
  const cultureDisplay = primaryCulture 
    ? `${primaryCulture.crop_type} - ${primaryCulture.variety}` 
    : 'Cliquer pour voir cultures';

  return (
    <Box
      bg="white"
      borderRadius="xl"
      p={5}
      mb={4}
      mx={4}
      borderWidth={1}
      borderColor="gray.200"
      shadow={3}
    >
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <HStack alignItems="center" flex={1}>
          <Box
            w={12}
            h={12}
            borderRadius="full"
            bg="green.100"
            alignItems="center"
            justifyContent="center"
            mr={3}
          >
            <Feather name="user" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
          </Box>
          <VStack flex={1}>
            <Text fontSize="lg" fontWeight="bold" color="gray.900">
              {item.producer_name}
            </Text>
            <Text fontSize="sm" color="gray.600" numberOfLines={1}>
              ID: {item.name}
            </Text>
          </VStack>
        </HStack>
        <Badge
          bg={`${currentStatus.color}15`}
          borderRadius="full"
          px={3}
          py={1}
          borderWidth={1}
          borderColor={`${currentStatus.color}20`}
        >
          <HStack alignItems="center">
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={currentStatus.color}
              mr={2}
            />
            <Text fontSize="xs" fontWeight="bold" color={currentStatus.color}>
              {currentStatus.text}
            </Text>
          </HStack>
        </Badge>
      </HStack>

      <VStack space={3} mb={5}>
        <HStack
          alignItems="center"
          p={4}
          bg="gray.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="gray.200"
        >
          <Feather name="square" size={16} color={theme.colors.success?.[500] || '#10B981'} />
          <Text fontSize="sm" color="gray.600" ml={2} mr={2} flex={1}>
            Surface
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="gray.900" flex={1}>
            {item.area_hectares?.toFixed(2) || item.area?.toFixed(2) || '0.00'} ha
          </Text>
        </HStack>
        
        <Pressable
            onPress={!culturesLoaded ? loadCultures : undefined}
          isDisabled={loadingCultures || culturesLoaded}
          _pressed={{ opacity: 0.8 }}
        >
          <HStack
            alignItems="center"
            p={4}
            bg="gray.50"
            borderRadius="lg"
            borderWidth={1}
            borderColor="gray.200"
          >
            {loadingCultures ? (
              <Feather name="loader" size={16} color={theme.colors.gray?.[500] || '#9CA3AF'} />
            ) : culturesLoaded ? (
              <Feather name="trending-up" size={16} color={theme.colors.primary?.[500] || '#3B82F6'} />
            ) : (
              <Feather name="arrow-down" size={16} color={theme.colors.success?.[500] || '#10B981'} />
            )}
            <Text fontSize="sm" color="gray.600" ml={2} mr={2} flex={1}>
              Culture
            </Text>
            <Text fontSize="sm" fontWeight="bold" color="gray.900" flex={1} numberOfLines={1}>
              {loadingCultures ? 'Chargement...' : (
                culturesLoaded ? cultureDisplay : 'Cliquer pour voir'
              )}
            </Text>
          </HStack>
        </Pressable>
        
        <HStack
          alignItems="center"
          p={4}
          bg="gray.50"
          borderRadius="lg"
          borderWidth={1}
          borderColor="gray.200"
        >
          <Feather name="map-pin" size={16} color={theme.colors.warning?.[500] || '#F59E0B'} />
          <Text fontSize="sm" color="gray.600" ml={2} mr={2} flex={1}>
            Localisation
          </Text>
          <Text fontSize="sm" fontWeight="bold" color="gray.900" flex={1} numberOfLines={1}>
            {item.location || item.village || item.region || 'Non renseignée'}
          </Text>
        </HStack>
      </VStack>

      <Pressable
        onPress={() => router.push({ pathname: '/(tabs)/parcelles/[plotId]', params: { plotId: item.id } })} 
        _pressed={{ opacity: 0.9 }}
      >
        <HStack
          alignItems="center"
          justifyContent="center"
          bg={theme.colors.primary?.[500] || '#3D944B'}
          py={4}
          px={5}
          borderRadius="lg"
          shadow={2}
        >
          <Text color="white" fontSize="md" fontWeight="bold" mr={2}>
            Voir détails
          </Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </HStack>
      </Pressable>
    </Box>
  );
};

export default function ParcellesListScreen() {
  const { isLoading: authLoading, userRole, user } = useAuth();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    focusPlotId?: string;
    centerLat?: string;
    centerLng?: string;
    zoom?: string;
    showMap?: string;
  }>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState<PlotDisplay[]>([]);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    producer: '',
    region: '',
    culture: '',
    dateSemis: '',
    status: '',
    area: '',
    soilType: '',
    waterSource: ''
  });
  const [filteredPlots, setFilteredPlots] = useState<PlotDisplay[]>([]);
  const [availableProducers, setAvailableProducers] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);
  const [availableCultures, setAvailableCultures] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Dimensions pour responsive layout
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isSmallScreen = screenWidth < 360;

  // Gestion du bouton retour Android pour fermer le modal
  useEffect(() => {
    const backAction = () => {
      if (showDropdown) {
        setShowDropdown(null);
        return true; // Empêcher la fermeture de l'app
      }
      return false; // Permettre la fermeture de l'app
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [showDropdown]);

  // Composant Dropdown pour les filtres
  const FilterDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    filterKey 
  }: { 
    label: string; 
    value: string; 
    options: string[]; 
    onSelect: (value: string) => void; 
    filterKey: string; 
  }) => {
    const isOpen = showDropdown === filterKey;
    const [localSearchText, setLocalSearchText] = useState<string>('');
    
    // Filtrer les options basées sur la recherche
    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(localSearchText.toLowerCase())
    );
    
    // Réinitialiser la recherche quand le modal s'ouvre
    const handleOpen = () => {
      setLocalSearchText('');
      setShowDropdown(isOpen ? null : filterKey);
    };
    
    return (
      <HStack alignItems="center" mb={3}>
        <Text fontSize="sm" fontWeight="medium" color="gray.700" w={20}>
          {label}:
        </Text>
        <Pressable 
          flex={1}
          onPress={handleOpen}
          bg="white"
          px={3}
          py={2}
          borderRadius="md"
          borderWidth={1}
          borderColor="gray.300"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Text fontSize="sm" color="gray.700" flex={1}>
            {value || `Tous les ${label.toLowerCase()}s`}
          </Text>
          <Feather 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={theme.colors.gray?.[600] || '#6b7280'} 
          />
        </Pressable>
        
        {isOpen && (
          <Modal
            transparent={true}
            visible={isOpen}
            onRequestClose={() => setShowDropdown(null)}
            animationType="fade"
          >
            <Pressable 
              flex={1}
              bg="rgba(0, 0, 0, 0.5)"
              justifyContent="center"
              alignItems="center"
              px={5}
              onPress={() => setShowDropdown(null)}
            >
              <Pressable 
                bg="white"
                borderRadius="2xl"
                w="full"
                maxW={400}
                maxH="80%"
                shadow={12}
                onPress={(e) => e.stopPropagation()}
              >
                <HStack justifyContent="space-between" alignItems="center" p={5} borderBottomWidth={1} borderBottomColor="gray.200">
                  <Text fontSize="lg" fontWeight="semibold" color="gray.900">
                    Sélectionner {label.toLowerCase()}
                  </Text>
                  <Pressable 
                    onPress={() => setShowDropdown(null)}
                    p={1}
                  >
                    <Feather name="x" size={20} color={theme.colors.gray?.[600] || '#6b7280'} />
                  </Pressable>
                </HStack>
                
                {/* Champ de recherche pour les longues listes */}
                {options.length > 5 && (
                  <HStack
                    alignItems="center"
                    bg="gray.50"
                    mx={4}
                    my={2}
                    px={3}
                    py={2}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="gray.200"
                  >
                    <Feather name="search" size={16} color={theme.colors.gray?.[600] || '#6b7280'} style={{ marginRight: 8 }} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, color: '#374151', paddingVertical: 4 }}
                      placeholder={`Rechercher ${label.toLowerCase()}...`}
                      value={localSearchText}
                      onChangeText={setLocalSearchText}
                      placeholderTextColor="#9ca3af"
                    />
                  </HStack>
                )}
                
                <FlatList
                  data={['', ...filteredOptions]}
                  keyExtractor={(item, index) => `${filterKey}-${index}`}
                  renderItem={({ item, index }) => (
                    <Pressable
                      bg={index === 0 ? 'gray.50' : (item === value ? 'green.50' : 'white')}
                      onPress={() => {
                        onSelect(item);
                        setShowDropdown(null);
                      }}
                      py={3.5}
                      px={5}
                      borderBottomWidth={1}
                      borderBottomColor="gray.100"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Text 
                        fontSize="sm" 
                        color={item === value ? (theme.colors.primary?.[500] || '#3D944B') : 'gray.700'}
                        fontWeight={item === value ? 'medium' : 'normal'}
                        flex={1}
                      >
                        {index === 0 ? `Tous les ${label.toLowerCase()}s` : item}
                      </Text>
                      {item === value && (
                        <Feather name="check" size={16} color={theme.colors.primary?.[500] || '#3D944B'} />
                      )}
                    </Pressable>
                  )}
                  showsVerticalScrollIndicator={true}
                  style={{ maxHeight: 300 }}
                  ListEmptyComponent={
                    <Box p={5} alignItems="center">
                      <Text fontSize="sm" color="gray.500" fontStyle="italic">
                        Aucun {label.toLowerCase()} trouvé
                      </Text>
                    </Box>
                  }
                />
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </HStack>
    );
  };

  // Chargement des parcelles et extraction des options de filtres
  useEffect(() => {
    const loadPlots = async () => {
      console.log('🔍 [PARCELS] loadPlots appelé');
      console.log('🔍 [PARCELS] authLoading:', authLoading);
      console.log('🔍 [PARCELS] userRole:', userRole);
      console.log('🔍 [PARCELS] user?.id:', user?.id);
      
      if (authLoading || userRole !== 'agent' || !user?.id) {
        console.log('❌ [PARCELS] Conditions non remplies pour charger les parcelles');
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔄 [PARCELS] Appel PlotsServiceInstance.getAgentPlots avec user.id:', user.id);
        console.log('🔍 [PARCELS] Vérification PlotsServiceInstance:', {
          PlotsServiceInstanceExists: !!PlotsServiceInstance,
          getAgentPlotsExists: !!PlotsServiceInstance?.getAgentPlots,
          user: user.id
        });
        
        const data = await PlotsServiceInstance.getAgentPlots(user.id, undefined, undefined, { useCache: true });
        console.log('✅ [PARCELS] Données reçues de getAgentPlots:', data?.length || 0, 'parcelles');
        console.log('📋 [PARCELS] Détails des parcelles:', data);
        console.log('🔍 [PARCELS] Type de données reçues:', typeof data, Array.isArray(data));
        
        // Log du mapping des données pour diagnostic
        if (data && data.length > 0) {
          console.log('🔍 [PARCELS] Mapping des données de la première parcelle:', {
            id: data[0].id,
            name: data[0].name,
            name_season_snapshot: data[0].name_season_snapshot,
            area: data[0].area,
            area_hectares: data[0].area_hectares,
            producer_name: data[0].producer_name,
            location: data[0].location,
            village: data[0].village,
            region: data[0].region,
            status: data[0].status
          });
        }
        setPlots(data);
        setFilteredPlots(data);
        
        // Si on a des paramètres de navigation, activer la carte automatiquement
        if (params.showMap === 'true' || params.centerLat) {
          setShowMap(true);
          console.log('🗺️ Mode carte activé automatiquement pour showMap:', params.showMap, 'centerLat:', params.centerLat);
        }

        // Extraire les options de filtres
        const producers = [...new Set(data.map(p => p.producer_name))].sort();
        const regions = [...new Set(data.map(p => p.region || p.village).filter((loc): loc is string => Boolean(loc)))].sort();
        const cultures: string[] = []; // TODO: Récupérer depuis CropsService si nécessaire
        
        setAvailableProducers(producers);
        setAvailableRegions(regions);
        setAvailableCultures(cultures);
      } catch (error) {
        console.error('❌ [PARCELS] Erreur lors du chargement des parcelles:', error);
        console.error('🔍 [PARCELS] Détails de l\'erreur:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorType: typeof error,
          errorStack: error instanceof Error ? error.stack : undefined,
          PlotsServiceInstance: !!PlotsServiceInstance,
          user: user?.id
        });
        setError('Erreur lors du chargement des parcelles');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlots();
  }, [authLoading, userRole, user?.id, params.centerLat, params.focusPlotId, params.showMap]); // Dépendances correctes

  // Filtrage des parcelles
  useEffect(() => {
    let filtered = [...plots];
    console.log('🔍 [FILTER] Filtrage des parcelles:', {
      totalPlots: plots.length,
      focusPlotId: params.focusPlotId,
      hasFocusPlotId: !!params.focusPlotId
    });

    // Filtre par ID de parcelle spécifique (pour la navigation depuis les visites)
    // Vérifier que focusPlotId est un UUID valide avant de filtrer
    if (params.focusPlotId && params.focusPlotId !== 'index' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.focusPlotId)) {
      filtered = filtered.filter(p => p.id === params.focusPlotId);
      console.log('🎯 [FILTER] Filtrage par focusPlotId:', {
        focusPlotId: params.focusPlotId,
        filteredCount: filtered.length,
        filteredPlots: filtered.map(p => ({ id: p.id, name: p.name }))
      });
    } else {
      // Appliquer les autres filtres seulement si pas de focusPlotId
    if (filters.producer) {
      filtered = filtered.filter(p => p.producer_name.toLowerCase().includes(filters.producer.toLowerCase()));
    }
    if (filters.region) {
      filtered = filtered.filter(p => (p.region || p.village)?.toLowerCase().includes(filters.region.toLowerCase()));
    }
    if (filters.culture) {
      // TODO: Implémenter le filtre culture avec CropsService
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.area) {
      const area = parseFloat(filters.area);
      if (!isNaN(area)) {
        filtered = filtered.filter(p => p.area >= area);
      }
    }
    if (filters.soilType) {
      filtered = filtered.filter(p => p.soil_type?.toLowerCase().includes(filters.soilType.toLowerCase()));
    }
    if (filters.waterSource) {
      filtered = filtered.filter(p => p.water_source?.toLowerCase().includes(filters.waterSource.toLowerCase()));
      }
    }

    console.log('✅ [FILTER] Filtrage terminé:', {
      finalCount: filtered.length,
      finalPlots: filtered.map(p => ({ id: p.id, name: p.name }))
    });
    setFilteredPlots(filtered);
  }, [plots, filters, params.focusPlotId]);

  if (authLoading || userRole !== 'agent' || !user?.id) {
    return (
      <ScreenContainer title="Parcelles">
        <Box flex={1} justifyContent="center" alignItems="center" p={5}>
          <Text fontSize="md" color="gray.600" textAlign="center">
            Onglet réservé aux agents.
          </Text>
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Parcelles">
      {/* Indicateur de focus sur une parcelle spécifique */}
      {params.focusPlotId && params.focusPlotId !== 'index' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.focusPlotId) && (
        <HStack
          alignItems="center"
          bg="green.50"
          borderColor={theme.colors.primary?.[500] || '#3D944B'}
          borderWidth={1}
          borderRadius="lg"
          px={3}
          py={2}
          mx={4}
          mb={3}
        >
          <Feather name="target" size={16} color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text fontSize="sm" fontWeight="medium" color={theme.colors.primary?.[500] || '#3D944B'} flex={1} ml={2}>
            Focus sur la parcelle de la visite
          </Text>
          <Pressable 
            onPress={() => router.replace('/(tabs)/parcelles')}
            p={1}
            borderRadius="md"
            bg="gray.200"
          >
            <Feather name="x" size={16} color={theme.colors.gray?.[600] || '#6B7280'} />
          </Pressable>
        </HStack>
      )}
      
      {/* Switch Liste/Carte + Filtre */}
      <HStack
        justifyContent="center"
        mb={3}
        mx={4}
        bg="gray.200"
        borderRadius="lg"
        p={1}
      >
        <Pressable 
          onPress={() => setShowMap(false)} 
          flex={1}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          py={2}
          px={3}
          borderRadius="md"
          bg={!showMap ? 'white' : 'transparent'}
          shadow={!showMap ? 1 : 0}
          _pressed={{ opacity: 0.8 }}
        >
          <Feather name="list" size={16} color={!showMap ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} />
          <Text fontSize="sm" fontWeight="semibold" color={!showMap ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} ml={1.5}>
            Liste
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setShowMap(true)} 
          flex={1}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          py={2}
          px={3}
          borderRadius="md"
          bg={showMap ? 'white' : 'transparent'}
          shadow={showMap ? 1 : 0}
          _pressed={{ opacity: 0.8 }}
        >
          <Feather name="map" size={16} color={showMap ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} />
          <Text fontSize="sm" fontWeight="semibold" color={showMap ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} ml={1.5}>
            Carte
          </Text>
        </Pressable>
        <Pressable 
          onPress={() => setShowFilters(!showFilters)} 
          flex={1}
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          py={2}
          px={3}
          borderRadius="md"
          bg={showFilters ? 'white' : 'transparent'}
          shadow={showFilters ? 1 : 0}
          _pressed={{ opacity: 0.8 }}
        >
          <Feather name="filter" size={16} color={showFilters ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} />
          <Text fontSize="sm" fontWeight="semibold" color={showFilters ? (theme.colors.primary?.[700] || '#065f46') : (theme.colors.gray?.[600] || '#6b7280')} ml={1.5}>
            Filtres
          </Text>
        </Pressable>
      </HStack>

      {/* Nombre de parcelles et filtres actifs */}
      <Box
        bg="gray.100"
        px={4}
        py={2}
        mx={4}
        mb={2}
        borderRadius="lg"
      >
        <Text fontSize="sm" fontWeight="medium" color="gray.700" textAlign="center">
          {filteredPlots.length} parcelle{filteredPlots.length > 1 ? 's' : ''} trouvée{filteredPlots.length > 1 ? 's' : ''}
        </Text>
        {Object.values(filters).some(f => f !== '') && (
          <VStack mt={2} space={1}>
            <Text fontSize="xs" fontWeight="semibold" color={theme.colors.primary?.[500] || '#3D944B'} textAlign="center">
              Filtres actifs:
            </Text>
            <HStack flexWrap="wrap" justifyContent="center" space={1}>
            {filters.producer && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Producteur: {filters.producer}
                  </Text>
                </Badge>
            )}
            {filters.region && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Région: {filters.region}
                  </Text>
                </Badge>
            )}
            {filters.culture && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Culture: {filters.culture}
                  </Text>
                </Badge>
            )}
            {filters.status && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Statut: {filters.status === 'preparation' ? 'Préparation' : 
                     filters.status === 'cultivated' ? 'Cultivé' : 'Jachère'}
                  </Text>
                </Badge>
            )}
            {filters.area && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Superficie: {filters.area} ha+
                  </Text>
                </Badge>
            )}
            {filters.soilType && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Sol: {filters.soilType}
                  </Text>
                </Badge>
            )}
            {filters.waterSource && (
                <Badge bg={theme.colors.primary?.[500] || '#3D944B'} borderRadius="full" px={2} py={0.5}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    Eau: {filters.waterSource}
                  </Text>
                </Badge>
              )}
            </HStack>
          </VStack>
        )}
      </Box>

      {/* Panneau de filtres */}
      {showFilters && (
        <Box
          bg="gray.50"
          mx={4}
          mb={3}
          p={4}
          borderRadius="xl"
          borderWidth={1}
          borderColor="gray.200"
        >
          <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={4}>
            Filtres
          </Text>
          
          {/* Filtre par producteur */}
          <FilterDropdown
            label="Producteur"
            value={filters.producer}
            options={availableProducers}
            onSelect={(value) => setFilters(prev => ({ ...prev, producer: value }))}
            filterKey="producer"
          />

          {/* Filtre par région */}
          <FilterDropdown
            label="Région"
            value={filters.region}
            options={availableRegions}
            onSelect={(value) => setFilters(prev => ({ ...prev, region: value }))}
            filterKey="region"
          />

          {/* Filtre par culture */}
          <FilterDropdown
            label="Culture"
            value={filters.culture}
            options={availableCultures}
            onSelect={(value) => setFilters(prev => ({ ...prev, culture: value }))}
            filterKey="culture"
          />

          {/* Filtre par statut */}
          <FilterDropdown
            label="Statut"
            value={filters.status === 'preparation' ? 'Préparation' : 
                   filters.status === 'cultivated' ? 'Cultivé' :
                   filters.status === 'fallow' ? 'Jachère' : ''}
            options={['Préparation', 'Cultivé', 'Jachère']}
            onSelect={(value) => {
              const statusMap: { [key: string]: string } = {
                'Préparation': 'preparation',
                'Cultivé': 'cultivated',
                'Jachère': 'fallow'
              };
              setFilters(prev => ({ ...prev, status: statusMap[value] || '' }));
            }}
            filterKey="status"
          />

          {/* Filtre par superficie */}
          <FilterDropdown
            label="Superficie min"
            value={filters.area ? `${filters.area} ha` : ''}
            options={['0.5 ha', '1 ha', '2 ha', '3 ha', '5 ha']}
            onSelect={(value) => {
              const area = value.replace(' ha', '');
              setFilters(prev => ({ ...prev, area }));
            }}
            filterKey="area"
          />

          {/* Filtre par type de sol */}
          <FilterDropdown
            label="Type de sol"
            value={filters.soilType}
            options={['Argileux', 'Sableux', 'Limoneux', 'Tourbeux']}
            onSelect={(value) => setFilters(prev => ({ ...prev, soilType: value }))}
            filterKey="soilType"
          />

          {/* Filtre par source d'eau */}
          <FilterDropdown
            label="Source d'eau"
            value={filters.waterSource}
            options={['Puits', 'Forage', 'Rivière', 'Pluie', 'Irrigation']}
            onSelect={(value) => setFilters(prev => ({ ...prev, waterSource: value }))}
            filterKey="waterSource"
          />

          {/* Boutons d'action */}
          <HStack justifyContent="space-between" mt={4} space={3}>
            <Pressable 
              flex={1}
              bg="gray.200"
              py={2.5}
              borderRadius="lg"
              alignItems="center"
              _pressed={{ opacity: 0.8 }}
              onPress={() => setFilters({
                producer: '',
                region: '',
                culture: '',
                dateSemis: '',
                status: '',
                area: '',
                soilType: '',
                waterSource: ''
              })}
            >
              <Text fontSize="sm" fontWeight="medium" color="gray.600">
                Effacer
              </Text>
            </Pressable>
            <Pressable 
              flex={1}
              bg={theme.colors.primary?.[500] || '#3D944B'}
              py={2.5}
              borderRadius="lg"
              alignItems="center"
              _pressed={{ opacity: 0.8 }}
              onPress={() => setShowFilters(false)}
            >
              <Text fontSize="sm" fontWeight="medium" color="white">
                Appliquer
              </Text>
            </Pressable>
          </HStack>
        </Box>
        )}
        
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center" p={5}>
          <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text fontSize="sm" color="gray.600" mt={2.5}>
            Chargement des parcelles...
          </Text>
        </Box>
      ) : error ? (
        <Box flex={1} justifyContent="center" alignItems="center" p={5}>
          <Text fontSize="sm" color="red.500" textAlign="center">
            {error}
          </Text>
        </Box>
      ) : showMap ? (
          <MapComponent
            plots={filteredPlots}
            onPlotSelect={(plot) => router.push({ pathname: '/(tabs)/parcelles/[plotId]', params: { plotId: plot.id } })}
            selectedPlotId={params.focusPlotId && params.focusPlotId !== 'index' ? params.focusPlotId : undefined}
            centerLat={params.centerLat ? parseFloat(params.centerLat) : undefined}
            centerLng={params.centerLng ? parseFloat(params.centerLng) : undefined}
            zoom={params.zoom ? parseInt(params.zoom) : undefined}
          />
      ) : (
        <ScrollView 
          flex={1}
          p={2}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {filteredPlots.length > 0 ? (
            <Box
              flexDirection={isTablet ? 'row' : 'column'}
              flexWrap={isTablet ? 'wrap' : 'nowrap'}
              justifyContent={isTablet ? 'space-between' : 'flex-start'}
              px={isTablet ? 2 : 0}
            >
              {filteredPlots.map((item) => 
                <PlotCard 
                  key={item.id} 
                  item={item} 
                  agentId={user?.id}
                  isTablet={isTablet}
                  isSmallScreen={isSmallScreen}
        />
      )}
            </Box>
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center" p={5}> 
              <Text fontSize="md" color="gray.600" textAlign="center">
                Aucune parcelle trouvée.
              </Text>
            </Box>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
