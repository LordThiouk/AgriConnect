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
  Spinner,
  useTheme
} from 'native-base';
import { EmptyState } from './ui/EmptyState';
import { ScreenContainer } from './ui';

interface CRUDItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
  type?: string;
  rightAccessory?: React.ReactNode;
  leftAccessory?: React.ReactNode;
}

interface CRUDListProps {
  title: string;
  subtitle?: string;
  items: CRUDItem[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (item: CRUDItem) => void;
  onDelete?: (item: CRUDItem) => void;
  onView?: (item: CRUDItem) => void;
  onRefresh?: () => void;
  onRetry?: () => void;
  addButtonText?: string;
  addButtonRoute?: string;
  emptyMessage?: string;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
  emptyState?: {
    icon: string;
    title: string;
    subtitle: string;
    action?: {
      label: string;
      onPress: () => void;
    };
  };
  errorState?: {
    icon: string;
    title: string;
    subtitle: string;
    retryAction?: {
      label: string;
      onPress: () => void;
    };
  };
  headerActions?: React.ReactNode;
}

export function CRUDList({
  title,
  subtitle,
  items,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  onRetry,
  addButtonText = "Ajouter",
  addButtonRoute,
  emptyMessage = "Aucun élément trouvé",
  getStatusColor,
  getStatusText,
  emptyState,
  errorState,
  headerActions,
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
      borderRadius="xl"
      p={4}
      mb={3}
      shadow={1}
      borderWidth={1}
      borderColor="gray.100"
    >
      <VStack space={3}>
        <HStack space={3} alignItems="center">
          {item.leftAccessory}
          <VStack flex={1} space={1}>
            <Text fontSize="md" fontWeight="semibold" color="gray.900" numberOfLines={2}>
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
                <Text fontSize="xs" fontWeight="bold" color="white">
                  {getStatusText(item.status)}
                </Text>
              </Badge>
            )}
            {item.subtitle && (
              <Text 
                fontSize="sm" 
                color="gray.600" 
                lineHeight={20}
                numberOfLines={2}
              >
                {item.subtitle}
              </Text>
            )}
          </VStack>
          {item.rightAccessory}
        </HStack>

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

  // Prepare header actions (right side), including optional add button
  const headerRight = (
    <HStack space={2} alignItems="center">
      {headerActions}
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
  );

  // Loading State
  if (loading) {
    return (
      <ScreenContainer 
        title={title}
        showSubHeader={true}
        showBackButton={true}
        subHeaderActions={headerRight}
        animationEnabled={true}
        contentScrollable={false}
      >
        <VStack flex={1} justifyContent="center" alignItems="center" space={4}>
          <Spinner size="lg" color="primary.500" />
          <Text color="gray.600" fontSize="md">Chargement...</Text>
        </VStack>
      </ScreenContainer>
    );
  }

  // Error State
  if (error) {
    return (
      <ScreenContainer 
        title={title}
        showSubHeader={true}
        showBackButton={true}
        subHeaderActions={headerRight}
        animationEnabled={true}
        contentScrollable={false}
      >
        <VStack flex={1} justifyContent="center" alignItems="center" space={4} p={8}>
          <Box bg="error.100" borderRadius="full" p={4} alignItems="center" justifyContent="center">
            <Ionicons name="alert-circle" size={48} color={theme.colors.error?.[500] || '#ef4444'} />
          </Box>
          <VStack space={2} alignItems="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.800" textAlign="center">
              {errorState?.title || "Erreur de chargement"}
            </Text>
            <Text fontSize="md" color="gray.600" textAlign="center" maxW="300px">
              {errorState?.subtitle || error}
            </Text>
          </VStack>
          {onRetry && (
            <Button variant="outline" colorScheme="error" onPress={onRetry} leftIcon={<Ionicons name="refresh" size={16} />}>
              {errorState?.retryAction?.label || "Réessayer"}
            </Button>
          )}
        </VStack>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer 
      title={title}
      showSubHeader={true}
      showBackButton={true}
      subHeaderActions={headerRight}
      animationEnabled={true}
      contentScrollable={false}
    >
      {items.length === 0 ? (
        <EmptyState 
          title={emptyState?.title || "Aucun élément"}
          description={emptyState?.subtitle || emptyMessage}
          icon={emptyState?.icon as any || "list"}
          actionLabel={emptyState?.action?.label}
          onAction={emptyState?.action?.onPress}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={onRefresh}
        />
      )}
    </ScreenContainer>
  );
}

export default CRUDList;