# 🚀 Guide de Déploiement - Documentation AgriConnect

## 📋 Situation Actuelle

Vous avez déjà :
- ✅ **Web App** déployée sur Vercel : `agriconnect-web.vercel.app`
- 🎯 **Documentation** à déployer : `docs.agriconnect.sn`

## 🎯 Architecture de Déploiement Recommandée

```
AgriConnect Platform
├── 🌐 Web App (existant)
│   └── https://agriconnect-web.vercel.app
└── 📚 Documentation (nouveau)
    └── https://docs.agriconnect.sn
```

## 🚀 Déploiement de la Documentation

### **Étape 1 : Créer un nouveau projet Vercel**

1. **Aller sur [vercel.com/new](https://vercel.com/new)**
2. **Importer le repository GitHub** (même repo que le web app)
3. **Configurer le projet** :
   - **Project Name** : `agriconnect-docs`
   - **Framework Preset** : `Other`
   - **Root Directory** : `docs-site`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`
   - **Install Command** : `npm install`

### **Étape 2 : Configuration du domaine personnalisé**

1. **Dans le dashboard Vercel** → **Settings** → **Domains**
2. **Ajouter le domaine** : `docs.agriconnect.sn`
3. **Configurer les DNS** :
   ```
   Type: CNAME
   Name: docs
   Value: cname.vercel-dns.com
   ```

### **Étape 3 : Variables d'environnement (si nécessaire)**

```bash
# Dans Vercel Dashboard → Settings → Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://docs.agriconnect.sn
```

## 🔗 Intégration avec le Web App

### **Navigation croisée**

Ajouter dans votre web app un lien vers la documentation :

```tsx
// Dans votre web app
<Link href="https://docs.agriconnect.sn" target="_blank">
  📚 Documentation
</Link>
```

### **Footer du web app**

```tsx
<footer>
  <div>
    <Link href="https://docs.agriconnect.sn">Documentation</Link>
    <Link href="https://agriconnect-web.vercel.app">Application</Link>
  </div>
</footer>
```

## 📊 Structure des URLs Finales

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | `https://agriconnect-web.vercel.app` | Application principale |
| **Documentation** | `https://docs.agriconnect.sn` | Documentation technique |
| **API** | `https://api.agriconnect.sn` | API backend (si séparée) |

## 🛠️ Déploiement Automatique

### **GitHub Actions (optionnel)**

```yaml
# .github/workflows/deploy-docs.yml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths: ['docs-site/**']

jobs:
  deploy-docs:
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

## 🔄 Workflow de Déploiement

### **Pour la Documentation**
1. **Modifier** les fichiers dans `docs-site/docs/`
2. **Commit & Push** vers GitHub
3. **Déploiement automatique** sur Vercel
4. **URL** : `https://docs.agriconnect.sn`

### **Pour le Web App**
1. **Modifier** les fichiers dans `web/`
2. **Commit & Push** vers GitHub
3. **Déploiement automatique** sur Vercel
4. **URL** : `https://agriconnect-web.vercel.app`

## 📱 Navigation Mobile

### **Dans l'app mobile**
```tsx
// Lien vers la documentation
<Button 
  onPress={() => Linking.openURL('https://docs.agriconnect.sn')}
>
  📚 Documentation
</Button>
```

## 🎯 Avantages de cette Architecture

- ✅ **Séparation claire** : Web app vs Documentation
- ✅ **Déploiements indépendants** : Pas de conflit
- ✅ **Domaines dédiés** : Meilleure organisation
- ✅ **Performance optimisée** : Chaque service optimisé
- ✅ **Maintenance simplifiée** : Équipes séparées possibles

## 🚀 Commandes de Déploiement Rapide

### **Déploiement manuel**
```bash
cd docs-site
npm install
npm run build
vercel --prod
```

### **Test local**
```bash
cd docs-site
npm start
# Ouvrir http://localhost:3000
```

## 📞 Support

- **Web App** : [agriconnect-web.vercel.app](https://agriconnect-web.vercel.app)
- **Documentation** : [docs.agriconnect.sn](https://docs.agriconnect.sn)
- **GitHub** : [agriconnect/agriconnect](https://github.com/agriconnect/agriconnect)

---

**AgriConnect** - Plateforme Numérique Agricole 🚀
