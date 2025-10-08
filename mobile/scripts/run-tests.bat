@echo off
REM Script de test des services AgriConnect (Windows Batch)
REM Usage: run-tests.bat

echo 🚀 AgriConnect Services Test Suite
echo ==================================

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: Exécutez ce script depuis le dossier mobile/scripts/
    exit /b 1
)

REM Vérifier les variables d'environnement
if "%SUPABASE_URL%"=="" (
    echo ❌ Variable SUPABASE_URL manquante
    goto :error
)

if "%SUPABASE_ANON_KEY%"=="" (
    echo ❌ Variable SUPABASE_ANON_KEY manquante
    goto :error
)

echo ✅ Variables d'environnement détectées
echo.

REM Installer les dépendances si nécessaire
if not exist "node_modules" (
    echo 📦 Installation des dépendances...
    npm install
)

REM Exécuter les tests
echo 🧪 Exécution des tests des services...
echo.

npm run test:services

REM Vérifier le code de sortie
if %ERRORLEVEL% equ 0 (
    echo.
    echo 🎉 Tests terminés avec succès!
    echo ✅ Les services sont prêts pour la migration
) else (
    echo.
    echo ❌ Certains tests ont échoué
    echo ⚠️ Veuillez corriger les erreurs avant de continuer la migration
    exit /b 1
)

goto :end

:error
echo.
echo 💡 Assurez-vous que le fichier .env est présent à la racine du projet
exit /b 1

:end
