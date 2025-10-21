# Plan de Présentation — AgriConnect Mobile (10–12 slides)

## Slide 1 — Contexte & Public
- Agents de terrain, responsables, admins
- Objectif: collecte terrain fiable, offline-first, recommandations

Notes orateur: Positionner l’app mobile comme outil opérationnel quotidien.

## Slide 2 — Stack & Architecture
- Expo/React Native + TypeScript
- Expo Router, NativeBase, UI `components/ui/*`
- Supabase (Auth, DB, Storage, RPC), Secure Store

Notes orateur: Souligner offline-first et sécurité des sessions.

## Slide 3 — Structure & Navigation
- Dossiers `app/(auth)` et `app/(tabs)`
- Écrans: dashboard, collecte, parcelles, observations, profil
- Composants partagés et services par domaine

Notes orateur: Navigation simple, actions rapides, cohérence UI.

## Slide 4 — Auth & Rôles
- Login OTP/password, sélection rôle (agent/responsable)
- `AuthContext`, `mobileAuthService`, `sessionManager`

Notes orateur: Session persistante et sécurisée.

## Slide 5 — Dashboard Agent
- KPIs visites et synchronisation
- Listes récentes; actions rapides

Notes orateur: Démarrage jour/jour, efficacité terrain.

## Slide 6 — Collecte Terrain
- Fiche producteur, parcelle, culture
- Opérations & observations (photos, GPS)

Notes orateur: Formulaires courts, validations, UI unifiée.

## Slide 7 — Parcelles & Cultures
- Navigation imbriquée; détails par onglets
- Carte (RN Maps/Expo Maps), géolocalisation

Notes orateur: Traçabilité géo et historique.

## Slide 8 — Offline & Sync
- Cache par domaine + file d’attente
- Stratégies retry/conflits, reprise réseau

Notes orateur: Continuité de service sans réseau.

## Slide 9 — Notifications & Conseils
- Réception rappels/alertes (push)
- Recommandations à transmettre

Notes orateur: Boucle d’action terrain → producteur.

## Slide 10 — Sécurité Mobile
- Secure Store, RLS côté backend
- Contrôles: double saisie, GPS incohérent

Notes orateur: Données sensibles maîtrisées.

## Slide 11 — Roadmap
- Carto avancée (clustering, offline)
- Filtres dashboard, i18n, tests E2E

Notes orateur: Priorités 4–6 semaines.

## Slide 12 — Conclusion
- Impact: rapidité de collecte, qualité, coordination
- Prochaines étapes: pilote élargi, retour agents

Notes orateur: Ancrer sur gains opérationnels.
