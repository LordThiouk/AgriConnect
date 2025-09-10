import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { isLoading, userRole } = useAuth();
  const showProducer = !isLoading && userRole === 'producer';
  const showAgent = !isLoading && userRole === 'agent';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      
      {/* Tableaux de bord spécifiques par rôle - Mobile uniquement */}
      <Tabs.Screen
        name="producer-dashboard"
        options={{
          title: 'Mon Tableau de Bord',
          href: showProducer ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="agent-dashboard"
        options={{
          title: 'Tableau de Bord',
          href: showAgent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
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
        }}
      />

      {/* Collecte - Pour les agents uniquement */}
      <Tabs.Screen
        name="collecte"
        options={{
          title: 'Collecte',
          href: showAgent ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
          headerShown: false, // Désactiver le header des tabs pour permettre le header personnalisé
        }}
      />

      {/* Carte - GPS et localisation */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
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
        }}
      />

      {/* Debug - hors des onglets */}
      <Tabs.Screen name="debug" options={{ href: null }} />
    </Tabs>
  );
}
