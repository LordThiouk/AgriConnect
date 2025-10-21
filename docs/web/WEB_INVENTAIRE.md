# AgriConnect — Inventaire du Module Web

## 1) Résumé exécutif
Le module Web AgriConnect est une application d’administration et de supervision bâtie avec React + Vite. Il sert les rôles superviseur/admin/coop_admin pour piloter les producteurs, agents, parcelles/cultures, règles/alertes et campagnes. Il s’appuie sur Supabase (PostgreSQL, Auth, RLS, RPC) et propose des interfaces de gestion modernes (tables, filtres, modals), des KPIs, des graphiques et des cartes (Leaflet/PostGIS).

## 2) Stack et configuration
- React 18 + TypeScript, bundling via Vite
- UI: Tailwind CSS + Radix UI (dialogs, dropdowns, tabs, switches, etc.)
- Navigation: React Router 6
- Données: Supabase JS v2 + React Query
- Visualisation: Recharts (graphiques), Leaflet + React-Leaflet (cartes)
- Utilitaires: date-fns, zod, clsx, tailwind-merge
- Scripts `package.json` (extraits):
  - `dev`, `build`, `preview`, `lint`
- Env: `web/env.example`, `web/env.production.example`

## 3) Structure du code (répertoire `web/`)
- `src/pages/`
  - `Dashboard.tsx`, `Dashboard_new.tsx`, `Dashboard_old.tsx`
  - `producers/index.tsx`, `cooperatives/index.tsx`, `agents/index.tsx`, `plots/index.tsx`, `alerts/index.tsx`
  - `auth/Login.tsx`, `auth/Signup.tsx`, `Login.tsx`, `ResetPassword.tsx`
  - `Campaigns.tsx`, `Debug.tsx`, `Privacy.tsx`, `Terms.tsx`, `NotFound.tsx`
- `src/components/`
  - `Layout/` (Header, Sidebar, Layout)
  - `dashboard/` (KPICard, MapPanel, charts)
  - `Agents/` (AgentModal, AgentDetailsModal, DeleteAgentModal, AgentAssignmentModal)
  - `Cooperatives/` (table, filtres, carte, pagination)
  - `Plots/` (PlotModal, PlotDetailsModal, CropModal, OperationModal, PlotsLeafletMap)
  - `Alerts/` (AlertesTab, AgriRulesTab, NotificationsTab, modals et badges)
  - `ui/` (boutons, inputs, cartes, dialogues réutilisables)
- `src/services/` (accès données typé Supabase)
  - `producersService.ts`, `cooperativesService.ts`, `agentsService.ts`
  - `plotsService.ts`, `cropsService.ts`, `operationsService.ts`, `operationsRpcService.ts`
  - `alertsService.ts`, `observationsService.ts`, `observationsRpcService.ts`
  - `dashboardService.ts`, `farmFilesService.ts`, `campaignsService.ts`, `sessionManager.ts`, `webAuthService.ts`
- `src/context/`
  - `AuthContext.tsx`, `ToastContext.tsx`
- `src/lib/`
  - `supabase.ts`, `utils.ts`
- `src/config/`
  - `appConfig.ts`
- `src/types/`
  - `database.ts`, `index.ts`

Références mémoire: `.cursor/memory-bank/web-development.md`, `web-development-plan.md`.

## 4) Fonctionnalités par domaine
### 4.1 Dashboard
- KPIs (cartes KPI), graphiques (Recharts), carte (MapPanel)
- Sources via `dashboardService.ts`

### 4.2 Producteurs (`/producers`)
- CRUD complet, pagination, recherche/tri, filtres (coop, zone, statut)
- Tableaux avec actions inline, modals d’édition
- Services: `producersService.ts`

### 4.3 Coopératives (`/cooperatives`)
- CRUD, filtres avancés (région/département/commune), pagination
- Statistiques par coopérative
- Vue carte: `CooperativesMap.tsx` (Leaflet/PostGIS)
- Services: `cooperativesService.ts`

### 4.4 Agents (`/agents`)
- CRUD, affectation de producteurs (AgentAssignmentModal)
- Détails agent (onglets), performance (KPIs, classements)
- Services + RPC: `agentsService.ts`

### 4.5 Parcelles & Cultures (`/plots`)
- CRUD parcelles et cultures, détails parcelle (onglets)
- Carte Leaflet avec géolocalisation réelle
- Suppression en cascade sécurisée (via RPC)
- Services + RPC: `plotsService.ts`, `cropsService.ts`, `operationsRpcService.ts`

### 4.6 Alertes, Règles, Notifications (`/alerts`)
- 3 onglets: Alertes, Règles métier (`agri_rules`), Notifications
- CRUD complet: recommandations, règles, notifications (renvoi inclus)
- Badges: priorité, statut, sévérité; filtres + recherche + pagination
- Modals dédiés (création/édition/détails)
- Service + RPC: `alertsService.ts`

### 4.7 Authentification & Sécurité Web
- Pages `auth/Login.tsx`, `Signup.tsx` + `ProtectedRoute.tsx`
- `AuthContext.tsx` (session, rôles), `sessionManager.ts`, `webAuthService.ts`

## 5) Données, RPC & pagination
- Accès via services `src/services/*.ts`, réponses typées (`src/types/`)
- Pagination serveur (pages/taille), filtres combinables (coop, région, etc.)
- RPC clés (exemples, selon mémoire/implémentation):
  - Alertes: `create_recommendation`, `update_recommendation`, `delete_recommendation`, `create_agri_rule`, `update_agri_rule`, `delete_agri_rule`, `create_notification`, `resend_notification`
  - Parcelles: `get_plots_with_geolocation`, `delete_plot_cascade`
  - Opérations/Observations: RPC dédiées (`operationsRpcService.ts`, `observationsRpcService.ts`)
- Notes: des RPC sont utilisées pour travailler avec RLS de manière sécurisée côté base.

## 6) Sécurité & permissions (Vue Web)
- `ProtectedRoute` protège les pages sensibles
- `AuthContext` centralise la session Supabase et les rôles
- RLS au niveau base (Supabase) — le Web consomme des vues/RPC conformes aux policies
- Gestion des erreurs/feedback: `ToastContext` + toasts (sonner/toast)

## 7) Patterns UI/UX
- Layout cohérent: `Layout/Header/Sidebar`
- Tables avec actions inline, modals Radix UI pour création/édition/détails
- Filtres avancés, recherche, badges d’état et de sévérité
- Graphiques Recharts et cartes Leaflet (navigation, zoom)
- Responsive mobile-first via Tailwind

## 8) Performance & DX
- Pagination côté serveur pour grandes listes
- Loader/états de chargement et notifications utilisateur
- Scripts utiles: `src/scripts/seed-supabase.ts`, `test-pagination.mjs`
- Build: `vite build`; prévisualisation: `vite preview`

## 9) Roadmap (prochaines étapes)
- Page dédiée Cultures; flux Opérations (côté Web)
- Rapports & exports (PDF/Excel)
- Cartographie avancée (clustering, heatmaps, couches)
- Accessibilité (WCAG) et internationalisation
- Optimisations performance (lazy, cache avancé)

## 10) Démarrage & variables d’environnement
- Copier `.env` à partir de `env.example` (URL/clé Supabase, etc.)
- Installer puis lancer: `npm i && npm run dev`
- Déploiement: build Vite puis hébergement statique (ex: Vercel) — fichier `vercel.json` présent


