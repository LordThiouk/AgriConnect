# Pipeline CI/CD AgriConnect

Ce document décrit la configuration du pipeline CI/CD pour le projet AgriConnect.

## Vue d'ensemble

Le pipeline CI/CD est configuré à l'aide de GitHub Actions et fournit les capacités suivantes :

- **Tests Automatisés** : Linting, vérification de types et compilation
- **Déploiement Staging** : Déploiement automatique vers l'environnement de staging sur la branche `develop`
- **Déploiement Production** : Déploiement automatique vers l'environnement de production sur la branche `main`
- **Support Docker** : Containerisation pour un déploiement facile
- **Support Backend Futur** : Extensible pour l'ajout de services backend

## Structure du Pipeline

### Jobs Actuels

1. **test-and-build** : S'exécute sur tous les pushes et pull requests
   - Installe les dépendances
   - Exécute le linting (`npm run lint`)
   - Effectue la vérification de types (`npx tsc --noEmit`)
   - Compile l'application (`npm run build`)
   - Télécharge les artefacts de build

2. **deploy-staging** : S'exécute sur les pushes de la branche `develop`
   - Télécharge les artefacts de build
   - Déploie vers l'environnement de staging

3. **deploy-production** : S'exécute sur les pushes de la branche `main`
   - Télécharge les artefacts de build
   - Déploie vers l'environnement de production

### Jobs Futurs (Commentés)

- **test-backend** : Pour les tests backend quand le backend sera ajouté
- **deploy-docker** : Pour les déploiements basés sur Docker

## Instructions de Configuration

### 1. Configuration du Repository GitHub

1. Poussez votre code vers GitHub
2. Allez dans les paramètres de votre repository
3. Naviguez vers "Secrets and variables" → "Actions"
4. Ajoutez les secrets suivants si nécessaire :
   - `DOCKER_USERNAME` : Votre nom d'utilisateur Docker Hub
   - `DOCKER_PASSWORD` : Votre mot de passe/jeton Docker Hub

### 2. Configuration des Environnements

Créez des environnements dans votre repository GitHub :

1. Allez dans Settings → Environments
2. Créez l'environnement `staging`
3. Créez l'environnement `production`
4. Ajoutez tous les secrets spécifiques à l'environnement

### 3. Configuration du Déploiement

Mettez à jour les étapes de déploiement dans `.github/workflows/ci-cd.yml` :

#### Pour le Déploiement Vercel :
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    vercel-args: '--prod'
```

#### Pour le Déploiement Netlify :
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2.0
  with:
    publish-dir: './dist'
    production-branch: main
    github-token: ${{ secrets.GITHUB_TOKEN }}
    deploy-message: "Deploy from GitHub Actions"
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Pour le Déploiement Serveur Personnalisé :
```yaml
- name: Deploy to server
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    script: |
      cd /path/to/your/app
      git pull origin main
      npm ci
      npm run build
      sudo systemctl restart your-app
```

## Déploiement Docker

### Construction de l'Image

```bash
# Construire l'image Docker
docker build -t agriconnect-frontend .

# Exécuter le conteneur
docker run -p 80:80 agriconnect-frontend
```

### Utilisation de Docker Compose

Créez un fichier `docker-compose.yml` :

```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Ajout du Support Backend

Quand vous ajouterez un backend à votre projet :

1. Décommentez les jobs liés au backend dans `.github/workflows/ci-cd.yml`
2. Créez un répertoire `backend/` avec votre code backend
3. Ajoutez un `backend/Dockerfile` pour la containerisation backend
4. Mettez à jour les étapes de déploiement pour inclure le déploiement backend

### Exemple de Structure Backend :
```
AgriConnect/
├── frontend/          # Application React actuelle
├── backend/           # Backend futur (Node.js/Python)
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── tests/
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── docker-compose.yml
```

## Variables d'Environnement

### Variables d'Environnement Requises

Créez des fichiers `.env` pour différents environnements :

#### Développement (`.env.development`)
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_supabase
```

#### Production (`.env.production`)
```env
VITE_API_URL=https://api.agriconnect.com
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme_supabase
```

## Surveillance et Logs

### Logs GitHub Actions
- Consultez les exécutions du pipeline dans l'onglet "Actions" de votre repository
- Vérifiez les logs de jobs individuels pour le débogage

### Logs d'Application
- Logs frontend : Console du navigateur et onglet réseau
- Logs backend : Logs du serveur (quand le backend sera ajouté)
- Logs Docker : `docker logs <nom_conteneur>`

## Dépannage

### Problèmes Courants

1. **Échecs de Build**
   - Vérifiez les erreurs TypeScript : `npx tsc --noEmit`
   - Vérifiez que toutes les dépendances sont installées : `npm ci`
   - Vérifiez les erreurs de linting : `npm run lint`

2. **Échecs de Déploiement**
   - Vérifiez que les secrets d'environnement sont correctement configurés
   - Vérifiez le statut de la plateforme de déploiement
   - Consultez les logs de déploiement

3. **Problèmes Docker**
   - Assurez-vous que la syntaxe Dockerfile est correcte
   - Vérifiez les fichiers manquants dans le contexte de build
   - Vérifiez la configuration nginx

### Commandes de Débogage

```bash
# Tests locaux
npm run lint
npx tsc --noEmit
npm run build

# Tests Docker
docker build -t test-image .
docker run -p 8080:80 test-image

# Vérifier GitHub Actions localement (en utilisant act)
act -j test-and-build
```

## Considérations de Sécurité

1. **Gestion des Secrets**
   - Ne committez jamais de secrets dans le contrôle de version
   - Utilisez GitHub Secrets pour les données sensibles
   - Rotationnez les secrets régulièrement

2. **Sécurité Docker**
   - Utilisez des builds multi-étapes pour réduire la taille de l'image
   - Exécutez les conteneurs en tant qu'utilisateur non-root quand possible
   - Maintenez les images de base à jour

3. **Isolation d'Environnement**
   - Utilisez des environnements séparés pour staging et production
   - Implémentez des contrôles d'accès appropriés
   - Surveillez les accès non autorisés

## Optimisation des Performances

1. **Optimisation du Build**
   - Utilisez npm ci pour des installations plus rapides et fiables
   - Mettez en cache les dépendances dans GitHub Actions
   - Optimisez les couches Docker

2. **Optimisation du Déploiement**
   - Utilisez les artefacts de build pour éviter la recompilation
   - Implémentez des déploiements blue-green
   - Utilisez un CDN pour les assets statiques

## Support

Pour les problèmes avec le pipeline CI/CD :

1. Vérifiez les logs GitHub Actions
2. Consultez cette documentation
3. Créez un issue dans le repository
4. Contactez l'équipe de développement

---

**Dernière Mise à Jour** : $(date)
**Version** : 1.0.0 