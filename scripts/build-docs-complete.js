const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const docsSiteDir = path.join(rootDir, 'docs-site');
const docsReportsDir = path.join(rootDir, 'docs-reports');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function runCommand(command, cwd = rootDir) {
  try {
    console.log(`🔧 Exécution: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    return false;
  }
}

function generateBuildReport() {
  const buildReport = {
    timestamp: new Date().toISOString(),
    status: 'success',
    steps: [
      'Migration des fichiers de documentation',
      'Correction de la syntaxe Markdown',
      'Correction des liens cassés',
      'Mise à jour de la sidebar',
      'Build Docusaurus',
      'Génération des métriques'
    ],
    metrics: {
      totalFiles: 0,
      totalWords: 0,
      totalLines: 0
    }
  };

  // Compter les fichiers et métriques
  const docsDir = path.join(docsSiteDir, 'docs');
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir, { recursive: true });
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    buildReport.metrics.totalFiles = mdFiles.length;
    
    let totalWords = 0;
    let totalLines = 0;
    
    mdFiles.forEach(file => {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const words = content.split(/\s+/).filter(word => word.length > 0).length;
      const lines = content.split('\n').length;
      
      totalWords += words;
      totalLines += lines;
    });
    
    buildReport.metrics.totalWords = totalWords;
    buildReport.metrics.totalLines = totalLines;
  }

  return buildReport;
}

console.log('🚀 Début du processus complet de build de la documentation AgriConnect');
console.log('=' .repeat(80));

// Étape 1: Migration des fichiers
console.log('\n📁 Étape 1: Migration des fichiers de documentation...');
if (!runCommand('node scripts/migrate-docs.js')) {
  console.error('❌ Échec de la migration des fichiers');
  process.exit(1);
}

// Étape 2: Correction de la syntaxe Markdown
console.log('\n🔧 Étape 2: Correction de la syntaxe Markdown...');
if (!runCommand('node scripts/fix-markdown-syntax.js')) {
  console.error('❌ Échec de la correction de la syntaxe Markdown');
  process.exit(1);
}

// Étape 3: Correction des liens cassés
console.log('\n🔗 Étape 3: Correction des liens cassés...');
if (!runCommand('node scripts/fix-broken-links.js')) {
  console.error('❌ Échec de la correction des liens cassés');
  process.exit(1);
}

// Étape 4: Build Docusaurus
console.log('\n🏗️ Étape 4: Build du site Docusaurus...');
if (!runCommand('npm run build', docsSiteDir)) {
  console.error('❌ Échec du build Docusaurus');
  process.exit(1);
}

// Étape 5: Génération du rapport
console.log('\n📊 Étape 5: Génération du rapport de build...');
const buildReport = generateBuildReport();

// Sauvegarder le rapport
ensureDirectoryExistence(path.join(docsReportsDir, 'temp.json'));
const reportPath = path.join(docsReportsDir, 'build-report.json');
fs.writeFileSync(reportPath, JSON.stringify(buildReport, null, 2));

console.log('\n🎉 Processus de build terminé avec succès !');
console.log('=' .repeat(80));
console.log('📊 Résumé:');
console.log(`  📁 Fichiers traités: ${buildReport.metrics.totalFiles}`);
console.log(`  📝 Mots total: ${buildReport.metrics.totalWords.toLocaleString('fr-FR')}`);
console.log(`  📄 Lignes total: ${buildReport.metrics.totalLines.toLocaleString('fr-FR')}`);
console.log(`  📋 Rapport sauvegardé: ${reportPath}`);
console.log('\n🌐 Pour tester le site localement:');
console.log(`  cd docs-site && npm run serve`);
console.log('\n📚 Le site de documentation est maintenant prêt !');
