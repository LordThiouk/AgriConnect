import React from 'react';
import { Box, Text, HStack, VStack, Pressable, Badge } from 'native-base';
import { ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionCardProps {
  title: string;
  icon: string;
  onSeeAll: () => void;
  data: any[];
  loading?: boolean;
  error?: string | null;
  renderItem?: (item: any) => React.ReactNode;
  maxItems?: number;
  onAdd?: () => void;
  addButtonText?: string;
}

export function SectionCard({ 
  title, 
  icon, 
  onSeeAll, 
  data, 
  loading = false, 
  error = null,
  renderItem,
  maxItems = 3,
  onAdd,
  addButtonText
}: SectionCardProps) {
  
  if (loading) {
    return (
      <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
        <HStack space={3} alignItems="center">
          <ActivityIndicator size="small" color="#3D944B" />
          <Text color="gray.600">Chargement de {title.toLowerCase()}...</Text>
        </HStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
        <HStack space={3} alignItems="center">
          <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          <Text color="red.500">Erreur: {error}</Text>
        </HStack>
      </Box>
    );
  }

  const displayData = data?.slice(0, maxItems) || [];
  const hasMore = data && data.length > maxItems;

  return (
    <Box bg="white" borderRadius="xl" p={4} mb={4} shadow={2}>
        <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <HStack space={2} alignItems="center">
          <Ionicons name={icon as any} size={20} color="#3D944B" />
          <Text fontSize="lg" fontWeight="bold" color="gray.900">
            {title}
          </Text>
          {data && data.length > 0 && (
            <Badge bg="primary.100" _text={{ color: 'primary.800' }} px={2} py={1} borderRadius="md">
              {data.length}
            </Badge>
          )}
        </HStack>
        <HStack space={2}>
          {/* Logique des boutons : Ajouter si vide, Voir tout si contient des données */}
          {displayData.length === 0 && onAdd ? (
            <Pressable
              onPress={onAdd}
              bg="success.500"
              px={3}
              py={1}
              borderRadius="md"
            >
              <HStack space={1} alignItems="center">
                <Ionicons name="add" size={16} color="white" />
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {addButtonText || 'Ajouter'}
                </Text>
              </HStack>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSeeAll}
              bg="primary.500"
              px={3}
              py={1}
              borderRadius="md"
            >
              <Text color="white" fontSize="sm" fontWeight="medium">
                Voir tout
              </Text>
            </Pressable>
          )}
        </HStack>
      </HStack>

      {displayData.length > 0 ? (
        <VStack space={3}>
          {displayData.map((item, index) => (
            <Box key={item.id || index} bg="gray.50" borderRadius="lg" p={3}>
              {renderItem ? renderItem(item) : (
                <VStack space={1}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                    {item.title || item.name || `${title} ${index + 1}`}
                  </Text>
                  <Text fontSize="xs" color="gray.600" numberOfLines={2}>
                    {item.description || item.subtitle || 'Aucune description'}
                  </Text>
                  {item.date && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </VStack>
              )}
            </Box>
          ))}
          {hasMore && (
            <Text fontSize="xs" color="primary.500" textAlign="center" mt={2}>
              +{data.length - maxItems} autres {title.toLowerCase()}
            </Text>
          )}
        </VStack>
      ) : (
        <VStack space={3} alignItems="center" py={4}>
          <Ionicons name={`${icon}-outline` as any} size={32} color="#9ca3af" />
          <Text color="gray.500" textAlign="center">
            Aucun {title.toLowerCase()} disponible
          </Text>
          {onAdd ? (
            <Pressable
              onPress={onAdd}
              bg="success.500"
              px={4}
              py={2}
              borderRadius="md"
            >
              <HStack space={2} alignItems="center">
                <Ionicons name="add" size={18} color="white" />
                <Text color="white" fontSize="sm" fontWeight="medium">
                  {addButtonText || `Ajouter le premier ${title.toLowerCase()}`}
                </Text>
              </HStack>
            </Pressable>
          ) : (
            <Pressable
              onPress={onSeeAll}
              bg="primary.500"
              px={4}
              py={2}
              borderRadius="md"
            >
              <Text color="white" fontSize="sm" fontWeight="medium">
                Ajouter le premier {title.toLowerCase()}
              </Text>
            </Pressable>
          )}
        </VStack>
      )}
    </Box>
  );
}
