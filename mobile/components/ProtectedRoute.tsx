/**
 * Protected Route Component - AgriConnect Mobile
 * Composant pour protéger les routes et valider les rôles utilisateur
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../lib/types/core/user';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Spinner,
  useTheme
} from 'native-base';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  fallback,
  requireAuth = true
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    userRole, 
    canAccessMobile, 
    error 
  } = useAuth();
  const theme = useTheme();

  // Affichage du loading
  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="gray.50" p={5}>
        <VStack space={4} alignItems="center">
          <Spinner size="lg" color={theme.colors.primary?.[500] || '#3D944B'} />
          <Text fontSize="md" color="gray.600" textAlign="center">
            Vérification de l&apos;authentification...
          </Text>
        </VStack>
      </Box>
    );
  }

  // Si l'authentification n'est pas requise, afficher le contenu
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Si non authentifié, afficher le fallback ou rediriger
  if (!isAuthenticated) {
    return fallback || (
      <Box flex={1} justifyContent="center" alignItems="center" bg="gray.50" p={5}>
        <VStack space={4} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color={theme.colors.red?.[500] || '#D32F2F'} textAlign="center">
            Authentification requise
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center" lineHeight={24}>
            Vous devez être connecté pour accéder à cette page.
          </Text>
        </VStack>
      </Box>
    );
  }

  // Vérifier l'accès mobile
  if (!canAccessMobile) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="gray.50" p={5}>
        <VStack space={4} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color={theme.colors.red?.[500] || '#D32F2F'} textAlign="center">
            Accès refusé
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center" lineHeight={24}>
            Seuls les agents et producteurs peuvent utiliser l&apos;application mobile.
          </Text>
        </VStack>
      </Box>
    );
  }

  // Vérifier les rôles autorisés
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="gray.50" p={5}>
        <VStack space={4} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color={theme.colors.red?.[500] || '#D32F2F'} textAlign="center">
            Permissions insuffisantes
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center" lineHeight={24}>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </Text>
          <Text fontSize="sm" color="gray.500" textAlign="center" fontStyle="italic">
            Rôle actuel: {userRole}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Afficher les erreurs d'authentification
  if (error) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="gray.50" p={5}>
        <VStack space={4} alignItems="center">
          <Text fontSize="xl" fontWeight="bold" color={theme.colors.red?.[500] || '#D32F2F'} textAlign="center">
            Erreur d&apos;authentification
          </Text>
          <Text fontSize="md" color="gray.600" textAlign="center" lineHeight={24}>
            {error}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Tout est OK, afficher le contenu
  return <>{children}</>;
};

// Composant spécialisé pour les agents
export const AgentRoute: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute allowedRoles={['agent']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Composant spécialisé pour les producteurs
export const ProducerRoute: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute allowedRoles={['producer']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

// Composant pour les agents et producteurs
export const MobileUserRoute: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback
}) => (
  <ProtectedRoute allowedRoles={['agent', 'producer']} fallback={fallback}>
    {children}
  </ProtectedRoute>
);


export default ProtectedRoute;