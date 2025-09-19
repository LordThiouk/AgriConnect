import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { View, StyleSheet } from 'react-native';
import HeaderGlobal from '../components/HeaderGlobal';
import SubHeader from '../components/SubHeader';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'expo-router';

function RootLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

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
    if (pathname.includes('/observations')) return 'Observations';
    if (pathname.includes('/profile')) return 'Profil';
    if (pathname.includes('/agent-dashboard')) return 'Tableau de Bord Agent';
    if (pathname.includes('/producer-dashboard')) return 'Tableau de Bord Producteur';
    return '';
  };

  // Déterminer si on doit afficher le bouton retour
  const shouldShowBackButton = () => {
    // Afficher le bouton retour pour les sous-pages
    return pathname.includes('/dashboard') || 
           pathname.includes('/observations') || 
           pathname.includes('/operations') || 
           pathname.includes('/intrants') || 
           pathname.includes('/intervenants') || 
           pathname.includes('/conseils') ||
           pathname.includes('/cultures') ||
           pathname.includes('/fiches') ||
           pathname.includes('/create') ||
           pathname.includes('/add') ||
           pathname.includes('/edit') ||
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
        <SubHeader title={subHeaderTitle} showBackButton={showBackButton} />
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
