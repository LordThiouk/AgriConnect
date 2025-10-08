# Script de test des services AgriConnect (PowerShell)
# Usage: .\run-tests.ps1

Write-Host "🚀 AgriConnect Services Test Suite" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erreur: Exécutez ce script depuis le dossier mobile/scripts/" -ForegroundColor Red
    exit 1
}

# Vérifier les variables d'environnement
$supabaseUrl = $env:SUPABASE_URL
$supabaseAnonKey = $env:SUPABASE_ANON_KEY

if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    Write-Host "❌ Variables d'environnement manquantes:" -ForegroundColor Red
    Write-Host "   SUPABASE_URL: $(if ($supabaseUrl) { '✅' } else { '❌' })" -ForegroundColor $(if ($supabaseUrl) { 'Green' } else { 'Red' })
    Write-Host "   SUPABASE_ANON_KEY: $(if ($supabaseAnonKey) { '✅' } else { '❌' })" -ForegroundColor $(if ($supabaseAnonKey) { 'Green' } else { 'Red' })
    Write-Host ""
    Write-Host "💡 Assurez-vous que le fichier .env est présent à la racine du projet" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variables d'environnement détectées" -ForegroundColor Green
Write-Host ""

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Blue
    npm install
}

# Exécuter les tests
Write-Host "🧪 Exécution des tests des services..." -ForegroundColor Blue
Write-Host ""

npm run test:services

# Vérifier le code de sortie
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Tests terminés avec succès!" -ForegroundColor Green
    Write-Host "✅ Les services sont prêts pour la migration" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Certains tests ont échoué" -ForegroundColor Red
    Write-Host "Attention: Veuillez corriger les erreurs avant de continuer la migration" -ForegroundColor Yellow
    exit 1
}
