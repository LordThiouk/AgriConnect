#!/bin/bash

# Script pour guider la création manuelle du workflow GitHub Actions

echo "🚀 Guide de création manuelle du workflow GitHub Actions"
echo "=================================================="
echo ""

echo "📋 Étapes à suivre :"
echo ""

echo "1️⃣  Ouvrez votre navigateur et allez sur :"
echo "   https://github.com/LordThiouk/AgriConnect"
echo ""

echo "2️⃣  Cliquez sur 'Add file' → 'Create new file'"
echo ""

echo "3️⃣  Nom du fichier : .github/workflows/ci-cd.yml"
echo "   (GitHub créera automatiquement le dossier .github/workflows/)"
echo ""

echo "4️⃣  Copiez et collez ce contenu dans le fichier :"
echo ""

cat << 'EOF'
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
EOF

echo ""
echo "5️⃣  Message de commit : 'feat: Ajout du pipeline CI/CD GitHub Actions'"
echo ""

echo "6️⃣  Cliquez sur 'Commit new file'"
echo ""

echo "7️⃣  Créez les environnements :"
echo "   - Allez dans Settings → Environments"
echo "   - Créez l'environnement 'staging'"
echo "   - Créez l'environnement 'production'"
echo ""

echo "8️⃣  Créez la branche 'develop' :"
echo "   - Cliquez sur le bouton 'main' (dropdown)"
echo "   - Tapez 'develop' et cliquez sur 'Create branch'"
echo ""

echo "9️⃣  Testez le pipeline :"
echo "   - Faites un commit sur la branche 'develop'"
echo "   - Vérifiez l'onglet 'Actions'"
echo ""

echo "✅ Une fois terminé, votre pipeline CI/CD sera fonctionnel !"
echo ""
echo "🔗 Vérifiez sur : https://github.com/LordThiouk/AgriConnect/actions" 