/**
 * Composant de débogage pour l'authentification - AgriConnect
 * Affiche l'état actuel de l'authentification pour le débogage
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AuthDebugger() {
  const auth = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 Debug Authentification</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État d'Authentification</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Authentifié:</Text>
          <Text style={[styles.value, auth.isAuthenticated ? styles.success : styles.error]}>
            {auth.isAuthenticated ? 'OUI' : 'NON'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Chargement:</Text>
          <Text style={[styles.value, auth.isLoading ? styles.warning : styles.success]}>
            {auth.isLoading ? 'OUI' : 'NON'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Accès Mobile:</Text>
          <Text style={[styles.value, auth.canAccessMobile ? styles.success : styles.error]}>
            {auth.canAccessMobile ? 'AUTORISÉ' : 'REFUSÉ'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Rôle:</Text>
          <Text style={styles.value}>{auth.userRole || 'AUCUN'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{auth.phone || 'NON DÉFINI'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Utilisateur</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{auth.user?.id || 'NON DÉFINI'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{auth.user?.email || 'NON DÉFINI'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Téléphone:</Text>
          <Text style={styles.value}>{auth.user?.phone || 'NON DÉFINI'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{auth.user?.user_metadata?.full_name || 'NON DÉFINI'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Rôle (metadata):</Text>
          <Text style={styles.value}>{auth.user?.user_metadata?.role || 'NON DÉFINI'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations Session</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Session Active:</Text>
          <Text style={[styles.value, auth.session ? styles.success : styles.error]}>
            {auth.session ? 'OUI' : 'NON'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Expire:</Text>
          <Text style={styles.value}>
            {auth.session?.expires_at 
              ? new Date(auth.session.expires_at * 1000).toLocaleString()
              : 'NON DÉFINI'
            }
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Token:</Text>
          <Text style={styles.value}>
            {auth.session?.access_token ? 'PRÉSENT' : 'ABSENT'}
          </Text>
        </View>
      </View>

      {auth.error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Erreur</Text>
          <Text style={styles.errorText}>{auth.error}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions de Test</Text>
        <Text style={styles.infoText}>
          • Vérifiez que l'utilisateur a le bon rôle (agent ou producer)
        </Text>
        <Text style={styles.infoText}>
          • Vérifiez que la session est valide
        </Text>
        <Text style={styles.infoText}>
          • Vérifiez que canAccessMobile est true
        </Text>
        <Text style={styles.infoText}>
          • Vérifiez que isAuthenticated est true
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D944B',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
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
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
    textAlign: 'right',
  },
  success: {
    color: '#10B981',
  },
  error: {
    color: '#EF4444',
  },
  warning: {
    color: '#F59E0B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
