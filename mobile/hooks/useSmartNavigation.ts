import { useRouter, usePathname } from 'expo-router';
import { useMemo } from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
  isClickable: boolean;
}

export interface NavigationContext {
  getBackRoute: () => string;
  getBreadcrumbs: () => BreadcrumbItem[];
  canGoBack: () => boolean;
}

// Configuration des routes avec leurs parents et labels
const routeConfig = {
  // Routes principales
  '/': { parent: null, label: 'Accueil' },
  '/(tabs)': { parent: null, label: 'Accueil' },
  '/(tabs)/agent-dashboard': { parent: null, label: 'Dashboard' },
  '/(tabs)/index': { parent: null, label: 'Accueil' },
  
  // Routes parcelles
  '/(tabs)/parcelles': { parent: null, label: 'Parcelles' },
  '/(tabs)/parcelles/[plotId]': { parent: '/(tabs)/parcelles', label: 'Détail Parcelle' },
  '/(tabs)/parcelles/[plotId]/observations': { parent: '/(tabs)/parcelles/[plotId]', label: 'Observations' },
  '/(tabs)/parcelles/[plotId]/observations/add': { parent: '/(tabs)/parcelles/[plotId]/observations', label: 'Nouvelle Observation' },
  '/(tabs)/parcelles/[plotId]/operations': { parent: '/(tabs)/parcelles/[plotId]', label: 'Opérations' },
  '/(tabs)/parcelles/[plotId]/operations/add': { parent: '/(tabs)/parcelles/[plotId]/operations', label: 'Nouvelle Opération' },
  '/(tabs)/parcelles/[plotId]/cultures': { parent: '/(tabs)/parcelles/[plotId]', label: 'Cultures' },
  '/(tabs)/parcelles/[plotId]/cultures/add': { parent: '/(tabs)/parcelles/[plotId]/cultures', label: 'Nouvelle Culture' },
  '/(tabs)/parcelles/[plotId]/intervenants': { parent: '/(tabs)/parcelles/[plotId]', label: 'Intervenants' },
  '/(tabs)/parcelles/[plotId]/intervenants/add': { parent: '/(tabs)/parcelles/[plotId]/intervenants', label: 'Nouvel Intervenant' },
  
  // Routes observations globales
  '/(tabs)/observations': { parent: null, label: 'Observations' },
  
  // Routes visites
  '/(tabs)/visite-form': { parent: null, label: 'Nouvelle Visite' },
  
  // Routes profil
  '/(tabs)/profile': { parent: null, label: 'Profil' },
  
  // Routes collecte
  '/(tabs)/collecte': { parent: null, label: 'Collecte' },
};

// Fonction pour trouver la configuration d'une route
const findRouteConfig = (pathname: string) => {
  // Recherche exacte d'abord
  if (routeConfig[pathname]) {
    return routeConfig[pathname];
  }
  
  // Recherche par pattern pour les routes dynamiques
  const segments = pathname.split('/').filter(Boolean);
  
  // Patterns de routes dynamiques
  const dynamicPatterns = [
    '/(tabs)/parcelles/[plotId]',
    '/(tabs)/parcelles/[plotId]/observations',
    '/(tabs)/parcelles/[plotId]/observations/add',
    '/(tabs)/parcelles/[plotId]/operations',
    '/(tabs)/parcelles/[plotId]/operations/add',
    '/(tabs)/parcelles/[plotId]/cultures',
    '/(tabs)/parcelles/[plotId]/cultures/add',
    '/(tabs)/parcelles/[plotId]/intervenants',
    '/(tabs)/parcelles/[plotId]/intervenants/add',
  ];
  
  for (const pattern of dynamicPatterns) {
    const patternSegments = pattern.split('/').filter(Boolean);
    
    if (segments.length === patternSegments.length) {
      let matches = true;
      for (let i = 0; i < segments.length; i++) {
        if (patternSegments[i] !== '[plotId]' && patternSegments[i] !== segments[i]) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        return routeConfig[pattern];
      }
    }
  }
  
  return null;
};

// Fonction pour générer le chemin parent avec les paramètres dynamiques
const generateParentPath = (currentPath: string, parentPattern: string): string => {
  if (!parentPattern) return '/';
  
  const currentSegments = currentPath.split('/').filter(Boolean);
  const parentSegments = parentPattern.split('/').filter(Boolean);
  
  // Si le parent contient [plotId], on doit extraire la valeur du chemin actuel
  if (parentPattern.includes('[plotId]')) {
    const plotIdIndex = parentSegments.findIndex(segment => segment === '[plotId]');
    if (plotIdIndex !== -1 && currentSegments[plotIdIndex]) {
      const plotId = currentSegments[plotIdIndex];
      return parentPattern.replace('[plotId]', plotId);
    }
  }
  
  return parentPattern;
};

export const useSmartNavigation = (): NavigationContext => {
  const router = useRouter();
  const pathname = usePathname();

  const getBackRoute = (): string => {
    const segments = pathname.split('/').filter(Boolean);
    const currentPath = `/${segments.join('/')}`;
    
    // Règles de navigation intelligente
    if (currentPath.includes('/add')) {
      // Si on est sur /add, retourner vers l'index du dossier parent
      const parentSegments = segments.slice(0, -1);
      return `/${parentSegments.join('/')}`;
    }
    
    // Navigation basée sur la configuration
    const config = findRouteConfig(currentPath);
    if (config?.parent) {
      return generateParentPath(currentPath, config.parent);
    }
    
    // Navigation par défaut
    return router.back();
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const currentPath = `/${segments.join('/')}`;
    
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentRoute = currentPath;
    
    // Construire la chaîne de breadcrumbs en remontant la hiérarchie
    while (currentRoute && currentRoute !== '/') {
      const config = findRouteConfig(currentRoute);
      
      if (config) {
        breadcrumbs.unshift({
          label: config.label,
          path: currentRoute,
          isActive: currentRoute === currentPath,
          isClickable: currentRoute !== currentPath,
        });
        
        if (config.parent) {
          currentRoute = generateParentPath(currentRoute, config.parent);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // Ajouter l'accueil au début si ce n'est pas déjà là
    if (breadcrumbs.length === 0 || breadcrumbs[0].path !== '/') {
      breadcrumbs.unshift({
        label: 'Accueil',
        path: '/',
        isActive: currentPath === '/',
        isClickable: currentPath !== '/',
      });
    }
    
    return breadcrumbs;
  };

  const canGoBack = (): boolean => {
    const config = findRouteConfig(pathname);
    return config?.parent !== null;
  };

  return useMemo(() => ({
    getBackRoute,
    getBreadcrumbs,
    canGoBack,
  }), [pathname, router]);
};
