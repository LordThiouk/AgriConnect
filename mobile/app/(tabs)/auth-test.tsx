/**
 * Auth Test Screen - AgriConnect Mobile
 * Écran de test pour valider l'authentification mobile
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthTestComponent } from '../../components/AuthTestComponent';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function AuthTestScreen() {
  return (
    <View style={styles.container}>
      <ProtectedRoute requireAuth={false}>
        <AuthTestComponent />
      </ProtectedRoute>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
});
