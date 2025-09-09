/**
 * Page de test pour vérifier la redirection
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function TestRedirect() {
  const { isAuthenticated, userRole, canAccessMobile, phone } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de Redirection</Text>
      <Text style={styles.info}>Authentifié: {isAuthenticated ? 'Oui' : 'Non'}</Text>
      <Text style={styles.info}>Rôle: {userRole || 'Aucun'}</Text>
      <Text style={styles.info}>Accès mobile: {canAccessMobile ? 'Oui' : 'Non'}</Text>
      <Text style={styles.info}>Téléphone: {phone || 'Aucun'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F6F6F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
});
