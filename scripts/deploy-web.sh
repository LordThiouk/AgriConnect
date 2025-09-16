#!/bin/bash

# Script de déploiement web AgriConnect
echo "🚀 Déploiement de l'application web AgriConnect..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "web/package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Aller dans le répertoire web
cd web

# Vérifier l'installation de Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

# Vérifier la connexion
echo "🔐 Vérification de la connexion Vercel..."
vercel whoami

# Build local pour test
echo "🔨 Build local de test..."
npm run build

# Déploiement preview
echo "🚀 Déploiement preview..."
vercel

# Demander confirmation pour la production
read -p "Voulez-vous déployer en production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Déploiement production..."
    vercel --prod
fi

echo "✅ Déploiement web terminé!"
