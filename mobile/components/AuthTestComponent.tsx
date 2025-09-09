/**
 * Auth Test Component - AgriConnect Mobile
 * Composant de test pour valider l'authentification mobile
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useMobileAuth } from '../hooks/useMobileAuth';
import { Ionicons } from '@expo/vector-icons';

export const AuthTestComponent: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    userRole,
    canAccessMobile,
    phone,
    error,
    isAgent,
    isProducer,
    permissions,
    getUserDisplayName,
    getUserRoleDisplayName,
    sendOTP,
    verifyOTP,
    signOut,
    clearError,
  } = useMobileAuth();

  const [testPhone, setTestPhone] = useState('+221701234567');
  const [testOTP, setTestOTP] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);

  const handleSendOTP = async () => {
    if (!testPhone.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone');
      return;
    }

    setIsSendingOTP(true);
    try {
      const result = await sendOTP(testPhone.trim());
      if (result.success) {
        Alert.alert('Succès', 'Code OTP envoyé avec succès');
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de l\'envoi de l\'OTP');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de l\'envoi de l\'OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!testPhone.trim() || !testOTP.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le numéro et le code OTP');
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const result = await verifyOTP(testPhone.trim(), testOTP.trim());
      if (result.success) {
        Alert.alert('Succès', 'Connexion réussie !');
        setTestOTP('');
      } else {
        Alert.alert('Erreur', result.error || 'Code OTP incorrect');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la vérification de l\'OTP');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Succès', 'Déconnexion réussie');
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la déconnexion');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test d'Authentification Mobile</Text>

      {/* État de l'authentification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de l'authentification</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Authentifié:</Text>
            <Text style={[styles.statusValue, { color: isAuthenticated ? '#4CAF50' : '#F44336' }]}>
              {isAuthenticated ? 'Oui' : 'Non'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Accès mobile:</Text>
            <Text style={[styles.statusValue, { color: canAccessMobile ? '#4CAF50' : '#F44336' }]}>
              {canAccessMobile ? 'Oui' : 'Non'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Rôle:</Text>
            <Text style={styles.statusValue}>{getUserRoleDisplayName()}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Téléphone:</Text>
            <Text style={styles.statusValue}>{phone || 'Non disponible'}</Text>
          </View>
          {error && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Erreur:</Text>
              <Text style={[styles.statusValue, { color: '#F44336' }]}>{error}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Rôles et permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rôles et permissions</Text>
        <View style={styles.permissionsContainer}>
          <View style={styles.permissionRow}>
            <Ionicons name={isAgent ? 'checkmark-circle' : 'close-circle'} size={20} color={isAgent ? '#4CAF50' : '#F44336'} />
            <Text style={styles.permissionText}>Agent de terrain</Text>
          </View>
          <View style={styles.permissionRow}>
            <Ionicons name={isProducer ? 'checkmark-circle' : 'close-circle'} size={20} color={isProducer ? '#4CAF50' : '#F44336'} />
            <Text style={styles.permissionText}>Producteur</Text>
          </View>
          <View style={styles.permissionRow}>
            <Ionicons name={permissions.canManageProducers ? 'checkmark-circle' : 'close-circle'} size={20} color={permissions.canManageProducers ? '#4CAF50' : '#F44336'} />
            <Text style={styles.permissionText}>Gérer les producteurs</Text>
          </View>
          <View style={styles.permissionRow}>
            <Ionicons name={permissions.canManagePlots ? 'checkmark-circle' : 'close-circle'} size={20} color={permissions.canManagePlots ? '#4CAF50' : '#F44336'} />
            <Text style={styles.permissionText}>Gérer les parcelles</Text>
          </View>
          <View style={styles.permissionRow}>
            <Ionicons name={permissions.canViewOwnData ? 'checkmark-circle' : 'close-circle'} size={20} color={permissions.canViewOwnData ? '#4CAF50' : '#F44336'} />
            <Text style={styles.permissionText}>Voir ses données</Text>
          </View>
        </View>
      </View>

      {/* Test d'authentification */}
      {!isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test d'authentification</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Numéro de téléphone:</Text>
            <TextInput
              style={styles.input}
              value={testPhone}
              onChangeText={setTestPhone}
              placeholder="+221701234567"
              keyboardType="phone-pad"
              editable={!isSendingOTP}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isSendingOTP && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isSendingOTP}
          >
            <Text style={styles.buttonText}>
              {isSendingOTP ? 'Envoi en cours...' : 'Envoyer OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Code OTP:</Text>
            <TextInput
              style={styles.input}
              value={testOTP}
              onChangeText={setTestOTP}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              editable={!isVerifyingOTP}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isVerifyingOTP && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isVerifyingOTP}
          >
            <Text style={styles.buttonText}>
              {isVerifyingOTP ? 'Vérification...' : 'Vérifier OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Se déconnecter</Text>
          </TouchableOpacity>

          {error && (
            <TouchableOpacity style={styles.secondaryButton} onPress={clearError}>
              <Text style={styles.secondaryButtonText}>Effacer l'erreur</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D944B',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statusContainer: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
  },
  permissionsContainer: {
    gap: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#212121',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#212121',
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#3D944B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3D944B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#3D944B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthTestComponent;
