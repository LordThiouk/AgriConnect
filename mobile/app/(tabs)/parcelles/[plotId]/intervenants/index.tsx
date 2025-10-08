import React, { useState, useCallback } from 'react';
import { Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { CollecteService } from '../../../../../lib/services/collecte';
import { ParticipantDisplay } from '../../../../../types/collecte';
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

export default function IntervenantsScreen() {
  const { plotId } = useLocalSearchParams<{ plotId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const [participants, setParticipants] = useState<ParticipantDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipants = useCallback(async () => {
    if (!plotId) return;
    try {
      setLoading(true);
      const data = await CollecteService.getParticipantsByPlotId(plotId);
      setParticipants(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de charger les intervenants.');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [loadParticipants])
  );

  const handleAdd = () => {
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/add`);
  };

  const handleDelete = (participantId: string) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet intervenant ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await CollecteService.deleteParticipant(participantId);
              loadParticipants(); // Refresh list
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'La suppression a échoué.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (participant: ParticipantDisplay) => {
    router.push(`/(tabs)/parcelles/${plotId}/intervenants/${participant.id}/edit`);
  };

  const renderParticipantItem = (item: ParticipantDisplay) => {
    const getRoleColorScheme = (role: string) => {
      switch (role?.toLowerCase()) {
        case 'producteur':
          return 'success';
        case 'agent':
          return 'info';
        case 'ouvrier':
          return 'warning';
        case 'superviseur':
          return 'purple';
        default:
          return 'gray';
      }
    };

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
              <Feather name="user" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />
            </Box>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="semibold" color="gray.800" numberOfLines={1}>
                {item.name}
              </Text>
              <HStack alignItems="center" space={2} mt={1}>
                <Badge colorScheme={getRoleColorScheme(item.role)} borderRadius="full" px={2} py={1}>
                  <Text fontSize="xs" fontWeight="medium" color="white">
                    {item.role}
                  </Text>
                </Badge>
                {item.age && (
                  <Text fontSize="xs" color="gray.500">
                    {item.age} ans
                  </Text>
                )}
              </HStack>
              {item.tags && item.tags.length > 0 && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic" mt={1}>
                  {item.tags.join(', ')}
                </Text>
              )}
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
              onPress={() => handleDelete(item.id)}
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

  return (
    <ScreenContainer 
      title="Intervenants"
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={
        <TouchableOpacity onPress={handleAdd} style={{ padding: 8 }}>
          <Feather name="plus" size={24} color={theme.colors.primary?.[500] || '#3D944B'} />
        </TouchableOpacity>
      }
      animationEnabled={true}
    >
      {loading ? (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text mt={4} fontSize="md" color="gray.600">Chargement...</Text>
        </Box>
      ) : (
        <ScrollView flex={1} bg="gray.50">
          {participants.length === 0 ? (
            <Box flex={1} justifyContent="center" alignItems="center" py={20}>
              <Feather name="users" size={48} color={theme.colors.gray?.[400] || '#9CA3AF'} />
              <Text mt={4} fontSize="lg" fontWeight="medium" color="gray.600">
                Aucun intervenant enregistré
              </Text>
              <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                Ajoutez votre premier intervenant pour commencer
              </Text>
            </Box>
          ) : (
            <VStack space={2} py={4}>
              {participants.map((participant) => renderParticipantItem(participant))}
            </VStack>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

