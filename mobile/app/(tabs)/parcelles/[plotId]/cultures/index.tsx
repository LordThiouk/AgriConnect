import React from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCrops } from '../../../../../lib/hooks';
import { Crop } from '../../../../../types/collecte';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../../../../../components/ui';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Pressable, 
  Badge, 
  useTheme,
  ScrollView
} from 'native-base';

export default function CulturesScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const theme = useTheme();

  console.log('🌾 [CULTURES] Écran des cultures initialisé:', { plotId });

  // Utiliser le hook pour récupérer les cultures
  const { crops, loading, error, refetch } = useCrops(plotId!);

  console.log('🌾 [CULTURES] État des hooks:', { 
    plotId, 
    cropsCount: crops?.length || 0, 
    loading, 
    error: error?.message 
  });

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/cultures/add`);
  };

  const handleEdit = (item: Crop) => {
    router.push(`/(tabs)/parcelles/${plotId}/cultures/${item.id}/edit`);
  };

  const handleRefresh = async () => {
    console.log('🌾 [CULTURES] Rafraîchissement des cultures');
    await refetch();
  };

  const handleDelete = (item: Crop) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la culture ${item.crop_type} - ${item.variety} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🌾 [CULTURES] Suppression de la culture:', { cropId: item.id, plotId });
              // TODO: Utiliser useDeleteCrop hook
              // await deleteCrop(item.id);
              await refetch();
              Alert.alert('Succès', 'Culture supprimée avec succès');
            } catch (error) {
              console.error('❌ [CULTURES] Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la culture');
            }
          },
        },
      ]
    );
  };

  const getStatusColorScheme = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'en_cours':
        return 'info';
      case 'termine':
        return 'success';
      case 'abandonne':
        return 'error';
      case 'planifie':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'abandonne':
        return 'Abandonné';
      case 'planifie':
        return 'Planifié';
      default:
        return 'Inconnu';
    }
  };

  const renderCropItem = (item: Crop) => {
    const statusColorScheme = getStatusColorScheme(item.status);
    const statusText = getStatusText(item.status);

    return (
      <Box
        bg="white"
        mx={4}
        my={2}
        p={4}
        borderRadius="lg"
        borderWidth={1}
        borderColor="gray.200"
        shadow={1}
      >
        <HStack alignItems="center" justifyContent="space-between">
          <HStack alignItems="center" space={3} flex={1}>
            <Box
              w={10}
              h={10}
              borderRadius="full"
              bg="primary.100"
              alignItems="center"
              justifyContent="center"
            >
              <Feather name="layers" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
            </Box>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="semibold" color="gray.800" numberOfLines={1}>
                {item.crop_type} - {item.variety}
              </Text>
              <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                Semis: {item.sowing_date ? new Date(item.sowing_date).toLocaleDateString('fr-FR') : 'N/A'} | 
                Récolte: {item.expected_harvest_date ? new Date(item.expected_harvest_date).toLocaleDateString('fr-FR') : 'N/A'}
              </Text>
              <HStack alignItems="center" space={2} mt={1}>
                <Badge colorScheme={statusColorScheme} borderRadius="full" px={2} py={1}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    {statusText}
                  </Text>
                </Badge>
                {item.actual_yield_kg && (
                  <Text fontSize="xs" color="gray.500" fontStyle="italic">
                    {item.actual_yield_kg} kg/ha
                  </Text>
                )}
              </HStack>
            </VStack>
          </HStack>
          <HStack space={2}>
            <Pressable
              onPress={() => handleEdit(item)}
              p={2}
              borderRadius="md"
              bg="blue.50"
              _pressed={{ bg: 'blue.100' }}
            >
              <Feather name="edit" size={16} color={theme.colors.blue?.[500] || '#3B82F6'} />
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              p={2}
              borderRadius="md"
              bg="red.50"
              _pressed={{ bg: 'red.100' }}
            >
              <Feather name="trash-2" size={16} color={theme.colors.red?.[500] || '#E53935'} />
            </Pressable>
          </HStack>
        </HStack>
      </Box>
    );
  };

  if (loading) {
    return (
      <ScreenContainer 
        title="Cultures"
        showSubHeader={true}
        showBackButton={true}
        animationEnabled={true}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text mt={4} fontSize="md" color="gray.600">Chargement...</Text>
        </Box>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer 
        title="Cultures"
        showSubHeader={true}
        showBackButton={true}
        animationEnabled={true}
      >
        <Box flex={1} justifyContent="center" alignItems="center" px={4}>
          <Feather name="alert-circle" size={48} color={theme.colors.error?.[500] || '#EF4444'} />
          <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.800" textAlign="center">
            Erreur de chargement
          </Text>
          <Text mt={2} fontSize="sm" color="gray.600" textAlign="center">
            {error.message}
          </Text>
          <TouchableOpacity 
            onPress={handleRefresh}
            style={{ 
              marginTop: 16, 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              backgroundColor: theme.colors.primary?.[500] || '#3D944B',
              borderRadius: 8
            }}
          >
            <Text color="white" fontWeight="medium">Réessayer</Text>
          </TouchableOpacity>
        </Box>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title="Cultures"
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <TouchableOpacity onPress={handleAdd} style={{ padding: 8 }}>
          <Feather name="plus" size={24} color={theme.colors.primary?.[500] || '#3D944B'} />
        </TouchableOpacity>
      }
      animationEnabled={true}
    >
      <ScrollView flex={1} bg="gray.50">
        {crops.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" py={20}>
            <Feather name="layers" size={48} color={theme.colors.gray?.[400] || '#9CA3AF'} />
            <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.600">
              Aucune culture trouvée
            </Text>
            <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
              Ajoutez votre première culture pour commencer
            </Text>
          </Box>
        ) : (
          <VStack space={2} py={4}>
            {crops.map((crop: Crop) => renderCropItem(crop))}
          </VStack>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

