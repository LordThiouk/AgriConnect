import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from 'native-base';

export default function TabLayout() {
  const { isLoading, userRole } = useAuth();
  const theme = useTheme();
  const showProducer = !isLoading && userRole === 'producer';
  const showAgent = !isLoading && userRole === 'agent';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary?.[500] || '#3D944B',
        tabBarInactiveTintColor: theme.colors.gray?.[500] || '#6b7280',
        tabBarStyle: {
          backgroundColor: theme.colors.white || '#ffffff',
          borderTopColor: theme.colors.gray?.[200] || '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: theme.space?.[2] || 8,
          paddingTop: theme.space?.[2] || 8,
          height: theme.sizes?.[20] || 64,
        },
        headerShown: false, // Désactiver tous les headers par défaut
        lazy: true, // Ne monte l'écran que lorsqu'il est focalisé
        detachInactiveScreens: true, // Détache les écrans non actifs pour réduire le coût
        freezeOnBlur: true, // Gèle l'écran quand il n'est pas focalisé
      }}>
      
      {/* Tableaux de bord spécifiques par rôle - Mobile uniquement */}
      <Tabs.Screen
        name="producer-dashboard"
        options={{
          title: 'Mon Tableau de Bord',
          href: showProducer ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />

      <Tabs.Screen
        name="agent-dashboard"
        options={{
          title: 'Tableau de Bord',
          href: showAgent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />

      {/* Dashboard par défaut */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />

      {/* Collecte - Pour les agents uniquement */}
      <Tabs.Screen
        name="collecte"
        options={{
          title: 'Collecte',
          href: showAgent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />

      {/* Parcelles - top-level */}
      <Tabs.Screen
        name="parcelles" // Correction: pointe vers le répertoire
        options={{
          title: 'Parcelles',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />


      {/* Observations */}
      <Tabs.Screen
        name="observations"
        options={{
          title: 'Observations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="eye" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />


      {/* Profil - Gestion du compte */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          lazy: true,
          unmountOnBlur: true,
        }}
      />

      {/* Debug - hors des onglets */}
      <Tabs.Screen name="debug" options={{ href: null, lazy: true, unmountOnBlur: true }} />
      
      {/* Visite Form - accessible via navigation programmatique */}
      <Tabs.Screen name="visite-form" options={{ href: null, lazy: true, unmountOnBlur: true }} />
    </Tabs>
  );
}
