#!/bin/bash

# Script de déploiement mobile AgriConnect
echo "🚀 Déploiement de l'application mobile AgriConnect..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "mobile/package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Aller dans le répertoire mobile
cd mobile

# Vérifier l'installation d'EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 Installation d'EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Vérifier la connexion
echo "🔐 Vérification de la connexion EAS..."
eas whoami

# Build de développement
echo "🔨 Build de développement..."
eas build --platform all --profile development

# Build de preview
echo "🔨 Build de preview..."
eas build --platform all --profile preview

# Demander confirmation pour la production
read -p "Voulez-vous déployer en production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Build de production..."
    eas build --platform all --profile production
    
    echo "📤 Soumission aux stores..."
    eas submit --platform all --profile production
fi

echo "✅ Déploiement mobile terminé!"
