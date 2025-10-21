/**
 * VisitDetailModal - Modal ultra-moderne pour afficher les détails d'une visite
 * Design avec header sticky, sections Producteur/Parcelle/Visite, actions primaires
 */

import React from 'react';
import { Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  Box, 
  Text, 
  HStack, 
  VStack, 
  Button,
  IconButton,
  Badge,
  useTheme
} from 'native-base';
import { Visit } from '../../lib/services/domain/visits/visits.types';

interface VisitDetailModalProps {
  visit: Visit | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (visit: Visit) => void;
  onComplete?: (visit: Visit) => void;
  onDelete?: (visit: Visit) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visit,
  visible,
  onClose,
  onEdit,
  onComplete,
  onDelete
}) => {
  const theme = useTheme();
  const router = useRouter();

  if (!visit) return null;

  // Navigation vers la carte avec localisation de la parcelle
  const handleViewLocation = () => {
    if (visit.lat && visit.lon) {
      // Naviguer vers la liste des parcelles avec focus sur la carte
      router.push({
        pathname: '/(tabs)/parcelles',
        params: {
          centerLat: visit.lat.toString(),
          centerLng: visit.lon.toString(),
          focusPlotId: visit.plot_id,
          zoom: '15',
          showMap: 'true'
        }
      });
    }
  };

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
          label: 'Visite de routine'
        };
      case 'planned':
        return {
          color: 'secondary.500',
          icon: 'calendar',
          label: 'Visite planifiée'
        };
      case 'emergency':
        return {
          color: 'error.500',
          icon: 'warning',
          label: 'Visite d\'urgence'
        };
      default:
        return {
          color: 'gray.500',
          icon: 'list',
          label: 'Visite'
        };
    }
  };

  const statusConfig = getStatusConfig(visit.status);
  const typeConfig = getTypeConfig(visit.visit_type || 'routine');
  
  // Formatage de la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non définie';
    
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
        console.warn('Date invalide après parsing:', {
          original: dateString,
          cleaned: cleanDateString,
          parsed: date
        });
        return 'Date invalide';
      }
      
      return {
        date: date.toLocaleDateString('fr-FR', { 
          weekday: 'long',
          day: 'numeric', 
          month: 'long',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    } catch (error) {
      console.error('Erreur formatage date:', error, {
        original: dateString,
        error: error instanceof Error ? error.message : String(error)
      });
      return 'Erreur de date';
    }
  };

  const dateInfo = formatDate(visit.visit_date);

  // Actions disponibles
  const canEdit = visit.status !== 'terminé';
  const canComplete = visit.status === 'à faire' || visit.status === 'en cours';
  const canDelete = true;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Box flex={1} bg="rgba(0, 0, 0, 0.5)">
        <Box
          bg="white"
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          maxH={screenHeight * 0.9}
          minH={screenHeight * 0.6}
          flex={1}
          mt="auto"
        >
          {/* Header sticky */}
          <Box
            bg="white"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            px={6}
            py={4}
            borderBottomWidth={1}
            borderBottomColor="gray.200"
            shadow={2}
          >
            <HStack justifyContent="space-between" alignItems="center">
              <VStack space={1}>
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  Détails de la visite
                </Text>
                <HStack alignItems="center" space={2}>
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
                      <Ionicons name={statusConfig.icon as any} size={12} />
                      <Text>{statusConfig.label}</Text>
                    </HStack>
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    {typeConfig.label}
                  </Text>
                </HStack>
              </VStack>
              
              <IconButton
                icon={<Ionicons name="close" size={24} color={theme.colors.gray?.[500]} />}
                onPress={onClose}
                variant="ghost"
                _pressed={{ opacity: 0.7 }}
              />
            </HStack>
          </Box>

          {/* Contenu scrollable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <VStack space={6} p={6}>
              {/* Section Producteur */}
              <Box
                bg="gray.50"
                borderRadius="xl"
                p={5}
                borderLeftWidth={4}
                borderLeftColor="primary.500"
              >
                <HStack alignItems="center" space={3} mb={3}>
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="primary.500"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons name="person" size={20} color="white" />
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Producteur
                  </Text>
                </HStack>
                
                <VStack space={2}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    {visit.producer_name || 'Nom non défini'}
                  </Text>
                  {visit.cooperative_name && (
                    <HStack alignItems="center" space={2}>
                      <Ionicons name="business" size={16} color={theme.colors.gray?.[500]} />
                      <Text fontSize="sm" color="gray.600">
                        {visit.cooperative_name}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Section Parcelle */}
              <Box
                bg="gray.50"
                borderRadius="xl"
                p={5}
                borderLeftWidth={4}
                borderLeftColor="secondary.500"
              >
                <HStack alignItems="center" space={3} mb={3}>
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg="secondary.500"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons name="leaf" size={20} color="white" />
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Parcelle
                  </Text>
                </HStack>
                
                <VStack space={2}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    {visit.plot_name || 'Nom non défini'}
                  </Text>
                  
                  {visit.parcel_area && (
                    <HStack alignItems="center" space={2}>
                      <Ionicons name="resize" size={16} color={theme.colors.gray?.[500]} />
                      <Text fontSize="sm" color="gray.600">
                        Surface: {visit.parcel_area} hectares
                      </Text>
                    </HStack>
                  )}
                  
                  {visit.parcel_location && (
                    <HStack alignItems="center" space={2}>
                      <Ionicons name="location" size={16} color={theme.colors.gray?.[500]} />
                      <Text fontSize="sm" color="gray.600">
                        {visit.parcel_location}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>

              {/* Section Visite */}
              <Box
                bg="gray.50"
                borderRadius="xl"
                p={5}
                borderLeftWidth={4}
                borderLeftColor={typeConfig.color}
              >
                <HStack alignItems="center" space={3} mb={3}>
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg={typeConfig.color}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Ionicons name={typeConfig.icon as any} size={20} color="white" />
                  </Box>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Visite
                  </Text>
                </HStack>
                
                <VStack space={3}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">Date</Text>
                    <Text fontSize="md" fontWeight="medium" color="gray.800">
                      {typeof dateInfo === 'string' ? dateInfo : dateInfo.date}
                    </Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">Heure</Text>
                    <Text fontSize="md" fontWeight="medium" color="gray.800">
                      {typeof dateInfo === 'string' ? 'N/A' : dateInfo.time}
                    </Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">Type</Text>
                    <Text fontSize="md" fontWeight="medium" color="gray.800">
                      {typeConfig.label}
                    </Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" color="gray.600">Statut</Text>
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
                      {statusConfig.label}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* Section Notes */}
              {visit.notes && (
                <Box
                  bg="gray.50"
                  borderRadius="xl"
                  p={5}
                  borderLeftWidth={4}
                  borderLeftColor="info.500"
                >
                  <HStack alignItems="center" space={3} mb={3}>
                    <Box
                      w={10}
                      h={10}
                      borderRadius="full"
                      bg="info.500"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons name="document-text" size={20} color="white" />
                    </Box>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      Notes
                    </Text>
                  </HStack>
                  
                  <Text fontSize="md" color="gray.700" lineHeight={24}>
                    {visit.notes}
                  </Text>
                </Box>
              )}
            </VStack>
          </ScrollView>

          {/* Actions en bas */}
          <Box
            bg="white"
            px={6}
            py={4}
            borderTopWidth={1}
            borderTopColor="gray.200"
            shadow={4}
          >
            <VStack space={3}>
              {/* Bouton localisation parcelle */}
              {visit.lat && visit.lon && (
                <Button
                  variant="outline"
                  borderColor="info.300"
                  _text={{ color: 'info.600', fontWeight: 'medium' }}
                  _pressed={{ bg: 'info.50' }}
                  onPress={handleViewLocation}
                  leftIcon={<Ionicons name="location" size={16} color={theme.colors.info?.[600]} />}
                  w="full"
                >
                  Voir localisation parcelle
                </Button>
              )}
              
              {/* Actions principales */}
              <HStack space={3} justifyContent="flex-end">
                {canDelete && onDelete && (
                  <Button
                    variant="outline"
                    borderColor="error.300"
                    _text={{ color: 'error.600', fontWeight: 'medium' }}
                    _pressed={{ bg: 'error.50' }}
                    onPress={() => onDelete(visit)}
                    leftIcon={<Ionicons name="trash" size={16} color={theme.colors.error?.[600]} />}
                  >
                    Supprimer
                  </Button>
                )}
                
                {canEdit && onEdit && (
                  <Button
                    variant="outline"
                    borderColor="primary.300"
                    _text={{ color: 'primary.600', fontWeight: 'medium' }}
                    _pressed={{ bg: 'primary.50' }}
                    onPress={() => onEdit(visit)}
                    leftIcon={<Ionicons name="create" size={16} color={theme.colors.primary?.[600]} />}
                  >
                    Modifier
                  </Button>
                )}
                
                {canComplete && onComplete && (
                  <Button
                    bg="success.500"
                    _pressed={{ bg: 'success.600' }}
                    _text={{ color: 'white', fontWeight: 'medium' }}
                    onPress={() => onComplete(visit)}
                    leftIcon={<Ionicons name="checkmark" size={16} color="white" />}
                  >
                    Terminer
                  </Button>
                )}
              </HStack>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default VisitDetailModal;
