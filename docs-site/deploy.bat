@echo off
REM 🚀 Script de déploiement de la documentation AgriConnect sur Vercel (Windows)

echo 🚀 Déploiement de la documentation AgriConnect sur Vercel
echo ==========================================================

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: Ce script doit être exécuté depuis le répertoire docs-site
    pause
    exit /b 1
)

REM Vérifier que Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: Node.js n'est pas installé
    pause
    exit /b 1
)

REM Vérifier que npm est installé
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Erreur: npm n'est pas installé
    pause
    exit /b 1
)

echo 📦 Installation des dépendances...
npm install

echo 🔨 Build de la documentation...
npm run build

if errorlevel 1 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

echo ✅ Build réussi !

REM Vérifier si Vercel CLI est installé
vercel --version >nul 2>&1
if errorlevel 1 (
    echo 📥 Installation de Vercel CLI...
    npm install -g vercel
)

echo 🌐 Déploiement sur Vercel...
vercel --prod

if errorlevel 1 (
    echo ❌ Erreur lors du déploiement
    pause
    exit /b 1
)

echo 🎉 Déploiement réussi !
echo 📱 Votre documentation est maintenant disponible sur Vercel
pause
