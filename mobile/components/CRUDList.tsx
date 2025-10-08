import React from 'react';
import {
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  IconButton,
  Button,
  Badge,
  useTheme
} from 'native-base';
import { EmptyState } from './ui/EmptyState';

interface CRUDItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
  type?: string;
}

interface CRUDListProps {
  title: string;
  items: CRUDItem[];
  onEdit?: (item: CRUDItem) => void;
  onDelete?: (item: CRUDItem) => void;
  onView?: (item: CRUDItem) => void;
  addButtonText?: string;
  addButtonRoute?: string;
  emptyMessage?: string;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
}

export function CRUDList({
  title,
  items,
  onEdit,
  onDelete,
  onView,
  addButtonText = "Ajouter",
  addButtonRoute,
  emptyMessage = "Aucun élément trouvé",
  getStatusColor,
  getStatusText,
}: CRUDListProps) {
  const theme = useTheme();

  const handleDelete = (item: CRUDItem) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => onDelete?.(item)
        }
      ]
    );
  };

  const handleAdd = () => {
    if (addButtonRoute) {
      router.push(addButtonRoute);
    }
  };

  const renderItem = ({ item }: { item: CRUDItem }) => (
    <Box
      bg="white"
      borderRadius="lg"
      p={4}
      mb={3}
      shadow={1}
      borderWidth={1}
      borderColor="gray.100"
    >
      <VStack space={2}>
        <HStack justifyContent="space-between" alignItems="flex-start">
          <VStack flex={1} space={1}>
            <Text fontSize="md" fontWeight="medium" color="gray.800" numberOfLines={2}>
              {item.title}
            </Text>
            {item.status && getStatusColor && getStatusText && (
              <Badge
                colorScheme={getStatusColor(item.status)}
                borderRadius="full"
                px={2}
                py={1}
                alignSelf="flex-start"
              >
                <Text fontSize="xs" fontWeight="medium" color="white">
                  {getStatusText(item.status)}
                </Text>
              </Badge>
            )}
          </VStack>
        </HStack>

        {item.subtitle && (
          <Text 
            fontSize="sm" 
            color="gray.600" 
            mb={2} 
            lineHeight={20}
            numberOfLines={2}
          >
            {item.subtitle}
          </Text>
        )}
        
        <HStack justifyContent="space-between" alignItems="center">
          {item.date && (
            <Text fontSize="xs" color="gray.500">
              {item.date}
            </Text>
          )}
          
          <HStack space={1}>
            {onView && (
              <IconButton
                icon={<Ionicons name="eye" size={16} color={theme.colors.blue?.[500] || '#007bff'} />}
                onPress={() => onView(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
            
            {onEdit && (
              <IconButton
                icon={<Ionicons name="create" size={16} color={theme.colors.green?.[500] || '#28a745'} />}
                onPress={() => onEdit(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
            
            {onDelete && (
              <IconButton
                icon={<Ionicons name="trash" size={16} color={theme.colors.red?.[500] || '#dc3545'} />}
                onPress={() => handleDelete(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );

  return (
    <VStack flex={1} bg="gray.50">
      {/* Header */}
      <HStack justifyContent="space-between" alignItems="center" px={4} py={3} bg="white" borderBottomWidth={1} borderBottomColor="gray.200">
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          {title}
        </Text>
        {addButtonRoute && (
          <Button
            size="sm"
            bg="primary.500"
            _pressed={{ bg: 'primary.600' }}
            onPress={handleAdd}
            leftIcon={<Ionicons name="add" size={16} color="white" />}
          >
            <Text color="white" fontWeight="medium">
              {addButtonText}
            </Text>
          </Button>
        )}
      </HStack>

      {/* List */}
      {items.length === 0 ? (
        <EmptyState 
          title="Aucun élément"
          description={emptyMessage}
          icon="list"
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </VStack>
  );
}

export default CRUDList;