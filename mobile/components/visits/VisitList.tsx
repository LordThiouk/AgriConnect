/**
 * VisitList - Composant moderne pour afficher la liste des visites avec filtres
 * Intègre fetch via useAgentVisits, affiche compteur, actions, et rend des VisitCard
 */

import React, { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  IconButton,
  Badge,
  useTheme,
  Spinner,
  Center
} from 'native-base';
import { Visit } from '../../lib/services/domain/visits/visits.types';
import { useAgentVisits } from '../../lib/hooks/useAgentVisits';
import { VisitCard } from './VisitCard';
import { VisitFilterModal } from '../VisitFilterModal';

import { VisitFilter } from '../../lib/types/visit-filters';

interface VisitListProps {
  agentId: string;
  onVisitPress?: (visit: Visit) => void;
  onVisitEdit?: (visit: Visit) => void;
  onVisitComplete?: (visit: Visit) => void;
  onVisitDelete?: (visit: Visit) => void;
  showFilter?: boolean;
  showRefresh?: boolean;
  maxHeight?: number;
}

export const VisitList: React.FC<VisitListProps> = ({
  agentId,
  onVisitPress,
  onVisitEdit,
  onVisitComplete,
  onVisitDelete,
  showFilter = true,
  showRefresh = true,
  maxHeight = 400
}) => {
  const theme = useTheme();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<VisitFilter>('all');

  // Hook pour récupérer les visites avec le filtre actuel
  const visitsResult = useAgentVisits(agentId, { period: currentFilter } as any);
  const visits = visitsResult.data || [];
  const visitsCount = visits.length;
  const loadingVisits = visitsResult.loading;
  const errorVisits = visitsResult.error;

  // Gestion du refresh
  const handleRefresh = async () => {
    try {
      await visitsResult.refetch();
    } catch (error) {
      console.error('Erreur lors du refresh des visites:', error);
    }
  };

  // Gestion du changement de filtre
  const handleFilterChange = (filter: VisitFilter) => {
    setCurrentFilter(filter);
    setShowFilterModal(false);
  };

  // Gestion des actions sur les visites
  const handleVisitPress = (visit: Visit) => {
    onVisitPress?.(visit);
  };

  const handleVisitEdit = (visit: Visit) => {
    onVisitEdit?.(visit);
  };

  const handleVisitComplete = (visit: Visit) => {
    onVisitComplete?.(visit);
  };

  const handleVisitDelete = (visit: Visit) => {
    onVisitDelete?.(visit);
  };

  // Configuration des filtres pour l'affichage
  const getFilterConfig = (filter: VisitFilter) => {
    switch (filter) {
      case 'today':
        return { label: 'Aujourd\'hui', color: 'primary', icon: 'today' };
      case 'week':
        return { label: 'Cette semaine', color: 'secondary', icon: 'calendar' };
      case 'month':
        return { label: 'Ce mois', color: 'error', icon: 'calendar-outline' };
      case 'all':
        return { label: 'Toutes', color: 'info', icon: 'list' };
      case 'past':
        return { label: 'Passées', color: 'warning', icon: 'time' };
      case 'future':
        return { label: 'À venir', color: 'success', icon: 'arrow-forward' };
      case 'completed':
        return { label: 'Terminées', color: 'success', icon: 'checkmark-circle' };
      case 'pending':
        return { label: 'En attente', color: 'warning', icon: 'hourglass' };
      default:
        return { label: 'Toutes', color: 'info', icon: 'list' };
    }
  };

  const filterConfig = getFilterConfig(currentFilter);


  // Render du header avec filtres et actions
  const renderHeader = () => (
    <VStack space={3} mb={4}>
      {/* Header avec titre et actions */}
      <HStack justifyContent="space-between" alignItems="center">
        <VStack space={1}>
          <Text fontSize="lg" fontWeight="bold" color="gray.800">
            Visites
          </Text>
          <HStack alignItems="center" space={2}>
            <Badge
              bg={`${filterConfig.color}.100`}
              borderRadius="full"
              px={2}
              py={1}
              _text={{
                fontSize: 'xs',
                fontWeight: 'medium',
                color: `${filterConfig.color}.700`
              }}
            >
              <HStack alignItems="center" space={1}>
                <Ionicons name={filterConfig.icon as any} size={12} />
                <Text>{filterConfig.label}</Text>
              </HStack>
            </Badge>
            <Text fontSize="sm" color="gray.600">
              {visitsCount} visite{visitsCount > 1 ? 's' : ''}
            </Text>
          </HStack>
        </VStack>

        <HStack space={2}>
          {/* Bouton de filtre */}
          {showFilter && (
            <IconButton
              icon={<Ionicons name="filter" size={20} color={theme.colors.primary?.[500]} />}
              onPress={() => setShowFilterModal(true)}
              variant="outline"
              borderColor="primary.300"
              _pressed={{ bg: 'primary.50' }}
            />
          )}
          
          {/* Bouton de refresh */}
          {showRefresh && (
            <IconButton
              icon={<Ionicons name="refresh" size={20} color={theme.colors.primary?.[500]} />}
              onPress={handleRefresh}
              variant="outline"
              borderColor="primary.300"
              _pressed={{ bg: 'primary.50' }}
            />
          )}
        </HStack>
      </HStack>
    </VStack>
  );

  // Render du contenu vide
  const renderEmpty = () => (
    <Center py={8}>
      <VStack alignItems="center" space={3}>
        <Box
          w={16}
          h={16}
          borderRadius="full"
          bg="gray.100"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="calendar-outline" size={32} color={theme.colors.gray?.[400]} />
        </Box>
        <VStack alignItems="center" space={1}>
          <Text fontSize="md" fontWeight="medium" color="gray.600">
            Aucune visite
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            {currentFilter === 'all' 
              ? 'Aucune visite trouvée pour cet agent'
              : `Aucune visite ${filterConfig.label.toLowerCase()}`
            }
          </Text>
        </VStack>
      </VStack>
    </Center>
  );

  // Render de l'erreur
  const renderError = () => (
    <Center py={8}>
      <VStack alignItems="center" space={3}>
        <Box
          w={16}
          h={16}
          borderRadius="full"
          bg="error.100"
          alignItems="center"
          justifyContent="center"
        >
          <Ionicons name="alert-circle" size={32} color={theme.colors.error?.[500]} />
        </Box>
        <VStack alignItems="center" space={1}>
          <Text fontSize="md" fontWeight="medium" color="error.600">
            Erreur de chargement
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            Impossible de charger les visites
          </Text>
        </VStack>
      </VStack>
    </Center>
  );

  return (
    <Box flex={1}>
      {/* Header */}
      {renderHeader()}

      {/* Liste des visites */}
      <Box flex={1} maxH={maxHeight}>
        {loadingVisits ? (
          <Center py={8}>
            <VStack alignItems="center" space={3}>
              <Spinner size="lg" color="primary.500" />
              <Text fontSize="sm" color="gray.600">
                Chargement des visites...
              </Text>
            </VStack>
          </Center>
        ) : errorVisits ? (
          renderError()
        ) : visits.length === 0 ? (
          renderEmpty()
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loadingVisits}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary?.[500] || '#3D944B']}
                tintColor={theme.colors.primary?.[500] || '#3D944B'}
              />
            }
            contentContainerStyle={{
              paddingBottom: 20
            }}
          >
            {visits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onPress={handleVisitPress}
                onEdit={handleVisitEdit}
                onComplete={handleVisitComplete}
                onDelete={handleVisitDelete}
              />
            ))}
          </ScrollView>
        )}
      </Box>

      {/* Modal de filtres */}
      <VisitFilterModal
        visible={showFilterModal}
        currentFilter={currentFilter}
        onFilterSelect={handleFilterChange}
        onClose={() => setShowFilterModal(false)}
      />
    </Box>
  );
};

export default VisitList;
