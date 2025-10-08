#!/bin/bash

# Script de test des services AgriConnect
# Usage: ./run-tests.sh

echo "🚀 AgriConnect Services Test Suite"
echo "=================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis le dossier mobile/scripts/"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Variables d'environnement manquantes:"
    echo "   SUPABASE_URL: ${SUPABASE_URL:+✅}${SUPABASE_URL:-❌}"
    echo "   SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+✅}${SUPABASE_ANON_KEY:-❌}"
    echo ""
    echo "💡 Assurez-vous que le fichier .env est présent à la racine du projet"
    exit 1
fi

echo "✅ Variables d'environnement détectées"
echo ""

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Exécuter les tests
echo "🧪 Exécution des tests des services..."
echo ""

npm run test:services

# Vérifier le code de sortie
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Tests terminés avec succès!"
    echo "✅ Les services sont prêts pour la migration"
else
    echo ""
    echo "❌ Certains tests ont échoué"
    echo "⚠️ Veuillez corriger les erreurs avant de continuer la migration"
    exit 1
fi
