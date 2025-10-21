/**
 * Modal de sélection de filtres pour les visites
 * Interface responsive optimisée pour mobile
 */

import React from 'react';
import { 
  Modal, 
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VisitFilter } from '../lib/types/visit-filters';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Pressable, 
  IconButton,
  Button,
  useTheme
} from 'native-base';

interface VisitFilterModalProps {
  visible: boolean;
  currentFilter: VisitFilter;
  onFilterSelect: (filter: VisitFilter) => void;
  onClose: () => void;
}

const filterOptions: { key: VisitFilter; label: string; icon: string; description: string; colorScheme: string }[] = [
  { 
    key: 'today', 
    label: 'Aujourd\'hui', 
    icon: '📅', 
    description: 'Visites du jour',
    colorScheme: 'primary'
  },
  { 
    key: 'week', 
    label: 'Cette semaine', 
    icon: '📆', 
    description: '7 prochains jours',
    colorScheme: 'secondary'
  },
  { 
    key: 'month', 
    label: 'Ce mois', 
    icon: '🗓️', 
    description: '30 prochains jours',
    colorScheme: 'error'
  },
  { 
    key: 'all', 
    label: 'Toutes les visites', 
    icon: '📋', 
    description: 'Voir toutes les visites',
    colorScheme: 'info'
  },
  { 
    key: 'past', 
    label: 'Visites passées', 
    icon: '⏪', 
    description: 'Visites terminées',
    colorScheme: 'warning'
  },
  { 
    key: 'future', 
    label: 'Visites à venir', 
    icon: '⏩', 
    description: 'Visites planifiées',
    colorScheme: 'success'
  },
  { 
    key: 'completed', 
    label: 'Fait', 
    icon: '✅', 
    description: 'Visites terminées',
    colorScheme: 'success'
  },
  { 
    key: 'pending', 
    label: 'À faire', 
    icon: '⏳', 
    description: 'Visites en attente',
    colorScheme: 'warning'
  }
];

export const VisitFilterModal: React.FC<VisitFilterModalProps> = ({ 
  visible, 
  currentFilter, 
  onFilterSelect, 
  onClose 
}) => {
  const theme = useTheme();
  
  const handleFilterSelect = (filter: VisitFilter) => {
    onFilterSelect(filter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Box flex={1} bg="rgba(0, 0, 0, 0.5)" justifyContent="flex-end">
        <Box
          bg="white"
          borderTopLeftRadius={20}
          borderTopRightRadius={20}
          maxH="80%"
          minH="50%"
        >
          {/* Header */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px={5}
            py={4}
            borderBottomWidth={1}
            borderBottomColor="gray.200"
          >
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              Filtrer les visites
            </Text>
            <IconButton
              icon={<Ionicons name="close" size={24} color={theme.colors.gray?.[500] || '#6c757d'} />}
              onPress={onClose}
              variant="ghost"
              _pressed={{ opacity: 0.7 }}
            />
          </HStack>

          {/* Filter Options */}
          <Box px={5}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {filterOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => handleFilterSelect(option.key)}
                mb={3}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg={currentFilter === option.key ? `${option.colorScheme}.100` : 'gray.50'}
                  borderWidth={currentFilter === option.key ? 2 : 1}
                  borderColor={currentFilter === option.key ? `${option.colorScheme}.500` : 'gray.200'}
                  borderRadius="lg"
                  p={4}
                >
                  <HStack alignItems="center" space={3}>
                    {/* Icon */}
                    <Box
                      bg={currentFilter === option.key ? `${option.colorScheme}.500` : 'gray.300'}
                      borderRadius="full"
                      w={12}
                      h={12}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize="lg">{option.icon}</Text>
                    </Box>

                    {/* Content */}
                    <VStack flex={1} space={1}>
                      <Text 
                        fontSize="md" 
                        fontWeight="medium" 
                        color={currentFilter === option.key ? `${option.colorScheme}.700` : 'gray.800'}
                      >
                        {option.label}
                      </Text>
                      <Text 
                        fontSize="sm" 
                        color={currentFilter === option.key ? `${option.colorScheme}.600` : 'gray.600'}
                      >
                        {option.description}
                      </Text>
                    </VStack>

                    {/* Check icon */}
                    {currentFilter === option.key && (
                      <Box
                        bg={`${option.colorScheme}.500`}
                        borderRadius="full"
                        w={6}
                        h={6}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </Box>
                    )}
                  </HStack>
                </Box>
              </Pressable>
            ))}
            </ScrollView>
          </Box>

          {/* Footer */}
          <Box 
            px={5} 
            py={4} 
            borderTopWidth={1} 
            borderTopColor="gray.200"
            bg="gray.50"
          >
            <Button
              variant="outline"
              onPress={onClose}
              _text={{ color: 'gray.600', fontWeight: 'medium' }}
              borderColor="gray.300"
              _pressed={{ bg: 'gray.100' }}
            >
              Fermer
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default VisitFilterModal;