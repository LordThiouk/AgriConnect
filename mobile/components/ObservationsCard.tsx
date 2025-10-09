import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { ObservationDisplay } from '../lib/services/domain/observations/observations.types';
import { useLatestObservations } from '../lib/hooks/useObservations';
import { Feather } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  Badge,
  useTheme
} from 'native-base';

interface ObservationsCardProps {
  plotId: string;
  onSeeAll: () => void;
  enabled?: boolean;
}

export function ObservationsCard({ plotId, onSeeAll, enabled = true }: ObservationsCardProps) {
  const theme = useTheme();
  const { data, loading } = useLatestObservations(plotId, { enabled, refetchOnMount: true });
  const observations = (data as ObservationDisplay[]) || [];

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 1:
      case 2:
        return 'success';
      case 3:
        return 'warning';
      case 4:
      case 5:
        return 'error';
      default:
        return 'gray';
    }
  };

  const getSeverityText = (severity: number) => {
    switch (severity) {
      case 1:
        return 'Très faible';
      case 2:
        return 'Faible';
      case 3:
        return 'Modéré';
      case 4:
        return 'Élevé';
      case 5:
        return 'Très élevé';
      default:
        return 'Non défini';
    }
  };

  if (loading) {
    return (
      <Box bg="white" borderRadius="lg" p={4} shadow={1}>
        <HStack justifyContent="center" alignItems="center" py={8}>
          <ActivityIndicator size="small" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text ml={2} color="gray.600">Chargement des observations...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" p={4} shadow={1}>
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          Dernières Observations
        </Text>
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
      </HStack>

      {observations.length === 0 ? (
        <Box py={6} alignItems="center">
          <Feather name="eye" size={32} color={theme.colors.gray?.[400] || '#9ca3af'} />
          <Text color="gray.500" mt={2} textAlign="center">
            Aucune observation enregistrée
          </Text>
        </Box>
      ) : (
        <VStack space={3}>
          {observations.slice(0, 3).map((observation) => (
            <Box
              key={observation.id}
              bg="gray.50"
              borderRadius="md"
              p={3}
              borderLeftWidth={3}
              borderLeftColor={`${getSeverityColor(observation.severity || 1)}.500`}
            >
              <HStack justifyContent="space-between" alignItems="flex-start" mb={2}>
                <VStack flex={1} space={1}>
                  <Text fontSize="md" fontWeight="medium" color="gray.800" numberOfLines={1}>
                    {observation.title}
                  </Text>
                  <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                    {observation.description}
                  </Text>
                </VStack>
                <Badge
                  colorScheme={getSeverityColor(observation.severity || 1)}
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    {getSeverityText(observation.severity || 1)}
                  </Text>
                </Badge>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="xs" color="gray.500">
                  {observation.date}
                </Text>
                {observation.has_photos && (
                  <HStack alignItems="center" space={1}>
                    <Feather name="camera" size={12} color={theme.colors.primary?.[500] || '#3D944B'} />
                    <Text fontSize="xs" color="primary.500">
                      Photo
                    </Text>
                  </HStack>
                )}
              </HStack>
            </Box>
          ))}

          {observations.length > 3 && (
            <Pressable
              onPress={onSeeAll}
              bg="primary.50"
              borderRadius="md"
              p={3}
              _pressed={{ bg: 'primary.100' }}
            >
              <Text color="primary.600" textAlign="center" fontWeight="medium">
                +{observations.length - 3} autres observations
              </Text>
            </Pressable>
          )}
        </VStack>
      )}
    </Box>
  );
}

export default ObservationsCard;