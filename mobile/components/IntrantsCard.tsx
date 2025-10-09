import React from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLatestInputs } from '../lib/hooks/useInputs';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  Badge,
  useTheme
} from 'native-base';

interface IntrantsCardProps {
  plotId: string;
  onSeeAll?: () => void;
  enabled?: boolean;
}

export function IntrantsCard({ plotId, onSeeAll, enabled = true }: IntrantsCardProps) {
  const theme = useTheme();
  const { data, loading } = useLatestInputs(plotId, { enabled, refetchOnMount: true });
  const intrants = (data as any[]) || [];

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/intrants/add`);
  };

  const handleEdit = (intrant: any) => {
    router.push(`/parcelles/${plotId}/intrants/${intrant.id}/edit`);
  };

  const handleDelete = async (_intrant: any) => {
    // TODO: Use delete hook and invalidate cache externally if needed
  };

  const getIntrantColor = (category: string) => {
    const colors: { [key: string]: string } = {
      engrais: 'success',
      pesticide: 'error',
      herbicide: 'warning',
      fongicide: 'info',
      insecticide: 'error',
      fertilisant: 'success',
      semence: 'primary',
      autre: 'gray',
    };
    return colors[category] || 'gray';
  };

  const getIntrantIcon = (category: string) => {
    const icons: { [key: string]: keyof typeof Feather.glyphMap } = {
      engrais: 'package',
      pesticide: 'shield',
      herbicide: 'droplet',
      fongicide: 'shield',
      insecticide: 'zap',
      fertilisant: 'package',
      semence: 'circle',
      autre: 'package',
    };
    return icons[category] || 'package';
  };

  const renderIntrant = ({ item }: { item: any }) => (
    <Box
      bg="gray.50"
      borderRadius="md"
      p={3}
      mb={3}
      borderLeftWidth={3}
      borderLeftColor={`${getIntrantColor(item.category)}.500`}
    >
      <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
        <HStack alignItems="center" space={2} flex={1}>
          <Box
            bg={`${getIntrantColor(item.category)}.100`}
            borderRadius="full"
            p={2}
          >
            <Feather 
              name={getIntrantIcon(item.category)} 
              size={16} 
              color={(theme.colors as any)[getIntrantColor(item.category)]?.[500] || '#6c757d'} 
            />
          </Box>
          <VStack flex={1} space={1}>
            <Text fontSize="md" fontWeight="medium" color="gray.800" numberOfLines={1}>
              {item.name || 'Intrant'}
            </Text>
            <Text fontSize="sm" color="gray.600" numberOfLines={1}>
              {item.quantity && `${item.quantity} ${item.unit || ''}`}
              {item.cost && ` - ${item.cost} FCFA`}
            </Text>
          </VStack>
        </HStack>
        
        <HStack space={1}>
          <Pressable
            onPress={() => handleEdit(item)}
            p={1}
            borderRadius="sm"
            _pressed={{ bg: 'gray.200' }}
          >
            <Feather name="edit" size={14} color={theme.colors.primary?.[500] || '#3D944B'} />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            p={1}
            borderRadius="sm"
            _pressed={{ bg: 'gray.200' }}
          >
            <Feather name="trash-2" size={14} color={theme.colors.red?.[500] || '#dc3545'} />
          </Pressable>
        </HStack>
      </HStack>

      <HStack justifyContent="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">
          {item.date}
        </Text>
        <Badge
          colorScheme={getIntrantColor(item.category)}
          borderRadius="sm"
          px={2}
          py={0.5}
        >
          <Text fontSize="2xs" fontWeight="medium" color="white">
            {item.category}
          </Text>
        </Badge>
      </HStack>
    </Box>
  );

  if (loading) {
    return (
      <Box bg="white" borderRadius="lg" p={4} shadow={1}>
        <HStack justifyContent="center" alignItems="center" py={8}>
          <ActivityIndicator size="small" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text ml={2} color="gray.600">Chargement des intrants...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" p={4} shadow={1}>
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Intrants
        </Text>
        <HStack space={2}>
          {onSeeAll && (
            <Pressable
              onPress={onSeeAll}
              _pressed={{ opacity: 0.7 }}
            >
              <HStack alignItems="center" space={1}>
                <Text fontSize="sm" color="primary.500" fontWeight="medium">
                  Voir tout
                </Text>
                <Feather name="arrow-right" size={16} color={theme.colors.primary?.[500] || '#3D944B'} />
              </HStack>
            </Pressable>
          )}
          <Pressable
            onPress={handleAdd}
            bg="primary.500"
            borderRadius="full"
            p={2}
            _pressed={{ bg: 'primary.600' }}
          >
            <Feather name="plus" size={16} color="white" />
          </Pressable>
        </HStack>
      </HStack>

      {intrants.length === 0 ? (
        <Box py={6} alignItems="center">
          <Feather name="package" size={32} color={theme.colors.gray?.[400] || '#9ca3af'} />
          <Text color="gray.500" mt={2} textAlign="center">
            Aucun intrant enregistré
          </Text>
          <Pressable
            onPress={handleAdd}
            mt={4}
            bg="primary.500"
            borderRadius="md"
            px={4}
            py={2}
            _pressed={{ bg: 'primary.600' }}
          >
            <Text color="white" fontWeight="medium">
              Ajouter un intrant
            </Text>
          </Pressable>
        </Box>
      ) : (
        <VStack space={2}>
          {intrants.slice(0, 5).map((intrant) => renderIntrant({ item: intrant }))}
        </VStack>
      )}
    </Box>
  );
}

export default IntrantsCard;