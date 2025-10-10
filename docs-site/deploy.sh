#!/bin/bash

# 🚀 Script de déploiement de la documentation AgriConnect sur Vercel

echo "🚀 Déploiement de la documentation AgriConnect sur Vercel"
echo "=========================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis le répertoire docs-site"
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Erreur: Node.js n'est pas installé"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ Erreur: npm n'est pas installé"
    exit 1
fi

echo "📦 Installation des dépendances..."
npm install

echo "🔨 Build de la documentation..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "✅ Build réussi !"

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📥 Installation de Vercel CLI..."
    npm install -g vercel
fi

echo "🌐 Déploiement sur Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "🎉 Déploiement réussi !"
    echo "📱 Votre documentation est maintenant disponible sur Vercel"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
