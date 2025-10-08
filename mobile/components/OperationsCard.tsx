import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CollecteService } from '../lib/services/collecte';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  Badge,
  useTheme
} from 'native-base';

interface OperationsCardProps {
  plotId: string;
  onSeeAll?: () => void;
}

export function OperationsCard({ plotId, onSeeAll }: OperationsCardProps) {
  const theme = useTheme();
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperations();
  }, [plotId]);

  const loadOperations = async () => {
    try {
      setLoading(true);
      const data = await CollecteService.getLatestOperations(plotId);
      setOperations(data);
    } catch (error) {
      console.error('Erreur lors du chargement des opérations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/operations/add`);
  };

  const handleEdit = (operation: any) => {
    router.push(`/parcelles/${plotId}/operations/${operation.id}/edit`);
  };

  const handleDelete = async (operation: any) => {
    try {
      await CollecteService.deleteOperation(operation.id);
      await loadOperations();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getOperationColor = (type: string) => {
    const colors: { [key: string]: string } = {
      semis: 'success',
      fertilisation: 'info',
      irrigation: 'primary',
      desherbage: 'warning',
      traitement_phytosanitaire: 'error',
      recolte: 'purple',
      labour: 'gray',
      autre: 'gray',
    };
    return colors[type] || 'gray';
  };

  const getOperationIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      semis: 'seedling',
      fertilisation: 'droplet',
      irrigation: 'droplet',
      desherbage: 'scissors',
      traitement_phytosanitaire: 'shield',
      recolte: 'package',
      labour: 'tractor',
      autre: 'settings',
    };
    return icons[type] || 'settings';
  };

  const renderOperation = ({ item }: { item: any }) => (
    <Box
      bg="gray.50"
      borderRadius="md"
      p={3}
      mb={3}
      borderLeftWidth={3}
      borderLeftColor={`${getOperationColor(item.type)}.500`}
    >
      <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
        <HStack alignItems="center" space={2} flex={1}>
          <Box
            bg={`${getOperationColor(item.type)}.100`}
            borderRadius="full"
            p={2}
          >
            <Feather 
              name={getOperationIcon(item.type)} 
              size={16} 
              color={theme.colors[getOperationColor(item.type)]?.[500] || '#6c757d'} 
            />
          </Box>
          <VStack flex={1} space={1}>
            <Text fontSize="md" fontWeight="medium" color="gray.800" numberOfLines={1}>
              {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Opération'}
            </Text>
            {item.product && (
              <Text fontSize="sm" color="gray.600" numberOfLines={1}>
                {item.product}
                {item.quantity && ` (${item.quantity}${item.unit || ''})`}
              </Text>
            )}
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
          colorScheme={getOperationColor(item.type)}
          borderRadius="sm"
          px={2}
          py={0.5}
        >
          <Text fontSize="2xs" fontWeight="medium" color="white">
            {item.type}
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
          <Text ml={2} color="gray.600">Chargement des opérations...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" p={4} shadow={1}>
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Opérations
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

      {operations.length === 0 ? (
        <Box py={6} alignItems="center">
          <Feather name="settings" size={32} color={theme.colors.gray?.[400] || '#9ca3af'} />
          <Text color="gray.500" mt={2} textAlign="center">
            Aucune opération enregistrée
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
              Ajouter une opération
            </Text>
          </Pressable>
        </Box>
      ) : (
        <VStack space={2}>
          {operations.slice(0, 5).map((operation) => renderOperation({ item: operation }))}
        </VStack>
      )}
    </Box>
  );
}

export default OperationsCard;