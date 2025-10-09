import React from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FarmFilesServiceInstance } from '../../../../../../lib/services/domain/farmfiles';
import { ScreenContainer, Card, Button, Badge } from '../../../../../../components/ui';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable,
  useTheme,
  Center,
  Spinner
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

type Parcelle = {
  id: string;
  code: string;
  areaHa: number;
  variety?: string;
};

// Composant pour l'état vide
const EmptyState: React.FC<{ onAddParcel: () => void }> = ({ onAddParcel }) => {
  return (
    <Center flex={1} px={8}>
      <VStack space={6} alignItems="center">
        <Box
          bg="primary.100"
          borderRadius="full"
          p={6}
        >
          <Ionicons name="grid-outline" size={48} color="#3D944B" />
        </Box>
        
        <VStack space={3} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center">
            Aucune parcelle
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            Ajoutez votre première parcelle pour cette fiche.
          </Text>
        </VStack>
        
        <Button
          title="Ajouter une parcelle"
          variant="primary"
          onPress={onAddParcel}
          leftIcon={<Ionicons name="add" size={20} color="white" />}
        />
      </VStack>
    </Center>
  );
};

// Composant pour une carte de parcelle
const ParcelleCard: React.FC<{ 
  item: Parcelle; 
  onPress: () => void;
}> = ({ item, onPress }) => {
  const theme = useTheme();
  
  return (
    <Pressable onPress={onPress}>
      {({ isPressed }) => (
        <Card
          bg="white"
          p={4}
          mb={3}
          shadow={2}
          opacity={isPressed ? 0.8 : 1}
          transform={[{ scale: isPressed ? 0.98 : 1 }]}
        >
          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack flex={1} space={2}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                Parcelle {item.code}
              </Text>
              {item.variety && (
                <Text fontSize="sm" color="gray.600">
                  Variété: {item.variety}
                </Text>
              )}
            </VStack>
            
            <Badge
              colorScheme="primary"
              borderRadius="full"
              px={3}
              py={1}
            >
              <Text fontSize="xs" fontWeight="medium" color="white">
                ~ {item.areaHa} ha
              </Text>
            </Badge>
          </HStack>
        </Card>
      )}
    </Pressable>
  );
};

const ParcellesListScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [items, setItems] = React.useState<Parcelle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await FarmFilesServiceInstance.getFarmFilePlots(id);
        const mapped: Parcelle[] = (data || []).map((p: any) => ({
          id: p.id,
          code: p.name_season_snapshot,
          areaHa: p.area_hectares,
          variety: p.cotton_variety || undefined,
        }));
        setItems(mapped);
      } catch (error) {
        console.error('Erreur lors du chargement des parcelles:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleParcellePress = (item: Parcelle) => {
    router.push(`/(tabs)/parcelles/${item.id}`);
  };

  const handleAddParcel = () => {
    if (!id) return;
    router.push(`/(tabs)/collecte/fiches/${id}/parcelles/add`);
  };

  if (loading) {
    return (
      <ScreenContainer 
        title={`Parcelles - Fiche #${id}`}
        showBackButton={true}
        showSubHeader={true}
      >
        <Center flex={1}>
          <VStack space={4} alignItems="center">
            <Spinner size="lg" color={theme.colors.primary?.[500]} />
            <Text color="gray.600">Chargement des parcelles...</Text>
          </VStack>
        </Center>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title={`Parcelles - Fiche #${id}`}
      showBackButton={true}
      showSubHeader={true}
      subHeaderActions={
        <Button
          title="Ajouter"
          variant="primary"
          size="sm"
          onPress={handleAddParcel}
          leftIcon={<Ionicons name="add" size={16} color="white" />}
        />
      }
    >
      {/* Header avec statistiques */}
      <Box bg="white" px={4} py={3} borderBottomWidth={1} borderBottomColor="gray.200">
        <HStack justifyContent="space-between" alignItems="center">
          <VStack>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              Total parcelles
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="primary.500">
              {items.length}
            </Text>
          </VStack>
          <VStack alignItems="flex-end">
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              Surface totale
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">
              {items.reduce((total, item) => total + item.areaHa, 0).toFixed(1)} ha
            </Text>
          </VStack>
        </HStack>
      </Box>

      {/* Liste des parcelles ou état vide */}
      {items.length === 0 ? (
        <EmptyState onAddParcel={handleAddParcel} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ParcelleCard 
              item={item} 
              onPress={() => handleParcellePress(item)} 
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

export default ParcellesListScreen;