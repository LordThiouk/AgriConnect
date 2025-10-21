# Script Orateur — AgriConnect Web (5–7 minutes)

Bonjour à tous. AgriConnect vise à digitaliser la collecte agricole et à donner aux coopératives, superviseurs et à l’État une vision exploitable et actionnable.

1) Pourquoi un module Web ? (40s)
- Centraliser la supervision: producteurs, agents, parcelles, alertes.
- Améliorer la qualité des données et accélérer la décision.
- Offrir une gouvernance des recommandations et des notifications.

2) Architecture en 1 minute (60s)
- Front: React + Vite + TypeScript, Tailwind + Radix UI, React Router, React Query.
- Backend: Supabase (Auth, PostgreSQL, RLS, RPC), Leaflet pour la carto, Recharts pour les KPIs.
- Sécurité: RLS côté base, routes protégées (`ProtectedRoute`), session via `AuthContext`.

3) Tour rapide des capacités (2–3 min)
- Dashboard: KPIs, graphiques et carte pour une vue d’ensemble immédiate.
- Producteurs & Coopératives: CRUD complet, filtres, pagination, statistiques; carte des coopératives.
- Agents: gestion, assignation producteurs↔agents, suivi de performances.
- Parcelles & Cultures: carte Leaflet (géolocalisation réelle), détails, opérations; suppression en cascade sécurisée (RPC).
- Alertes/Règles/Notifications: 3 onglets; création/édition; renvoi; badges de priorité/sévérité/statut.

4) Sécurité et gouvernance (40s)
- RLS Supabase: accès par rôle strict; RPC pour opérer en sécurité.
- Web: authentification, routes protégées, gestion d’état de session.

5) Performance & exploitation (40s)
- Pagination serveur, loaders, toasts pour un UX fluide.
- Scripts de seed et tests, déploiement Vercel prêt.

6) Roadmap (40s)
- Page dédiée Cultures et flux Opérations.
- Rapports PDF/Excel, cartographie avancée (clustering, heatmaps), a11y, i18n.

7) Conclusion (20s)
- Impact: meilleure décision, coordination, traçabilité.
- Proposition: pilote avec 1–2 coopératives; valider périmètre, planifier diffusion SMS et budgets d’hébergement.

Merci.
