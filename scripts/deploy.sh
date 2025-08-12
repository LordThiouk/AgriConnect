#!/bin/bash

# Script de déploiement AgriConnect
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
BUILD_DIR="dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Déploiement AgriConnect vers $ENVIRONMENT"
echo "⏰ Timestamp: $TIMESTAMP"

# Vérification des prérequis
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Erreur: Le dossier de build '$BUILD_DIR' n'existe pas"
    echo "💡 Exécutez d'abord: npm run build"
    exit 1
fi

# Configuration selon l'environnement
case $ENVIRONMENT in
    "staging")
        echo "📋 Configuration pour l'environnement STAGING"
        DEPLOY_URL="https://staging.agriconnect.com"
        ;;
    "production")
        echo "📋 Configuration pour l'environnement PRODUCTION"
        DEPLOY_URL="https://agriconnect.com"
        ;;
    *)
        echo "❌ Erreur: Environnement '$ENVIRONMENT' non reconnu"
        echo "💡 Usage: $0 [staging|production]"
        exit 1
        ;;
esac

# Sauvegarde de la version précédente (optionnel)
if [ -d "backup" ]; then
    echo "💾 Sauvegarde de la version précédente..."
    mv backup "backup_$TIMESTAMP"
fi

# Création du backup
mkdir -p backup
cp -r $BUILD_DIR/* backup/

echo "✅ Build sauvegardé dans backup/"

# Déploiement selon la plateforme
if [ -n "$VERCEL_TOKEN" ]; then
    echo "🚀 Déploiement vers Vercel..."
    npx vercel --prod --token $VERCEL_TOKEN
elif [ -n "$NETLIFY_AUTH_TOKEN" ]; then
    echo "🚀 Déploiement vers Netlify..."
    npx netlify deploy --prod --dir=$BUILD_DIR --auth=$NETLIFY_AUTH_TOKEN
elif [ -n "$SSH_HOST" ]; then
    echo "🚀 Déploiement vers serveur SSH..."
    rsync -avz --delete $BUILD_DIR/ $SSH_USER@$SSH_HOST:$SSH_PATH/
    ssh $SSH_USER@$SSH_HOST "cd $SSH_PATH && npm ci --only=production"
else
    echo "⚠️  Aucune configuration de déploiement détectée"
    echo "💡 Configurez les variables d'environnement appropriées"
    echo "📋 URL de déploiement: $DEPLOY_URL"
fi

echo "✅ Déploiement vers $ENVIRONMENT terminé!"
echo "🌐 URL: $DEPLOY_URL"
echo "⏰ Déployé à: $TIMESTAMP" 