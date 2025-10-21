/**
 * VisitCard - Composant moderne pour afficher une visite
 * Design avec stripe colorée, badges, et interactions fluides
 */

import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Badge,
  useTheme
} from 'native-base';
import { Visit } from '../../lib/services/domain/visits/visits.types';

interface VisitCardProps {
  visit: Visit;
  onPress?: (visit: Visit) => void;
  onEdit?: (visit: Visit) => void;
  onComplete?: (visit: Visit) => void;
  onDelete?: (visit: Visit) => void;
}

export const VisitCard: React.FC<VisitCardProps> = ({
  visit,
  onPress,
  onEdit,
  onComplete,
  onDelete
}) => {
  const theme = useTheme();
  
  // Configuration des statuts
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'terminé':
      case 'completed':
        return {
          bg: 'success.100',
          color: 'success.700',
          stripe: 'success.500',
          label: 'Terminé',
          icon: 'checkmark-circle'
        };
      case 'en cours':
      case 'in_progress':
        return {
          bg: 'warning.100',
          color: 'warning.700',
          stripe: 'warning.500',
          label: 'En cours',
          icon: 'time'
        };
      case 'à faire':
      case 'pending':
        return {
          bg: 'info.100',
          color: 'info.700',
          stripe: 'info.500',
          label: 'À faire',
          icon: 'hourglass'
        };
      default:
        return {
          bg: 'gray.100',
          color: 'gray.700',
          stripe: 'gray.500',
          label: status,
          icon: 'ellipse'
        };
    }
  };

  // Configuration des types de visite
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'routine':
        return {
          color: 'primary.500',
          icon: 'refresh',
          label: 'Routine'
        };
      case 'planned':
        return {
          color: 'secondary.500',
          icon: 'calendar',
          label: 'Planifiée'
        };
      case 'emergency':
        return {
          color: 'error.500',
          icon: 'warning',
          label: 'Urgence'
        };
      default:
        return {
          color: 'gray.500',
          icon: 'list',
          label: type
        };
    }
  };

  const statusConfig = getStatusConfig(visit.status);
  const typeConfig = getTypeConfig(visit.visit_type || 'routine');
  
  // Formatage de la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      // Nettoyer la chaîne de date (enlever les espaces, etc.)
      const cleanDateString = dateString.trim();
      
      // Essayer différents formats de date
      let date: Date;
      
      // Format PostgreSQL avec timezone (ex: "2025-09-26 00:21:41.208+00")
      if (cleanDateString.includes('+') && cleanDateString.includes(' ')) {
        // Convertir le format PostgreSQL en format ISO
        // "2025-09-26 00:21:41.208+00" -> "2025-09-26T00:21:41.208+00:00"
        const isoString = cleanDateString.replace(' ', 'T');
        // S'assurer que le timezone a le bon format (+00 -> +00:00)
        const timezoneFixed = isoString.replace(/([+-]\d{2})$/, '$1:00');
        date = new Date(timezoneFixed);
      }
      // Format ISO avec timezone (ex: "2025-09-26T00:21:41.208Z")
      else if (cleanDateString.includes('T') && (cleanDateString.includes('Z') || cleanDateString.includes('+'))) {
        date = new Date(cleanDateString);
      }
      // Format avec espace sans timezone (ex: "2025-09-26 00:21:41")
      else if (cleanDateString.includes(' ')) {
        // Remplacer l'espace par T pour créer un format ISO valide
        const isoString = cleanDateString.replace(' ', 'T');
        date = new Date(isoString);
      }
      // Format simple (ex: "2025-09-26")
      else {
        date = new Date(cleanDateString);
      }
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.warn('Date invalide dans VisitCard:', {
          original: dateString,
          cleaned: cleanDateString,
          parsed: date
        });
        return 'Date invalide';
      }
      
      return date.toLocaleString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erreur formatage date dans VisitCard:', error, {
        original: dateString,
        error: error instanceof Error ? error.message : String(error)
      });
      return 'Erreur de date';
    }
  };

  const handlePress = () => {
    onPress?.(visit);
  };

  return (
    <Pressable onPress={handlePress} _pressed={{ opacity: 0.7 }}>
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth={1}
        borderColor="gray.200"
        shadow={2}
        overflow="hidden"
        mb={3}
      >
        {/* Stripe colorée */}
        <Box w="100%" h={1} bg={statusConfig.stripe} />
        
        <VStack p={4} space={3}>
          {/* Header avec type et statut */}
          <HStack justifyContent="space-between" alignItems="center">
            <HStack alignItems="center" space={3}>
              {/* Icône du type */}
              <Box
                w={10}
                h={10}
                borderRadius="full"
                bg={typeConfig.color}
                alignItems="center"
                justifyContent="center"
                shadow={1}
              >
                <Ionicons name={typeConfig.icon as any} size={18} color="white" />
              </Box>
              
              <VStack space={1}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  {typeConfig.label}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {formatDate(visit.visit_date)}
                </Text>
              </VStack>
            </HStack>
            
            {/* Badge de statut */}
            <Badge
              bg={statusConfig.bg}
              borderRadius="full"
              px={3}
              py={1}
              _text={{
                fontSize: 'xs',
                fontWeight: 'medium',
                color: statusConfig.color
              }}
            >
              <HStack alignItems="center" space={1}>
                <Ionicons name={statusConfig.icon as any} size={12} color={theme.colors[statusConfig.color.split('.')[0]]?.[statusConfig.color.split('.')[1]]} />
                <Text>{statusConfig.label}</Text>
              </HStack>
            </Badge>
          </HStack>

          {/* Informations principales */}
          <VStack space={2}>
            {/* Producteur */}
            <HStack alignItems="center" space={2}>
              <Ionicons name="person" size={16} color={theme.colors.primary?.[500]} />
              <Text fontSize="md" fontWeight="bold" color="gray.800" flex={1}>
                {visit.producer_name || 'Producteur non défini'}
              </Text>
            </HStack>
            
            {/* Parcelle */}
            <HStack alignItems="center" space={2}>
              <Ionicons name="leaf" size={16} color={theme.colors.primary?.[500]} />
              <Text fontSize="sm" color="gray.700" flex={1}>
                {visit.plot_name || 'Parcelle non définie'}
              </Text>
            </HStack>
            
            {/* Surface si disponible */}
            {visit.parcel_area && (
              <HStack alignItems="center" space={2}>
                <Ionicons name="resize" size={14} color={theme.colors.gray?.[500]} />
                <Text fontSize="sm" color="gray.600">
                  {visit.parcel_area} ha
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Notes si disponibles */}
          {visit.notes && (
            <Box
              bg="gray.50"
              borderRadius="md"
              p={3}
              borderLeftWidth={3}
              borderLeftColor="primary.300"
            >
              <Text fontSize="sm" color="gray.600" numberOfLines={2}>
                {visit.notes}
              </Text>
            </Box>
          )}

          {/* Actions rapides */}
          <HStack justifyContent="flex-end" space={2}>
            {visit.status !== 'terminé' && onComplete && (
              <Pressable
                onPress={() => onComplete(visit)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg="success.100"
                  borderRadius="full"
                  p={2}
                >
                  <Ionicons name="checkmark" size={16} color={theme.colors.success?.[600]} />
                </Box>
              </Pressable>
            )}
            
            {onEdit && (
              <Pressable
                onPress={() => onEdit(visit)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg="primary.100"
                  borderRadius="full"
                  p={2}
                >
                  <Ionicons name="create" size={16} color={theme.colors.primary?.[600]} />
                </Box>
              </Pressable>
            )}
            
            {onDelete && (
              <Pressable
                onPress={() => onDelete(visit)}
                _pressed={{ opacity: 0.7 }}
              >
                <Box
                  bg="error.100"
                  borderRadius="full"
                  p={2}
                >
                  <Ionicons name="trash" size={16} color={theme.colors.error?.[600]} />
                </Box>
              </Pressable>
            )}
          </HStack>
        </VStack>
      </Box>
    </Pressable>
  );
};

export default VisitCard;
