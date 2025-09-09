/**
 * Écran de sélection de rôle - AgriConnect
 * Permet à l'utilisateur de choisir entre producteur et agent
 * Les agents nécessitent une validation admin
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { createUserProfile } from '../../lib/auth/mobileAuthService';
import { Ionicons } from '@expo/vector-icons';
import type { UserRole } from '../../../types/user';

const RoleSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { user, session, refreshAuth } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleRoleSelection = async (role: UserRole) => {
    if (!user || !session) {
      Alert.alert('Erreur', 'Session utilisateur introuvable');
      return;
    }

    setSelectedRole(role);
    setIsCreatingProfile(true);

    try {
      console.log('🎯 [ROLE] Sélection du rôle:', role);
      
      // Créer le profil avec le rôle sélectionné
      const profileCreated = await createUserProfile(user, role);
      
      if (profileCreated) {
        console.log('✅ [ROLE] Profil créé avec succès, actualisation de l\'auth...');
        
        // Actualiser l'authentification pour récupérer le nouveau rôle
        await refreshAuth();
        
        // Rediriger selon le rôle
        if (role === 'agent') {
          router.replace('/(auth)/agent-pending');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        console.log('❌ [ROLE] Échec de la création du profil');
        Alert.alert(
          'Erreur', 
          'Impossible de créer votre profil. Veuillez réessayer.'
        );
      }
    } catch (error) {
      console.log('❌ [ROLE] Exception lors de la création du profil:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const handleAgentSelection = () => {
    Alert.alert(
      'Validation Admin Requise',
      'Pour devenir agent de terrain, votre compte doit être validé par un administrateur. Voulez-vous continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        {
          text: 'Continuer',
          onPress: () => handleRoleSelection('agent')
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header identique au login */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoRow}>
            <Ionicons name="leaf" size={24} color="#3D944B" />
            <Text style={styles.logoText}>AgriConnect</Text>
          </View>
          <View style={styles.mainIcon}>
            <Ionicons name="leaf" size={40} color="white" />
          </View>
          <Text style={styles.pageTitle}>Choisissez votre rôle</Text>
          <Text style={styles.pageSubtitle}>Sélectionnez votre profil pour continuer</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.roleContainer}>
          <Text style={styles.instructionText}>
            Sélectionnez votre rôle pour continuer
          </Text>

          {/* Producteur */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'producer' && styles.roleCardSelected
            ]}
            onPress={() => handleRoleSelection('producer')}
            disabled={isCreatingProfile}
          >
            <View style={styles.roleIcon}>
              <Ionicons 
                name="person" 
                size={40} 
                color={selectedRole === 'producer' ? '#3D944B' : '#666'} 
              />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[
                styles.roleTitle,
                selectedRole === 'producer' && styles.roleTitleSelected
              ]}>
                Producteur
              </Text>
              <Text style={styles.roleDescription}>
                Suivez vos parcelles, recevez des conseils et gérez votre exploitation agricole
              </Text>
            </View>
            {selectedRole === 'producer' && (
              <Ionicons name="checkmark-circle" size={24} color="#3D944B" />
            )}
          </TouchableOpacity>

          {/* Agent */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'agent' && styles.roleCardSelected
            ]}
            onPress={handleAgentSelection}
            disabled={isCreatingProfile}
          >
            <View style={styles.roleIcon}>
              <Ionicons 
                name="people" 
                size={40} 
                color={selectedRole === 'agent' ? '#3D944B' : '#666'} 
              />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[
                styles.roleTitle,
                selectedRole === 'agent' && styles.roleTitleSelected
              ]}>
                Agent de Terrain
              </Text>
              <Text style={styles.roleDescription}>
                Collectez des données, suivez les producteurs et gérez les parcelles
              </Text>
              <View style={styles.validationBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#FF6B35" />
                <Text style={styles.validationText}>Validation admin requise</Text>
              </View>
            </View>
            {selectedRole === 'agent' && (
              <Ionicons name="checkmark-circle" size={24} color="#3D944B" />
            )}
          </TouchableOpacity>

          {/* Informations */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3D944B" />
            <Text style={styles.infoText}>
              Votre rôle détermine les fonctionnalités disponibles dans l’application. 
              Vous pourrez le modifier plus tard en contactant un administrateur.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isCreatingProfile && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3D944B" />
            <Text style={styles.loadingText}>Création de votre profil...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  mainIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#3D944B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  roleContainer: {
    paddingVertical: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: '#3D944B',
    backgroundColor: '#F0F8F0',
  },
  roleIcon: {
    marginRight: 15,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  roleTitleSelected: {
    color: '#3D944B',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  validationText: {
    fontSize: 12,
    color: '#FF6B35',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 15,
  },
});

export default RoleSelectionScreen;
