# 📚 Documentation AgriConnect

Ce dossier contient le site de documentation généré avec Docusaurus pour AgriConnect.

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation
```bash
cd docs-site
npm install
```

### Développement
```bash
npm start
```
Ouvre [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Build de Production
```bash
npm run build
```
Génère le site statique dans le dossier `build/`.

### Test du Build
```bash
npm run serve
```
Teste le build de production localement.

## 🔧 Scripts Automatisés

### Build Complet
Pour exécuter tout le processus de build (migration, correction, build) :
```bash
node scripts/build-docs-complete.js
```

### Scripts Individuels
- `scripts/migrate-docs.js` - Migration des fichiers vers Docusaurus
- `scripts/fix-markdown-syntax.js` - Correction de la syntaxe Markdown
- `scripts/fix-broken-links.js` - Correction des liens cassés
- `scripts/build-docs.js` - Build avec linting et métriques

## 📁 Structure

```
docs-site/
├── docs/                    # Fichiers de documentation Markdown
│   ├── intro.md            # Page d'accueil
│   ├── getting-started/    # Guides de démarrage
│   ├── architecture/       # Documentation technique
│   ├── mobile/            # Documentation mobile
│   ├── development/       # Guides de développement
│   ├── deployment/        # Guides de déploiement
│   ├── integrations/      # Intégrations tierces
│   └── troubleshooting/   # Dépannage
├── src/                   # Composants React personnalisés
├── static/               # Assets statiques
├── docusaurus.config.ts  # Configuration Docusaurus
├── sidebars.ts          # Configuration de la sidebar
└── package.json         # Dépendances et scripts
```

## 🎨 Personnalisation

### Configuration
Modifiez `docusaurus.config.ts` pour :
- Changer le titre et la description
- Configurer l'URL de déploiement
- Personnaliser le thème
- Ajouter des plugins

### Sidebar
Modifiez `sidebars.ts` pour :
- Réorganiser la navigation
- Ajouter de nouvelles catégories
- Modifier l'ordre des documents

### Thème
Les styles personnalisés sont dans `src/css/custom.css`.

## 📝 Ajout de Documentation

### Nouveau Document
1. Créez un fichier `.md` dans le dossier approprié
2. Ajoutez le document à `sidebars.ts`
3. Utilisez le frontmatter pour la configuration :

```markdown
---
title: Mon Document
description: Description du document
---

# Mon Document

Contenu du document...
```

### Images
Placez les images dans `static/img/` et référencez-les avec `/img/nom-image.png`.

## 🔗 Liens

### Liens Internes
```markdown
[Texte du lien](chemin/vers/document)
```

### Liens Externes
```markdown
[Texte du lien](https://example.com)
```

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connectez votre repository GitHub à Vercel
2. Configurez le dossier de build : `docs-site/build`
3. Déployez automatiquement à chaque push

### GitHub Pages
```bash
npm run build
# Copiez le contenu de build/ vers votre repository gh-pages
```

### Netlify
1. Connectez votre repository
2. Configurez :
   - Build command: `cd docs-site && npm run build`
   - Publish directory: `docs-site/build`

## 🐛 Dépannage

### Liens Cassés
Exécutez le script de correction :
```bash
node scripts/fix-broken-links.js
```

### Erreurs de Syntaxe Markdown
Exécutez le script de correction :
```bash
node scripts/fix-markdown-syntax.js
```

### Problèmes de Build
1. Vérifiez que tous les documents référencés dans `sidebars.ts` existent
2. Vérifiez la syntaxe Markdown
3. Consultez les logs de build pour plus de détails

## 📊 Métriques

Les métriques de documentation sont générées automatiquement :
- Nombre de fichiers
- Nombre de mots
- Nombre de lignes
- Liens internes/externes

Consultez `docs-reports/` pour les rapports détaillés.

## 🤝 Contribution

1. Modifiez les fichiers Markdown dans `docs/`
2. Testez localement avec `npm start`
3. Exécutez `npm run build` pour vérifier le build
4. Commitez et poussez vos changements

## 📞 Support

- **Email** : pirlothiouk@gmail.com
- **GitHub** : [agriconnect/agriconnect](https://github.com/agriconnect/agriconnect)
- **Documentation** : Cette documentation

---

*Dernière mise à jour : Décembre 2024*