# Plan de Présentation — AgriConnect Web (10–12 slides)

## Slide 1 — Contexte & Mission
- Problème: suivi agricole dispersé, données difficiles à exploiter
- Solution Web: supervision coopératives/État, qualité des données, décisions rapides
- Public cible: superviseurs, admins, coop_admin

Notes orateur: Positionner AgriConnect comme cockpit de pilotage des données agricoles.

## Slide 2 — Architecture & Stack
- React + Vite + TypeScript
- Tailwind + Radix UI; React Router; React Query
- Supabase (Auth, PostgreSQL, RLS, RPC), Leaflet, Recharts

Notes orateur: Souligner sécurité RLS et scalabilité Supabase.

## Slide 3 — Structure & Navigation
- Layout: Header, Sidebar, contenu
- Pages: Dashboard, Producers, Cooperatives, Agents, Plots, Alerts, Auth
- Composants réutilisables (ui/*), services par domaine

Notes orateur: Mettre en avant la modularité et la maintenabilité.

## Slide 4 — Dashboard
- KPIs (producteurs, parcelles, alertes)
- Graphiques (tendances), carte (zones)

Notes orateur: Vue d’ensemble immédiate pour prioriser l’action.

## Slide 5 — Producteurs & Coopératives
- CRUD + filtres + pagination
- Statistiques par coopérative; vue carte

Notes orateur: Contrôle qualité des données et vision par territoire.

## Slide 6 — Agents
- CRUD, assignations producteurs ↔ agents
- Performance: KPIs, classement

Notes orateur: Pilotage opérationnel des équipes terrain.

## Slide 7 — Parcelles & Cultures
- Carte Leaflet (géolocalisation réelle)
- Détails parcelle, cultures, opérations; suppression en cascade (RPC)

Notes orateur: Traçabilité fine des parcelles avec géo.

## Slide 8 — Alertes, Règles, Notifications
- 3 onglets: Alertes, Règles (agri_rules), Notifications
- CRUD complet + renvoi; badges priorité/sévérité/statut

Notes orateur: Gouvernance des recommandations et diffusion contrôlée.

## Slide 9 — Sécurité & RLS
- Auth + ProtectedRoute + AuthContext
- RLS Supabase; RPC sécurisées

Notes orateur: Accès par rôle, conformité et auditabilité.

## Slide 10 — Performance & Exploitabilité
- Pagination serveur; états de chargement; toasts
- Scripts seed/tests; déploiement Vercel

Notes orateur: Fluide pour grandes volumétries, prêt prod.

## Slide 11 — Roadmap
- Page Cultures + flux Opérations
- Rapports PDF/Excel; cartographie avancée; a11y; i18n

Notes orateur: Priorités prochaines 4–6 semaines.

## Slide 12 — Conclusion & Appel à action
- Impact: meilleure décision, coordination, traçabilité
- Besoins: validation périmètre, données pilotes, budget SMS/hosting

Notes orateur: Proposer pilote avec 1–2 coopératives et comité de suivi.
