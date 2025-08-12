# 📋 Guide d'Ajout Manuel des Workflows GitHub Actions

## ✅ Étape 1 : Push Réussi

Le push des fichiers de base a réussi ! Maintenant nous devons ajouter les workflows GitHub Actions manuellement.

## 🔧 Étape 2 : Ajout des Workflows via Interface Web

### 2.1 Accédez à votre Repository
1. **Allez sur** : https://github.com/LordThiouk/AgriConnect
2. **Vérifiez que les fichiers sont présents** :
   - ✅ `Dockerfile`
   - ✅ `docker-compose.yml`
   - ✅ `nginx.conf`
   - ✅ `scripts/deploy.sh`
   - ✅ `CI_CD_README.md`
   - ✅ `SETUP_GUIDE.md`
   - ✅ `GUIDE_PERMISSIONS_GITHUB.md`

### 2.2 Créez le Dossier .github/workflows
1. **Cliquez sur "Add file"** → "Create new file"
2. **Nom du fichier** : `.github/workflows/ci-cd.yml`
3. **GitHub créera automatiquement le dossier** `.github/workflows/`

### 2.3 Ajoutez le Contenu du Workflow Principal

Copiez ce contenu dans le fichier `.github/workflows/ci-cd.yml` :

```yaml
name: AgriConnect CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run type checking
      run: npx tsc --noEmit

    - name: Build application
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-files
        path: dist/
        retention-days: 7

  deploy-staging:
    needs: test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-files
        path: dist/

    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add your staging deployment commands here
        # Example: Deploy to Vercel, Netlify, or your staging server

  deploy-production:
    needs: test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-files
        path: dist/

    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add your production deployment commands here
        # Example: Deploy to Vercel, Netlify, or your production server
```

### 2.4 Créez les Environnements

#### Environnement Staging
1. **Allez dans Settings** → Environments
2. **Cliquez sur "New environment"**
3. **Nom** : `staging`
4. **Cliquez sur "Configure environment"**

#### Environnement Production
1. **Cliquez sur "New environment"**
2. **Nom** : `production`
3. **Cliquez sur "Configure environment"**

### 2.5 Créez une Branche Develop
1. **Allez dans l'onglet "Code"**
2. **Cliquez sur le bouton "main"** (dropdown)
3. **Tapez "develop"** et cliquez sur "Create branch: develop from 'main'"

## 🧪 Étape 3 : Test du Pipeline

### 3.1 Test sur la Branche Develop
1. **Allez sur la branche `develop`**
2. **Modifiez un fichier** (par exemple `README.md`)
3. **Ajoutez une ligne** : `# Test CI/CD Pipeline`
4. **Committez le changement**
5. **Vérifiez l'onglet "Actions"**

### 3.2 Test sur la Branche Main
1. **Créez un Pull Request** : `develop` → `main`
2. **Mergez le PR**
3. **Vérifiez l'onglet "Actions"**

## 📊 Étape 4 : Vérification

### ✅ Checklist de Validation
- [ ] Workflow visible dans l'onglet Actions
- [ ] Pipeline s'exécute sur push vers `develop`
- [ ] Pipeline s'exécute sur push vers `main`
- [ ] Jobs `test-and-build` réussis
- [ ] Jobs `deploy-staging` et `deploy-production` configurés
- [ ] Environnements `staging` et `production` créés

## 🔧 Étape 5 : Configuration des Secrets (Optionnel)

### Pour Vercel
1. **Allez dans Settings** → Secrets and variables → Actions
2. **Ajoutez** :
   - `VERCEL_TOKEN`
   - `ORG_ID`
   - `PROJECT_ID`

### Pour Netlify
1. **Ajoutez** :
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`

### Pour Docker Hub
1. **Ajoutez** :
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

## 🚀 Étape 6 : Déploiement Automatique

Une fois les secrets configurés, modifiez les étapes de déploiement dans le workflow :

### Exemple Vercel
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.ORG_ID }}
    vercel-project-id: ${{ secrets.PROJECT_ID }}
    vercel-args: '--prod'
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans l'onglet Actions
2. Consultez `CI_CD_README.md`
3. Consultez `GUIDE_PERMISSIONS_GITHUB.md`
4. Contactez l'équipe de développement

---

**Statut** : ✅ **PRÊT POUR L'AJOUT MANUEL**
**Prochaine étape** : Suivre ce guide pour ajouter les workflows 