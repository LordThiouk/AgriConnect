#  Plateforme de Suivi Agricole Digital

Cette plateforme permet de digitaliser la collecte de données terrain pour les coopératives agricoles, d’assurer un suivi individualisé des producteurs, et de générer des conseils techniques personnalisés via un moteur de règles (et à terme de l’IA).

---

##  Objectifs du projet

-  Digitaliser la collecte des données agricoles (offline/online)
-  Suivre les producteurs et leurs parcelles à l’échelle nationale
-  Générer des conseils techniques personnalisés
-  Fournir des dashboards aux coopératives et décideurs
-  Offrir une API REST sécurisée pour l’interopérabilité (Odoo, Power BI…)

---

##  Architecture technique

| Composant       | Technologie proposée |
|-----------------|----------------------|
| Frontend Web    | React.js (PWA)       |
| Frontend Mobile | React Native ou PWA  |
| Backend API     | Node.js (NestJS) ou Python (Django) |
| Base de données | PostgreSQL           |
| Notifications   | Twilio / WhatsApp API / SMS API |
| Moteur IA (MVP) | Règles métiers (JSON), Scikit-learn (v2) |
| Authentification| JWT + rôles          |

---

##  Stack de développement

- GitHub pour gestion de code source
- Notion pour documentation produit/technique
- Slack / WhatsApp pour communication
- Trello  pour gestion des tâches

---

##  Installation locale (Web app)

```bash
# Cloner le dépôt
git clone https://github.com/LordThiouk/AgriConnect.git
cd AgriConnect

pnpm install # ou npm install / yarn

# Copier l'exemple d'environnement et remplir vos valeurs
cp env.example .env
# Variables requises
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

pnpm dev # ou npm run dev / yarn dev
````

> ⚠ Ne commitez jamais vos secrets. Utilisez `.env` localement et conservez uniquement `env.example` dans le dépôt.

---

##  Authentification

* Utilise un système par jeton JWT
* Gestion des rôles : producteur, agent, superviseur, admin

---

##  Fonctionnalités MVP

* Saisie de fiches producteurs et parcelles (offline)
* Géolocalisation des champs
* Collecte de données agronomiques
* Recommandations via règles métiers
* Notifications multicanal (SMS, WhatsApp, App)
* Tableaux de bord pour supervision

---

##  Fonctionnalité IA

* **Phase 1 (MVP)** : règles métiers (ex: si levée tardive → recommander urée)
* **Phase 2** : IA prédictive pour rendement, alerte maladies, etc.

---

##  Documentation API

Disponible à `/api/docs` via Swagger une fois le backend lancé.

---

##  Structure du dépôt

```
AgriConnect/
├── src/                 # Code source web app (React + Vite)
├── supabase/            # Config + migrations Supabase
├── env.example          # Exemple de configuration (sans secrets)
├── README.md            # Ce fichier
└── cursor_metrics.md    # Suivi d'usage des règles Cursor
```

---

##  KPIs à suivre (phase MVP)

* > 80% de fiches producteurs complétées
* > 70% de parcelles géolocalisées
* > 60% d’ouverture des conseils envoyés
* <1 jour entre collecte offline et synchronisation

---

##  Licence

Projet sous licence MIT / à adapter selon le contexte de déploiement.


