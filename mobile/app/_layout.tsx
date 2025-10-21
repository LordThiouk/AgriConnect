import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
// import { View } from 'react-native'; // Supprimé - utilisation de NativeBase
// import HeaderGlobal from '../components/HeaderGlobal'; // Supprimé - remplacé par ScreenContainer
// import SubHeader from '../components/SubHeader'; // Supprimé - remplacé par ScreenContainer
import { NativeBaseProvider, Box } from 'native-base';
import { BackHandler } from 'react-native';
import { agriconnectTheme } from '../theme/agriconnect';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FormActivityProvider } from '../context/FormActivityContext';
import { useEffect } from 'react';
import { agriConnectCache } from '../lib/services/core/cache';
import { enableFreeze } from 'react-native-screens';

// Activer le gel des écrans inactifs pour toute l'application
// C'est la solution la plus robuste pour éviter les re-rendus en arrière-plan
// qui volent le focus du clavier.
enableFreeze(true);

function RootLayout() {
  // Layout simplifié - tous les écrans utilisent maintenant ScreenContainer

  // Initialiser le cache au démarrage de l'application
  useEffect(() => {
    // BackHandler removeEventListener shim for RN >= 0.72 compatibility
    if (!(BackHandler as any).removeEventListener && (BackHandler as any).addEventListener) {
      (BackHandler as any).removeEventListener = (_eventName: string, subscription: { remove: () => void } | (() => void)) => {
        if (typeof subscription === 'function') {
          try { subscription(); } catch {}
          return;
        }
        try { subscription?.remove?.(); } catch {}
      };
    }
    const initializeCache = async () => {
      try {
        await agriConnectCache.initialize();
        console.log('✅ [CACHE] Cache initialisé au démarrage de l\'application');
      } catch (error) {
        console.error('❌ [CACHE] Erreur lors de l\'initialisation du cache:', error);
      }
    };

    initializeCache();
  }, []);

  return (
    <Box flex={1} bg="gray.50">
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </Box>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
             <NativeBaseProvider theme={agriconnectTheme}>
        <AuthProvider>
          <FormActivityProvider>
            <RootLayout />
          </FormActivityProvider>
        </AuthProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}

// Styles supprimés - utilisation de NativeBase
