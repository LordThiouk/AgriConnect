# Guide de Configuration Rapide - Pipeline CI/CD AgriConnect

## 🚀 Configuration en 5 Étapes

### Étape 1: Préparation du Repository GitHub

1. **Poussez votre code vers GitHub**
   ```bash
   git add .
   git commit -m "Configuration CI/CD initiale"
   git push origin main
   ```

2. **Créez une branche develop**
   ```bash
   git checkout -b develop
   git push origin develop
   ```

### Étape 2: Configuration des Secrets GitHub

Allez dans votre repository GitHub → Settings → Secrets and variables → Actions

Ajoutez ces secrets selon votre plateforme de déploiement :

#### Pour Vercel :
- `VERCEL_TOKEN` : Votre token Vercel
- `ORG_ID` : ID de votre organisation Vercel
- `PROJECT_ID` : ID de votre projet Vercel

#### Pour Netlify :
- `NETLIFY_AUTH_TOKEN` : Votre token Netlify
- `NETLIFY_SITE_ID` : ID de votre site Netlify

#### Pour Docker Hub :
- `DOCKER_USERNAME` : Votre nom d'utilisateur Docker Hub
- `DOCKER_PASSWORD` : Votre mot de passe/jeton Docker Hub

#### Pour Serveur SSH :
- `SSH_HOST` : Adresse de votre serveur
- `SSH_USER` : Nom d'utilisateur SSH
- `SSH_KEY` : Clé SSH privée
- `SSH_PATH` : Chemin sur le serveur

### Étape 3: Configuration des Environnements

1. **Allez dans Settings → Environments**
2. **Créez l'environnement `staging`**
3. **Créez l'environnement `production`**
4. **Ajoutez les secrets spécifiques à chaque environnement**

### Étape 4: Test du Pipeline

1. **Faites un commit sur la branche develop**
   ```bash
   git checkout develop
   echo "# Test CI/CD" >> README.md
   git add README.md
   git commit -m "Test pipeline staging"
   git push origin develop
   ```

2. **Vérifiez l'exécution dans l'onglet Actions**

3. **Faites un commit sur la branche main**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

### Étape 5: Configuration du Déploiement

Modifiez le fichier `.github/workflows/ci-cd.yml` selon votre plateforme :

#### Exemple Vercel :
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    vercel-args: '--prod'
```

## 🔧 Configuration Locale

### Test du Build
```bash
# Installation des dépendances
npm ci

# Test du linting
npm run lint

# Vérification des types
npx tsc --noEmit

# Build de l'application
npm run build
```

### Test Docker
```bash
# Construction de l'image
docker build -t agriconnect-frontend .

# Test local
docker run -p 8080:80 agriconnect-frontend

# Ou avec Docker Compose
docker-compose up
```

### Test du Script de Déploiement
```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Test du déploiement staging
./scripts/deploy.sh staging

# Test du déploiement production
./scripts/deploy.sh production
```

## 📋 Checklist de Validation

- [ ] Repository GitHub configuré
- [ ] Branches `main` et `develop` créées
- [ ] Secrets GitHub configurés
- [ ] Environnements créés
- [ ] Pipeline testé sur `develop`
- [ ] Pipeline testé sur `main`
- [ ] Déploiement automatique fonctionnel
- [ ] Variables d'environnement configurées
- [ ] Documentation mise à jour

## 🚨 Dépannage Rapide

### Pipeline ne se déclenche pas
- Vérifiez que le fichier `.github/workflows/ci-cd.yml` existe
- Vérifiez les branches configurées (`main`, `develop`)

### Erreur de build
- Vérifiez les erreurs TypeScript : `npx tsc --noEmit`
- Vérifiez les erreurs de linting : `npm run lint`

### Erreur de déploiement
- Vérifiez les secrets GitHub
- Vérifiez les permissions de l'environnement
- Consultez les logs de déploiement

### Erreur Docker
- Vérifiez la syntaxe du Dockerfile
- Vérifiez que tous les fichiers nécessaires sont présents

## 📞 Support

En cas de problème :
1. Consultez les logs GitHub Actions
2. Vérifiez cette documentation
3. Créez un issue dans le repository
4. Contactez l'équipe de développement

---

**Dernière mise à jour** : $(date)
**Version** : 1.0.0 