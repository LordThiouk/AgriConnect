# Script Orateur — AgriConnect Mobile (5–7 minutes)

Bonjour. AgriConnect Mobile équipe les agents de terrain pour collecter vite et bien, même sans réseau, et informer les producteurs.

1) Pourquoi Mobile ? (40s)
- Collecte sur site: producteur, parcelle, culture, opérations, observations.
- Offline-first: travailler sans connexion et synchroniser plus tard.
- Recommandations & rappels: boucle d’amélioration continue.

2) Architecture (60s)
- Expo/React Native + TypeScript; Expo Router; NativeBase; UI `components/ui/*`.
- Supabase: Auth, PostgreSQL + RLS, Storage; sessions via Secure Store.
- Carto: React Native Maps / Expo Maps; médias via Expo Camera/Image Picker.

3) Capacités clés (2–3 min)
- Dashboard Agent: KPIs, listes récentes, actions rapides.
- Collecte: formulaires unifiés (producteur, parcelle, culture); opérations & observations avec photos.
- Parcelles: navigation imbriquée; carte et détails par onglets; conseils, intrants, intervenants.
- Observations: ajout rapide, filtre et tri; galerie photo.

4) Offline & Sync (40s)
- Cache par domaine + file d’attente; retry et résolution de conflits.
- Reprise réseau automatique et statuts de synchronisation.

5) Sécurité (40s)
- Auth JWT, Secure Store, RLS côté backend; pas de secrets en clair.
- Contrôles intégrés (double saisie, GPS incohérent, producteur inactif).

6) Roadmap (40s)
- Cartographie avancée (clustering, fonds offline), filtres KPI dashboard.
- Internationalisation; tests E2E; routines de sync ciblées.

7) Conclusion (20s)
- Gains: rapidité collecte, qualité des données, coordination terrain.
- Proposition: élargir le pilote, renforcer formation et retours agents.

Merci.
