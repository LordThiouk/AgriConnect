/**
 * AlertCard - Composant moderne pour afficher une alerte
 */

import React from 'react';
import { Pressable } from 'react-native';
import { 
  Box, 
  HStack, 
  Text, 
  Badge, 
  Button,
  Spinner
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface AlertCardProps {
  alert: {
    id: string;
    title: string;
    description: string;
    severity: number;
    alert_type: string;
    producer_name?: string;
    plot_name?: string;
    created_at: string;
    is_resolved: boolean;
  };
  onPress: () => void;
  onResolve: () => void;
  onCreateVisit: () => void;
  loading?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onPress,
  onResolve,
  onCreateVisit,
  loading = false
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erreur formatage date dans AlertCard:', error);
      return 'Erreur de date';
    }
  };

  const getSeverityInfo = (severity: number) => {
    if (severity >= 4) {
      return {
        color: 'error.500',
        bgColor: 'error.100',
        borderColor: 'error.200',
        label: 'Critique',
        icon: 'warning' as const
      };
    } else if (severity >= 3) {
      return {
        color: 'warning.500',
        bgColor: 'warning.100',
        borderColor: 'warning.200',
        label: 'Moyenne',
        icon: 'alert-circle' as const
      };
    } else {
      return {
        color: 'info.500',
        bgColor: 'info.100',
        borderColor: 'info.200',
        label: 'Faible',
        icon: 'information-circle' as const
      };
    }
  };

  const severityInfo = getSeverityInfo(alert.severity);

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Box
        bg="white"
        borderRadius="lg"
        p={4}
        borderWidth={1}
        borderColor={severityInfo.borderColor}
        borderLeftWidth={4}
        borderLeftColor={severityInfo.color}
        shadow={1}
        mb={3}
        width="100%"
        maxWidth="100%"
      >
        {/* Header avec icône et badge de sévérité */}
        <HStack alignItems="center" justifyContent="space-between" mb={3} width="100%">
          <HStack alignItems="center" space={3} flex={1} maxWidth="70%">
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bg={severityInfo.color}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons 
                name={severityInfo.icon} 
                size={16} 
                color="white" 
              />
            </Box>
            <Text fontSize="md" fontWeight="semibold" color="gray.800" flex={1} numberOfLines={1}>
              {alert.title}
            </Text>
          </HStack>
          
          <Badge
            bg={severityInfo.bgColor}
            borderRadius="full"
            px={3}
            py={1}
            flexShrink={0}
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

        {/* Description */}
        <Text fontSize="sm" color="gray.600" mb={3} numberOfLines={2}>
          {alert.description}
        </Text>

        {/* Informations contextuelles */}
        <HStack alignItems="center" justifyContent="space-between" mb={3}>
          <HStack alignItems="center" space={4}>
            <HStack alignItems="center" space={1}>
              <Ionicons name="time" size={12} color="gray.500" />
              <Text fontSize="xs" color="gray.500">
                {formatDate(alert.created_at)}
              </Text>
            </HStack>
            
            {alert.producer_name && (
              <HStack alignItems="center" space={1}>
                <Ionicons name="person" size={12} color="gray.500" />
                <Text fontSize="xs" color="gray.500" numberOfLines={1}>
                  {alert.producer_name}
                </Text>
              </HStack>
            )}
          </HStack>
        </HStack>

        {/* Nom de la parcelle */}
        {alert.plot_name && (
          <HStack alignItems="center" space={1} mb={3}>
            <Ionicons name="location" size={12} color="gray.500" />
            <Text fontSize="xs" color="gray.500" numberOfLines={1} flex={1}>
              {alert.plot_name}
            </Text>
          </HStack>
        )}

        {/* Boutons d'action */}
        <HStack space={2} justifyContent="flex-end" width="100%">
          <Button
            size="sm"
            variant="outline"
            borderColor="success.500"
            _text={{ color: 'success.500', fontSize: 'xs' }}
            onPress={() => {
              console.log('🔧 [AlertCard] Bouton Résoudre cliqué pour alerte:', alert.id);
              onResolve();
            }}
            disabled={loading}
            leftIcon={
              loading ? (
                <Spinner size="sm" color="success.500" />
              ) : (
                <Ionicons name="checkmark" size={14} color="success.500" />
              )
            }
            px={3}
            py={1}
            flex={1}
            maxWidth="48%"
          >
            Résoudre
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            borderColor="primary.500"
            _text={{ color: 'primary.500', fontSize: 'xs' }}
            onPress={onCreateVisit}
            disabled={loading}
            leftIcon={<Ionicons name="calendar" size={14} color="primary.500" />}
            px={3}
            py={1}
            flex={1}
            maxWidth="48%"
          >
            Visite
          </Button>
        </HStack>
      </Box>
    </Pressable>
  );
};
