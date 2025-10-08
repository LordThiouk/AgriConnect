import React from 'react';
import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { OfflineQueueService } from '../../../../lib/services/offlineQueue';
import { ScreenContainer, Card, Badge, Button } from '../../../../components/ui';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable,
  useTheme,
  Divider,
  Spinner,
  Center
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

type FicheItem = {
  id: string;
  name: string;
  status: 'draft' | 'validated';
  updatedAt: string;
};

const mockData: FicheItem[] = [];

// Composant pour l'état vide
const EmptyState: React.FC = () => {
  const router = useRouter();
  
  return (
    <Center flex={1} px={8}>
      <VStack space={6} alignItems="center">
        <Box
          bg="primary.100"
          borderRadius="full"
          p={6}
        >
          <Ionicons name="document-outline" size={48} color="#3D944B" />
        </Box>
        
        <VStack space={3} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800" textAlign="center">
            Aucune fiche
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center">
            Créez votre première fiche d'exploitation pour commencer.
          </Text>
        </VStack>
        
        <Button
          title="Créer une fiche"
          variant="primary"
          onPress={() => router.push('/(tabs)/collecte/fiches/create')}
          leftIcon={<Ionicons name="add" size={20} color="white" />}
        />
      </VStack>
    </Center>
  );
};

// Composant pour une carte de fiche
const FicheCard: React.FC<{ 
  item: FicheItem; 
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
                {item.name}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Mis à jour: {item.updatedAt}
              </Text>
            </VStack>
            
            <Badge
              colorScheme={item.status === 'validated' ? 'success' : 'warning'}
              borderRadius="full"
              px={3}
              py={1}
            >
              <Text fontSize="xs" fontWeight="medium" color="white">
                {item.status === 'validated' ? 'Validée' : 'Brouillon'}
              </Text>
            </Badge>
          </HStack>
        </Card>
      )}
    </Pressable>
  );
};

// Composant pour l'indicateur de synchronisation
const SyncIndicator: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <Badge
      colorScheme="warning"
      borderRadius="full"
      px={3}
      py={1}
      position="absolute"
      top={-8}
      right={-8}
      zIndex={1}
    >
      <HStack alignItems="center" space={1}>
        <Ionicons name="sync" size={12} color="white" />
        <Text fontSize="xs" fontWeight="medium" color="white">
          {count}
        </Text>
      </HStack>
    </Badge>
  );
};

const FichesIndexScreen: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const update = () => setPendingCount(
      OfflineQueueService.list().filter(i => i.status === 'pending').length
    );
    update();
    const id = setInterval(update, 3000);
    return () => clearInterval(id);
  }, []);

  const handleFichePress = (item: FicheItem) => {
    router.push(`/(tabs)/collecte/fiches/${item.id}`);
  };

  const handleCreateFiche = () => {
    router.push('/(tabs)/collecte/fiches/create');
  };

  return (
    <ScreenContainer 
      title="Mes Fiches d'exploitation"
      showSubHeader={false}
      showBackButton={false}
      contentPadding={4}
    >
      {/* Header avec bouton d'action */}
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <VStack flex={1}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Mes Fiches d'exploitation
          </Text>
          {pendingCount > 0 && (
            <HStack alignItems="center" space={2} mt={1}>
              <Ionicons name="sync" size={16} color={theme.colors.warning?.[500]} />
              <Text fontSize="sm" color="warning.600">
                À synchroniser: {pendingCount}
              </Text>
            </HStack>
          )}
        </VStack>
        
        <Button
          title="Nouvelle fiche"
          variant="primary"
          size="sm"
          onPress={handleCreateFiche}
          leftIcon={<Ionicons name="add" size={16} color="white" />}
        />
      </HStack>

      {/* Liste des fiches ou état vide */}
      {mockData.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={mockData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Box position="relative">
              <FicheCard 
                item={item} 
                onPress={() => handleFichePress(item)} 
              />
              <SyncIndicator count={pendingCount} />
            </Box>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
};

export default FichesIndexScreen;