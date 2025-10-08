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
import { EmptyState } from '../EmptyState';

interface CRUDItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
  type?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface CRUDListProps {
  title: string;
  items: CRUDItem[];
  loading?: boolean;
  onEdit?: (item: CRUDItem) => void;
  onDelete?: (item: CRUDItem) => void;
  onView?: (item: CRUDItem) => void;
  onAdd?: () => void;
  onRefresh?: () => void;
  addButtonText?: string;
  addButtonRoute?: string;
  emptyMessage?: string;
  getStatusColor?: (status: string) => string;
  getStatusText?: (status: string) => string;
  showActions?: boolean;
  showAddButton?: boolean;
  showRefreshButton?: boolean;
  variant?: 'default' | 'compact' | 'card';
  itemHeight?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

const CRUDList: React.FC<CRUDListProps> = ({
  title,
  items,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onAdd,
  onRefresh,
  addButtonText = "Ajouter",
  addButtonRoute,
  emptyMessage = "Aucun élément trouvé",
  getStatusColor,
  getStatusText,
  showActions = true,
  showAddButton = true,
  showRefreshButton = false,
  variant = 'default',
  itemHeight = 80,
  onEndReached,
  onEndReachedThreshold = 0.5,
}) => {
  const theme = useTheme();
  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    } else if (addButtonRoute) {
      router.push(addButtonRoute);
    }
  };

  const handleDelete = (item: CRUDItem) => {
    if (onDelete) {
      Alert.alert(
        'Confirmer la suppression',
        `Êtes-vous sûr de vouloir supprimer "${item.title}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Supprimer', 
            style: 'destructive',
            onPress: () => onDelete(item)
          }
        ]
      );
    }
  };

  const getItemVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          padding: 3,
          minHeight: 60,
          borderRadius: 'md',
        };
      case 'card':
        return {
          padding: 4,
          minHeight: 100,
          borderRadius: 'lg',
          shadow: 1,
          bg: 'white',
          mb: 2,
        };
      default:
        return {
          padding: 4,
          minHeight: itemHeight,
          borderRadius: 'md',
        };
    }
  };

  const renderItem = ({ item, index }: { item: CRUDItem; index: number }) => {
    const styles = getItemVariantStyles();
    const statusColor = getStatusColor ? getStatusColor(item.status || '') : 'gray.500';
    const statusText = getStatusText ? getStatusText(item.status || '') : item.status;

    const itemContent = (
      <HStack
        alignItems="center"
        justifyContent="space-between"
        flex={1}
      >
        <VStack flex={1} space={1}>
          <HStack alignItems="center" justifyContent="space-between">
            <Text 
              fontSize="md" 
              fontWeight="semibold" 
              color="gray.800"
              numberOfLines={1}
              flex={1}
            >
              {item.title}
            </Text>
            {item.status && (
              <Badge
                bg={statusColor}
                borderRadius="full"
                px={2}
                py={1}
                ml={2}
              >
                <Text fontSize="xs" fontWeight="medium" color="white">
                  {statusText}
                </Text>
              </Badge>
            )}
          </HStack>
          
          {item.subtitle && (
            <Text fontSize="sm" color="gray.600" numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
          
          {item.description && (
            <Text fontSize="sm" color="gray.500" numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <HStack alignItems="center" justifyContent="space-between">
            {item.date && (
              <Text fontSize="xs" color="gray.400">
                {item.date}
              </Text>
            )}
            {item.type && (
              <Text fontSize="xs" color={theme.colors.primary?.[500] || '#3D944B'} fontWeight="medium">
                {item.type}
              </Text>
            )}
          </HStack>
        </VStack>

        {showActions && (
          <HStack alignItems="center" space={2} ml={3}>
            {onView && (
              <IconButton
                icon={<Ionicons name="eye" size={20} color={theme.colors.primary?.[500] || '#3D944B'} />}
                onPress={() => onView(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
            
            {onEdit && (
              <IconButton
                icon={<Ionicons name="create" size={20} color={theme.colors.blue?.[500] || '#3b82f6'} />}
                onPress={() => onEdit(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
            
            {onDelete && (
              <IconButton
                icon={<Ionicons name="trash" size={20} color={theme.colors.red?.[500] || '#ef4444'} />}
                onPress={() => handleDelete(item)}
                variant="ghost"
                size="sm"
                _pressed={{ opacity: 0.7 }}
              />
            )}
          </HStack>
        )}
      </HStack>
    );

    if (variant === 'card') {
      return (
        <Box
          bg="white"
          borderRadius="lg"
          shadow={1}
          mb={2}
          p={4}
          borderWidth={1}
          borderColor="gray.100"
        >
          {itemContent}
        </Box>
      );
    }

    return (
      <Box
        bg="white"
        borderBottomWidth={index === items.length - 1 ? 0 : 1}
        borderBottomColor="gray.200"
        {...styles}
      >
        {itemContent}
      </Box>
    );
  };

  const renderHeader = () => (
    <HStack
      alignItems="center"
      justifyContent="space-between"
      p={4}
      borderBottomWidth={1}
      borderBottomColor="gray.200"
      bg="white"
    >
      <VStack>
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          {title}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {items.length} élément{items.length !== 1 ? 's' : ''}
        </Text>
      </VStack>

      <HStack space={2}>
        {showRefreshButton && onRefresh && (
          <IconButton
            icon={<Ionicons name="refresh" size={20} color={theme.colors.gray?.[600] || '#4b5563'} />}
            onPress={onRefresh}
            variant="ghost"
            size="sm"
            _pressed={{ opacity: 0.7 }}
          />
        )}
        
        {showAddButton && (
          <Button
            size="sm"
            variant="solid"
            bg={theme.colors.primary?.[500] || '#3D944B'}
            _pressed={{ bg: theme.colors.primary?.[600] || '#2d7a3d' }}
            leftIcon={<Ionicons name="add" size={16} color="white" />}
            onPress={handleAdd}
          >
            {addButtonText}
          </Button>
        )}
      </HStack>
    </HStack>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="list"
      title="Aucun élément"
      description={emptyMessage}
      actionLabel="Ajouter un élément"
      onAction={handleAdd}
      showAction={showAddButton}
    />
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <HStack justifyContent="center" p={4}>
          <Spinner size="sm" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text ml={2} color="gray.500" fontSize="sm">
            Chargement...
          </Text>
        </HStack>
      );
    }
    return null;
  };

  return (
    <Box flex={1} bg="gray.50">
      {renderHeader()}
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={!loading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        refreshing={loading}
        onRefresh={onRefresh}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </Box>
  );
};

// Composants spécialisés pour différents cas d'usage

// Liste simple pour les cas basiques
interface SimpleCRUDListProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    date?: string;
    status?: string;
  }>;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onAdd?: () => void;
  addButtonText?: string;
}

export const SimpleCRUDList: React.FC<SimpleCRUDListProps> = ({
  title,
  items,
  onEdit,
  onDelete,
  onAdd,
  addButtonText = "Ajouter",
}) => {
  return (
    <CRUDList
      title={title}
      items={items}
      onEdit={onEdit}
      onDelete={onDelete}
      onAdd={onAdd}
      addButtonText={addButtonText}
      variant="default"
      showActions={true}
      showAddButton={true}
    />
  );
};

// Liste compacte pour les listes denses
interface CompactCRUDListProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    status?: string;
  }>;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onAdd?: () => void;
}

export const CompactCRUDList: React.FC<CompactCRUDListProps> = ({
  title,
  items,
  onEdit,
  onDelete,
  onAdd,
}) => {
  return (
    <CRUDList
      title={title}
      items={items}
      onEdit={onEdit}
      onDelete={onDelete}
      onAdd={onAdd}
      variant="compact"
      itemHeight={60}
      showActions={true}
      showAddButton={true}
    />
  );
};

export default CRUDList;
