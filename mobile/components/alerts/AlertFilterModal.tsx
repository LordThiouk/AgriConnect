/**
 * Modal de sélection de filtres pour les alertes
 * Interface responsive optimisée pour mobile - Version simplifiée
 */

import React from 'react';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertFilters as AlertFiltersType } from '../../lib/services/domain/alerts/alerts.types';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
  useTheme
} from 'native-base';

interface AlertFilterModalProps {
  visible: boolean;
  currentFilters: AlertFiltersType;
  onFiltersChange: (filters: AlertFiltersType) => void;
  onClose: () => void;
}

// Filtres simplifiés - seulement les plus importants
const quickFilters = [
  { 
    key: 'all', 
    label: 'Toutes', 
    icon: 'list', 
    description: 'Voir toutes les alertes',
    colorScheme: 'info'
  },
  { 
    key: 'critical', 
    label: 'Critiques', 
    icon: 'warning', 
    description: 'Alertes urgentes',
    colorScheme: 'error'
  },
  { 
    key: 'unresolved', 
    label: 'Non résolues', 
    icon: 'time', 
    description: 'Alertes en attente',
    colorScheme: 'warning'
  },
  { 
    key: 'today', 
    label: 'Aujourd\'hui', 
    icon: 'calendar', 
    description: 'Alertes du jour',
    colorScheme: 'primary'
  }
];

export const AlertFilterModal: React.FC<AlertFilterModalProps> = ({
  visible,
  currentFilters,
  onFiltersChange,
  onClose
}) => {
  const theme = useTheme();
  
  // Force recompilation - cache fix

  const handleQuickFilter = (filterKey: string) => {
    let newFilters: AlertFiltersType = {};
    
    switch (filterKey) {
      case 'all':
        newFilters = {};
        break;
      case 'critical':
        newFilters = { severity: 4 };
        break;
      case 'unresolved':
        newFilters = { is_resolved: false };
        break;
      case 'today':
        newFilters = { days: 1 };
        break;
    }
    
    onFiltersChange(newFilters);
    onClose();
  };

  const getCurrentFilterKey = () => {
    if (currentFilters.severity === 4) return 'critical';
    if (currentFilters.is_resolved === false) return 'unresolved';
    if (currentFilters.days === 1) return 'today';
    return 'all';
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Box flex={1} bg="white">
        {/* Header */}
        <HStack 
          justifyContent="space-between" 
          alignItems="center" 
          p={4} 
          borderBottomWidth={1} 
          borderBottomColor="gray.200"
          bg="white"
        >
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Filtrer les alertes
          </Text>
          <IconButton
            icon={<Ionicons name="close" size={24} color={theme.colors.gray?.[600]} />}
            onPress={onClose}
            variant="ghost"
          />
        </HStack>

        {/* Contenu simplifié */}
        <VStack p={4} space={4}>
          <Text fontSize="md" color="gray.600" textAlign="center" mb={2}>
            Choisissez un filtre rapide
          </Text>
          
          {quickFilters.map((filter) => {
            const isSelected = getCurrentFilterKey() === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => handleQuickFilter(filter.key)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg={isSelected ? `${filter.colorScheme}.50` : 'white'}
                  borderWidth={2}
                  borderColor={isSelected ? `${filter.colorScheme}.300` : 'gray.200'}
                  borderRadius="xl"
                  p={4}
                  shadow={isSelected ? 3 : 1}
                >
                  <HStack alignItems="center" space={4}>
                    <Box
                      w={12}
                      h={12}
                      borderRadius="full"
                      bg={isSelected ? `${filter.colorScheme}.500` : 'gray.200'}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons 
                        name={filter.icon as any} 
                        size={24} 
                        color={isSelected ? 'white' : theme.colors.gray?.[600]} 
                      />
                    </Box>
                    <VStack flex={1} space={1}>
                      <Text 
                        fontSize="lg" 
                        fontWeight={isSelected ? 'bold' : 'semibold'}
                        color={isSelected ? `${filter.colorScheme}.700` : 'gray.800'}
                      >
                        {filter.label}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {filter.description}
                      </Text>
                    </VStack>
                    {isSelected && (
                      <Ionicons 
                        name="checkmark-circle" 
                        size={28} 
                        color={theme.colors.primary?.[500]} 
                      />
                    )}
                  </HStack>
                </Box>
              </Pressable>
            );
          })}
        </VStack>
      </Box>
    </Modal>
  );
};
