/**
 * AlertDetailModal - Modal pour afficher les détails d'une alerte
 */

import React from 'react';
import { Modal, ScrollView } from 'react-native';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button,
  Badge,
  Spinner,
  CloseIcon
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

interface AlertDetailModalProps {
  visible: boolean;
  alert: any;
  onClose: () => void;
  onResolve: () => void;
  onCreateVisit: () => void;
  loading?: boolean;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  visible,
  alert,
  onClose,
  onResolve,
  onCreateVisit,
  loading = false
}) => {
  if (!alert) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage date dans AlertDetailModal:', error);
      return 'Erreur de date';
    }
  };

  const getSeverityInfo = (severity: number) => {
    if (severity >= 4) {
      return {
        color: 'error.500',
        bgColor: 'error.100',
        label: 'Critique',
        icon: 'warning' as const
      };
    } else if (severity >= 3) {
      return {
        color: 'warning.500',
        bgColor: 'warning.100',
        label: 'Moyenne',
        icon: 'alert-circle' as const
      };
    } else {
      return {
        color: 'info.500',
        bgColor: 'info.100',
        label: 'Faible',
        icon: 'information-circle' as const
      };
    }
  };

  const severityInfo = getSeverityInfo(alert.severity);

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
            Détails de l&apos;alerte
          </Text>
          <Button
            variant="ghost"
            onPress={onClose}
            p={2}
            _pressed={{ bg: 'gray.100' }}
          >
            <CloseIcon size="5" color="gray.500" />
          </Button>
        </HStack>

        <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Informations de l'alerte */}
          <Card p={4} mb={4}>
            <VStack space={4}>
              <HStack alignItems="center" space={3}>
                <Ionicons 
                  name={severityInfo.icon} 
                  size={20} 
                  color={severityInfo.color} 
                />
                <Text fontSize="sm" color="gray.700">
                  {alert.title}
                </Text>
              </HStack>
              
              <HStack alignItems="flex-start" space={3}>
                <Ionicons name="document-text" size={16} color="gray.500" />
                <Text fontSize="sm" color="gray.700" flex={1}>
                  {alert.description}
                </Text>
              </HStack>
              
              <HStack alignItems="center" space={3}>
                <Ionicons name="time" size={16} color="gray.500" />
                <Badge
                  bg={severityInfo.bgColor}
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  <Text 
                    fontSize="xs" 
                    fontWeight="medium"
                    color={severityInfo.color}
                  >
                    {severityInfo.label}
                  </Text>
                </Badge>
              </HStack>
            </VStack>
          </Card>

          {/* Informations producteur */}
          {alert.producer_name && (
            <Card p={4} mb={4}>
              <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                Producteur concerné
              </Text>
              <HStack alignItems="center" space={3}>
                <Ionicons name="person" size={16} color="gray.500" />
                <Text fontSize="sm" color="gray.700">
                  {alert.producer_name}
                </Text>
              </HStack>
            </Card>
          )}

          {/* Informations parcelle */}
          {alert.plot_id && (
            <Card p={4} mb={4}>
              <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
                Parcelle concernée
              </Text>
              <HStack alignItems="flex-start" space={3}>
                <Ionicons name="location" size={16} color="gray.500" />
                <VStack flex={1}>
                  <Text fontSize="sm" color="gray.700">
                    {alert.plot_name || 'Parcelle non nommée'}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    ID: {alert.plot_id}
                  </Text>
                </VStack>
              </HStack>
            </Card>
          )}

          {/* Informations temporelles */}
          <Card p={4} mb={4}>
            <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>
              Informations temporelles
            </Text>
            <HStack alignItems="center" space={3}>
              <Ionicons name="calendar" size={16} color="gray.500" />
              <Text fontSize="sm" color="gray.700">
                {formatDate(alert.created_at)}
              </Text>
            </HStack>
          </Card>

          {/* Actions */}
          <VStack space={3} mb={8}>
            <Button
              variant="solid"
              bg="success.500"
              _pressed={{ bg: 'success.600' }}
              onPress={onResolve}
              disabled={loading}
              leftIcon={
                loading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )
              }
              h={12}
            >
              Marquer comme résolue
            </Button>
            
            <Button
              variant="solid"
              bg="primary.500"
              _pressed={{ bg: 'primary.600' }}
              onPress={onCreateVisit}
              leftIcon={<Ionicons name="calendar" size={20} color="white" />}
              h={12}
            >
              Créer visite d&apos;urgence
            </Button>
          </VStack>
        </ScrollView>
      </Box>
    </Modal>
  );
};
