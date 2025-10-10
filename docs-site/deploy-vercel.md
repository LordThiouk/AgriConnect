# 🚀 Déploiement de la Documentation AgriConnect sur Vercel

## 📋 Prérequis

1. **Compte Vercel** : Créer un compte sur [vercel.com](https://vercel.com)
2. **Node.js** : Version 18+ installée
3. **Git** : Repository GitHub configuré

## 🔧 Configuration

### 1. Installation des dépendances

```bash
cd docs-site
npm install
```

### 2. Test local

```bash
npm run build
npm run serve
```

### 3. Configuration Vercel

Le fichier `vercel.json` est déjà configuré avec :
- **Build Command** : `npm run build`
- **Output Directory** : `build`
- **Headers de sécurité** : XSS, CSRF protection
- **Rewrites** : Support des routes SPA

## 🚀 Déploiement

### Option 1 : Déploiement via CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod
```

### Option 2 : Déploiement via GitHub

1. **Connecter le repository** sur Vercel
2. **Configurer le projet** :
   - **Framework Preset** : Other
   - **Root Directory** : `docs-site`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`
3. **Déployer automatiquement** à chaque push

### Option 3 : Déploiement manuel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Importer le repository GitHub
3. Configurer :
   - **Framework** : Other
   - **Root Directory** : `docs-site`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`
4. Cliquer sur "Deploy"

## 🌐 Configuration du domaine

### Domaine personnalisé

1. **Ajouter un domaine** dans les paramètres Vercel
2. **Configurer les DNS** :
   - Type : CNAME
   - Name : `docs` (ou sous-domaine souhaité)
   - Value : `cname.vercel-dns.com`
3. **SSL automatique** : Vercel gère le certificat SSL

### Exemple de configuration

```
docs.agriconnect.sn → Vercel
```

## 📊 Monitoring et Analytics

### Vercel Analytics

```bash
npm install @vercel/analytics
```

### Configuration dans Docusaurus

```typescript
// docusaurus.config.ts
import { Analytics } from '@vercel/analytics/react';

export default {
  // ... config
  plugins: [
    // ... autres plugins
    function vercelAnalytics() {
      return {
        name: 'vercel-analytics',
        injectHtmlTags() {
          return {
            headTags: [
              {
                tagName: 'script',
                innerHTML: `
                  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
                `,
              },
            ],
          };
        },
      };
    },
  ],
};
```

## 🔄 Déploiement continu

### GitHub Actions (optionnel)

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Docs to Vercel

on:
  push:
    branches: [main]
    paths: ['docs-site/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd docs-site && npm install
      - run: cd docs-site && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./docs-site
```

## 🛠️ Maintenance

### Mise à jour de la documentation

1. **Modifier les fichiers** dans `docs-site/docs/`
2. **Tester localement** : `npm run start`
3. **Build** : `npm run build`
4. **Push vers GitHub** : Déploiement automatique

### Monitoring

- **Vercel Dashboard** : Statistiques de déploiement
- **Analytics** : Visiteurs et pages populaires
- **Logs** : Erreurs et performances

## 🎯 URLs de déploiement

- **Production** : `https://agriconnect-docs.vercel.app`
- **Preview** : `https://agriconnect-docs-git-[branch].vercel.app`
- **Domaine personnalisé** : `https://docs.agriconnect.sn` (à configurer)

## ✅ Checklist de déploiement

- [ ] Build local réussi (`npm run build`)
- [ ] Tests locaux passés (`npm run serve`)
- [ ] Configuration Vercel validée
- [ ] Domaine configuré (optionnel)
- [ ] Analytics activés (optionnel)
- [ ] Monitoring configuré
- [ ] Documentation à jour

---

**Documentation AgriConnect** - Déployée sur Vercel 🚀
