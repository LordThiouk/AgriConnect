import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { View, StyleSheet } from 'react-native';
import HeaderGlobal from '../components/HeaderGlobal';
import SubHeader from '../components/SubHeader';
import { useAuth } from '../context/AuthContext';
import { usePathname, useRouter } from 'expo-router';

function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Déterminer le titre du sous-header basé sur la route
  const getSubHeaderTitle = () => {
    if (pathname.includes('/parcelles')) {
      if (pathname.includes('/cultures')) {
        if (pathname.includes('/add')) return 'Ajouter Culture';
        if (pathname.includes('/edit')) return 'Modifier Culture';
        return 'Cultures';
      }
      if (pathname.includes('/observations')) {
        if (pathname.includes('/add')) return 'Ajouter Observation';
        return 'Observations';
      }
      if (pathname.includes('/operations')) {
        if (pathname.includes('/add')) return 'Ajouter Opération';
        return 'Opérations';
      }
      if (pathname.includes('/intrants')) {
        if (pathname.includes('/add')) return 'Ajouter Intrant';
        return 'Intrants';
      }
      if (pathname.includes('/intervenants')) return 'Intervenants';
      if (pathname.includes('/conseils')) {
        if (pathname.includes('/add')) return 'Ajouter Conseil';
        return 'Conseils';
      }
      // Si c'est une parcelle spécifique (avec plotId) mais pas un sous-répertoire
      if (pathname.match(/\/parcelles\/[^\/]+$/)) return 'Détails Parcelle';
      return 'Parcelles';
    }
    if (pathname.includes('/collecte')) {
      if (pathname.includes('/fiches')) {
        if (pathname.includes('/create')) return 'Créer Fiche';
        if (pathname.includes('/parcelles')) {
          if (pathname.includes('/add')) return 'Ajouter Parcelle';
          return 'Parcelles de la Fiche';
        }
        return 'Fiches d\'Exploitation';
      }
      return 'Collecte';
    }
    // Observations globales (onglet principal)
    if (pathname === '/(tabs)/observations') return 'Observations';
    if (pathname.includes('/profile')) return 'Profil';
    if (pathname.includes('/agent-dashboard')) return 'Tableau de Bord Agent';
    if (pathname.includes('/producer-dashboard')) return 'Tableau de Bord Producteur';
    if (pathname.includes('/visite-form')) return 'Nouvelle Visite';
    return '';
  };

  // Déterminer si on doit afficher le bouton retour
  const shouldShowBackButton = () => {
    // Ne pas afficher le bouton retour pour les onglets principaux
    if (pathname === '/(tabs)/observations') return false;
    if (pathname === '/(tabs)/parcelles') return false;
    
    // Afficher le bouton retour pour les sous-pages
    return pathname.includes('/dashboard') || 
           pathname.includes('/operations') || 
           pathname.includes('/intrants') || 
           pathname.includes('/intervenants') || 
           pathname.includes('/conseils') ||
           pathname.includes('/cultures') ||
           pathname.includes('/fiches') ||
           pathname.includes('/create') ||
           pathname.includes('/add') ||
           pathname.includes('/edit') ||
           pathname.includes('/visite-form') ||
           // Pour les observations dans les parcelles (sous-écran)
           (pathname.includes('/parcelles') && pathname.includes('/observations')) ||
           // Pour les parcelles spécifiques (avec plotId) qui ne sont pas la page principale
           (pathname.match(/\/parcelles\/[^\/]+$/) && !pathname.endsWith('/parcelles'));
  };

  const subHeaderTitle = getSubHeaderTitle();
  const showSubHeader = isAuthenticated && !isLoading && subHeaderTitle !== '';
  const showBackButton = shouldShowBackButton();

  return (
    <View style={styles.container}>
      {isAuthenticated && !isLoading && (
        <HeaderGlobal />
      )}
      {showSubHeader && (
        <SubHeader 
          title={subHeaderTitle} 
          showBackButton={showBackButton || false}
          onBackPress={() => {
            // Navigation personnalisée pour les parcelles spécifiques
            if (pathname.match(/\/parcelles\/[^\/]+$/)) {
              router.push('/(tabs)/parcelles');
            } else {
              router.back();
            }
          }}
        />
      )}
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
