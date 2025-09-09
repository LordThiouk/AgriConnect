/**
 * Protected Route Component - AgriConnect Mobile
 * Composant pour protéger les routes et valider les rôles utilisateur
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../types/user';

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

  // Affichage du loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
      </View>
    );
  }

  // Si l'authentification n'est pas requise, afficher le contenu
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Si non authentifié, afficher le fallback ou rediriger
  if (!isAuthenticated) {
    return fallback || (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Authentification requise</Text>
        <Text style={styles.errorText}>
          Vous devez être connecté pour accéder à cette page.
        </Text>
      </View>
    );
  }

  // Vérifier l'accès mobile
  if (!canAccessMobile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Accès refusé</Text>
        <Text style={styles.errorText}>
          Seuls les agents et producteurs peuvent utiliser l'application mobile.
        </Text>
      </View>
    );
  }

  // Vérifier les rôles autorisés
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Permissions insuffisantes</Text>
        <Text style={styles.errorText}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Text>
        <Text style={styles.roleText}>
          Rôle actuel: {userRole}
        </Text>
      </View>
    );
  }

  // Afficher les erreurs d'authentification
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erreur d'authentification</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProtectedRoute;