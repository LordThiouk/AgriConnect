/**
 * Écran de débogage de l'authentification - AgriConnect
 * Affiche l'état détaillé de l'authentification pour le débogage
 */

import React from 'react';
import { Stack } from 'expo-router';
import AuthDebugger from '../../components/AuthDebugger';

export default function DebugScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Debug Auth' }} />
      <AuthDebugger />
    </>
  );
}
