/**
 * Point d'entrée principal de l'application mobile - AgriConnect
 * Gère la redirection vers la page de login ou l'application selon l'état d'authentification
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '../../types/user';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, canAccessMobile, userRole } = useAuth();

  // Fonction pour déterminer la route de redirection basée sur le rôle
  // L'app mobile est uniquement pour producteurs et agents
  const getRedirectRoute = (role: UserRole | null) => {
    switch (role) {
      case 'producer':
        return '/(tabs)/producer-dashboard' as any;
      case 'agent':
        return '/(tabs)/test-redirect' as any; // Test temporaire
      default:
        return '/(tabs)/test-redirect' as any; // Test temporaire
    }
  };

  useEffect(() => {
    console.log('🔄 [NAVIGATION] useEffect déclenché avec:', {
      isLoading,
      isAuthenticated,
      canAccessMobile,
      userRole
    });
    
    if (!isLoading) {
      if (isAuthenticated && canAccessMobile) {
        // Utilisateur authentifié et autorisé pour mobile
        const redirectRoute = getRedirectRoute(userRole);
        console.log('🔄 [NAVIGATION] Redirection vers:', redirectRoute, 'pour le rôle:', userRole);
        
        // Ajouter un petit délai pour s'assurer que l'état est bien propagé
        setTimeout(() => {
          console.log('🚀 [NAVIGATION] Exécution de la redirection...');
          router.replace(redirectRoute);
        }, 100);
      } else if (isAuthenticated && !canAccessMobile) {
        // Utilisateur authentifié mais pas autorisé pour mobile
        if (!userRole) {
          // Pas de rôle = pas de profil, rediriger vers sélection de rôle
          console.log('👤 [NAVIGATION] Pas de rôle, redirection vers sélection de rôle...');
          router.replace('/(auth)/role-selection');
        } else {
          // Rôle non autorisé pour mobile
          console.log('❌ [NAVIGATION] Utilisateur non autorisé pour mobile, rôle:', userRole);
          router.replace('/(auth)/login');
        }
      } else {
        // Utilisateur non authentifié
        console.log('🔐 [NAVIGATION] Utilisateur non authentifié, redirection vers login');
        router.replace('/(auth)/login');
      }
    } else {
      console.log('⏳ [NAVIGATION] Chargement en cours, attente...');
    }
  }, [isAuthenticated, isLoading, canAccessMobile, userRole, router]);

  // Affichage de chargement pendant la vérification de l'authentification
  return (
    <View style={styles.container}>
      <View style={styles.loadingContent}>
        <Ionicons name="leaf" size={80} color="#3D944B" />
        <ActivityIndicator 
          size="large" 
          color="#3D944B" 
          style={styles.spinner}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    marginTop: 20,
  },
});
