import React from 'react';
import { Pressable, HStack, Text, useTheme } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { BreadcrumbItem } from '../../../hooks/useSmartNavigation';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  maxItems?: number;
  showHome?: boolean;
  compact?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  onNavigate, 
  maxItems = 4,
  showHome = true,
  compact = false,
}) => {
  const theme = useTheme();
  
  // Limiter le nombre d'éléments affichés
  const displayItems = items.length > maxItems 
    ? [
        items[0], // Premier élément
        { label: '...', path: '', isActive: false, isClickable: false }, // Indicateur d'éléments masqués
        ...items.slice(-(maxItems - 2)) // Derniers éléments
      ]
    : items;
  
  if (items.length <= 1 && !showHome) {
    return null;
  }
  
  return (
    <HStack 
      space={compact ? 1 : 2} 
      alignItems="center" 
      px={compact ? 2 : 4} 
      py={compact ? 0.5 : 1}
      bg="gray.50"
      borderBottomWidth={1}
      borderBottomColor="gray.100"
    >
      {showHome && items.length > 1 && (
        <Pressable 
          onPress={() => onNavigate('/')}
          p={compact ? 1 : 2}
          borderRadius="sm"
          _pressed={{ bg: 'gray.100' }}
        >
          <Ionicons 
            name="home" 
            size={compact ? 14 : 16} 
            color={theme.colors.primary[500]} 
          />
        </Pressable>
      )}
      
      {displayItems.map((item, index) => (
        <React.Fragment key={`${item.path}-${index}`}>
          {index > 0 && (
            <Ionicons 
              name="chevron-forward" 
              size={compact ? 10 : 12} 
              color={theme.colors.gray[400]} 
            />
          )}
          
          <Pressable
            onPress={() => item.isClickable && onNavigate(item.path)}
            opacity={item.isClickable ? 1 : 0.7}
            disabled={!item.isClickable}
            p={compact ? 1 : 2}
            borderRadius="sm"
            _pressed={item.isClickable ? { bg: 'gray.100' } : {}}
          >
            <Text
              fontSize={compact ? 'xs' : 'sm'}
              color={item.isActive ? 'primary.500' : 'gray.600'}
              fontWeight={item.isActive ? 'bold' : 'normal'}
              numberOfLines={1}
              maxWidth={compact ? 60 : 100}
            >
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </HStack>
  );
};

export default Breadcrumb;