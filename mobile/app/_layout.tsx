import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
// import { View } from 'react-native'; // Supprimé - utilisation de NativeBase
// import HeaderGlobal from '../components/HeaderGlobal'; // Supprimé - remplacé par ScreenContainer
// import SubHeader from '../components/SubHeader'; // Supprimé - remplacé par ScreenContainer
import { NativeBaseProvider, Box } from 'native-base';
import { agriconnectTheme } from '../theme/agriconnect';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { agriConnectCache } from '../lib/services/core/cache';

function RootLayout() {
  // Layout simplifié - tous les écrans utilisent maintenant ScreenContainer

  // Initialiser le cache au démarrage de l'application
  useEffect(() => {
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
          <RootLayout />
        </AuthProvider>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}

// Styles supprimés - utilisation de NativeBase
