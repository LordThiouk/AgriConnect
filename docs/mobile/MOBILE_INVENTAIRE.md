# AgriConnect — Inventaire du Module Mobile (Expo/React Native)

## 1) Résumé exécutif
Application mobile terrain pour agents et producteurs (consultation), construite avec Expo/React Native + TypeScript. Parcours clés: authentification, tableau de bord agent, collecte offline-first (producteur, parcelle, culture, opérations, observations), carte, recommandations. Backend Supabase (Auth, PostgreSQL + RLS, Storage, RPC/Edge Functions). UI unifiée avec composants `ui/` et NativeBase.

## 2) Stack & configuration
- Expo SDK 54, React Native 0.81, React 19
- Expo Router (navigation par dossiers `app/`)
- NativeBase pour UI + librairie `components/ui/*`
- Supabase JS v2, Expo Secure Store, AsyncStorage
- Cartographie: `react-native-maps` et/ou `expo-maps`
- Media: `expo-camera`, `expo-image-picker`
- Notifications: `expo-notifications`
- Validation: `react-hook-form` + `zod`
- Scripts: `npm run start`, `android`, `ios`, `web`, `reset-project`

## 3) Structure du code (`mobile/`)
- `app/`
  - `(auth)/` login, sélection rôle, agent-pending
  - `(tabs)/` dashboard, collecte, parcelles, observations, profil, etc.
  - routes imbriquées pour parcelles → cultures → opérations/observations
- `components/`
  - `forms/*` (FormField, FormInput, FormSelect, DatePicker, etc.)
  - `ui/*` (Button, Card, Modal, Layout, Tabs, Badge, etc.)
  - cartes: `MapComponent`, `SimpleMapComponent`
  - fiches: `fiche-creation/*`, `visits/*`
- `context/` AuthContext, FormActivityContext
- `hooks/` (useMobileAuth, useSmartNavigation, useAgentDashboard, useFicheCreation, etc.)
- `lib/`
  - `auth/` (mobileAuthService, sessionManager)
  - `services/core/*` (api, cache, interceptors)
  - `services/domain/*` (agents, producers, plots, crops, operations, observations, media, notifications, recommendations, seasons, farmfiles, cooperatives, inputs, visits, intervenants, participants)
  - `hooks/*` data hooks (useProducers, usePlots, useCrops, ...)
  - `offlineQueue.ts`, `location.ts`, `media.ts`, `telemetry.ts`
  - `supabase-client.ts`, `supabase.ts`
- `types/` (database, collecte, fiche-creation, core types)

## 4) Parcours & fonctionnalités
### 4.1 Authentification
- Écrans `(auth)/login.tsx` et `role-selection.tsx`
- Gestion rôles: agent, responsable, admin (producteurs sans login)
- Session: `AuthContext`, `mobileAuthService`, `sessionManager`

### 4.2 Tableau de bord Agent `(tabs)/agent-dashboard.tsx`
- KPIs: visites prévues, à synchroniser, recommandations
- Listes: visites récentes, observations, opérations
- Actions rapides: démarrer collecte, ajouter observation/operation
- Filtres par statut/date/coop (via `VisitFilterModal`, `visits/*`)

### 4.3 Collecte terrain `(tabs)/collecte/*`
- Fiche producteur, parcelle, culture (création/édition)
- Opérations: semis, fertilisation, irrigation, récolte
- Observations: levée, ravageurs, maladies (+ photos)
- Formulaires unifiés via `components/forms/*` et validation

### 4.4 Parcelles & Cultures `(tabs)/parcelles/*`
- Navigation: parcelle → cultures → opérations/observations → intrants/intervenants/conseils
- Carto: affichage parcelles (Point/Polygon), GPS
- Détails: onglets cultures/opérations/observations/conseils

### 4.5 Observations `(tabs)/observations`
- Liste filtrable et triable
- Ajout observation rapide avec `PhotoPicker`

### 4.6 Profil `(tabs)/profile.tsx`
- Détails compte, région/coop, déconnexion

## 5) Offline-first & synchronisation
- Cache local: `lib/services/core/cache.ts` + `domain/*/*.cache.ts`
- File d’attente: `lib/offlineQueue.ts` (envoi différé)
- Stratégies: write-behind, retry, résolution de conflits
- Storage sécurisé: Expo Secure Store pour tokens, AsyncStorage pour données temporaires

## 6) Accès données & services (Supabase)
- `lib/services/core/api.ts`: client typé + interceptors + gestion erreurs
- Domain services: `domain/*/*.service.ts` (producers, plots, crops, operations, observations, ...)
- Hooks data: `lib/hooks/use*.ts` pour usage dans écrans
- RPC & RLS: appels encapsulés côté service pour respecter policies

## 7) UI/UX patterns
- Règle: privilégier NativeBase + `components/ui/*` (thème)
- Layouts: `ui/layout/*` (Container, Header, Content, Footer)
- Formulaires: `forms/*` + `FormContainer` + `FormFooter`
- Navigation: Expo Router + TabBar custom (`ui/navigation/TabBar.tsx`)
- Media: `PhotoGallery`, `ImagePicker`, zoom viewer
- Accessibilité: gestion clavier (`KeyboardManager`), tailles tactiles, feedback haptique

## 8) Sécurité mobile
- Auth JWT via Supabase; session sécurisée (Secure Store)
- RLS côté backend; l’app n’expose pas de secrets
- Contrôles intégrés: double saisie, GPS incohérent, producteur inactif (via services et hooks)

## 9) Performance & Télémétrie
- Optimisations: cache par domaine, pagination/filtrage server-side
- Télémétrie: `lib/telemetry.ts` (durées, erreurs, request_id)
- Images: compression côté client (Expo Image), upload avec mesure

## 10) Roadmap mobile
- Amélioration carte: clustering, fonds offline
- Routines de sync ciblées + détecteur de conflits
- Filtres avancés sur dashboard agent + widgets KPI
- Internationalisation
- Tests E2E (Detox) et scénarios offline/online

## 11) Démarrage & build
- Config: `env.example` → `.env` (URL/clé Supabase)
- Lancer: `npm i && npm run start` (Expo Go / Dev Client)
- Android/iOS: `npm run android` / `npm run ios`
- Web: `npm run web` (tests rapides)
