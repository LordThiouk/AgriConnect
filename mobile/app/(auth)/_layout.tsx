/**
 * Layout pour les écrans d'authentification
 * Masque le header par défaut d'Expo Router
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Masque le header par défaut
      }}
    />
  );
}
