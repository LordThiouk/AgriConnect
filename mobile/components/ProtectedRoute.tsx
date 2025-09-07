/**
 * Composant de protection des routes - AgriConnect Mobile
 * Vérifie l'authentification et les permissions avant d'afficher le contenu
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'agent' | 'producer';
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const { isAuthenticated, isLoading, user, getUserRole, isPlatformAllowed } = useAuth();

  // Affichage du chargement
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3D944B" />
        <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
      </View>
    );
  }

  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated) {
    return fallback || (
      <View style={styles.errorContainer}>
        <Ionicons name="lock-closed" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>Accès non autorisé</Text>
        <Text style={styles.errorMessage}>
          Vous devez être connecté pour accéder à cette page
        </Text>
      </View>
    );
  }

  // Vérifier si la plateforme est autorisée
  if (!isPlatformAllowed()) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="phone-portrait" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>Plateforme non autorisée</Text>
        <Text style={styles.errorMessage}>
          Votre rôle ne vous permet pas d'accéder à l'application mobile
        </Text>
        <Text style={styles.errorSubMessage}>
          Veuillez utiliser l'interface web pour administrer le système
        </Text>
      </View>
    );
  }

  // Vérifier le rôle requis si spécifié
  if (requiredRole) {
    const userRole = getUserRole();
    if (userRole !== requiredRole) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="shield-checkmark" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Permissions insuffisantes</Text>
          <Text style={styles.errorMessage}>
            Cette page nécessite le rôle "{requiredRole}"
          </Text>
          <Text style={styles.errorSubMessage}>
            Votre rôle actuel : {userRole}
          </Text>
        </View>
      );
    }
  }

  // Toutes les vérifications sont passées, afficher le contenu
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  errorSubMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProtectedRoute;
