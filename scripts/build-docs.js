#!/usr/bin/env node

/**
 * Script de build et déploiement de la documentation
 * 
 * Ce script :
 * 1. Build le site Docusaurus
 * 2. Valide la documentation
 * 3. Génère les métriques
 * 4. Prépare le déploiement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DOCS_SITE_ROOT = path.join(__dirname, '..', 'docs-site');
const BUILD_DIR = path.join(DOCS_SITE_ROOT, 'build');
const REPORTS_DIR = path.join(__dirname, '..', 'docs-reports');

// Fonction pour exécuter une commande
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`🔧 Exécution: ${command}`);
    const output = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    return output;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Fonction pour valider la documentation
function validateDocumentation() {
  console.log('🔍 Validation de la documentation...\n');
  
  const docsDir = path.join(DOCS_SITE_ROOT, 'docs');
  const issues = [];
  
  // Vérifier les fichiers Markdown
  function checkMarkdownFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkMarkdownFiles(filePath);
      } else if (file.endsWith('.md')) {
        checkMarkdownFile(filePath);
      }
    }
  }
  
  function checkMarkdownFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(DOCS_SITE_ROOT, filePath);
    
    // Vérifier la structure
    if (!content.startsWith('#')) {
      issues.push(`${relativePath}: Manque un titre principal (H1)`);
    }
    
    // Vérifier les liens cassés
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      
      // Vérifier les liens internes
      if (url.startsWith('./') || url.startsWith('../') || (!url.startsWith('http') && !url.startsWith('mailto'))) {
        const resolvedPath = path.resolve(path.dirname(filePath), url);
        const targetFile = resolvedPath.endsWith('.md') ? resolvedPath : resolvedPath + '.md';
        
        if (!fs.existsSync(targetFile)) {
          issues.push(`${relativePath}: Lien cassé "${text}" → ${url}`);
        }
      }
    }
    
    // Vérifier les images
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    while ((match = imageRegex.exec(content)) !== null) {
      const [, alt, src] = match;
      
      if (!src.startsWith('http')) {
        const resolvedPath = path.resolve(path.dirname(filePath), src);
        
        if (!fs.existsSync(resolvedPath)) {
          issues.push(`${relativePath}: Image manquante "${alt}" → ${src}`);
        }
      }
    }
    
    // Vérifier la longueur des lignes
    lines.forEach((line, index) => {
      if (line.length > 100) {
        issues.push(`${relativePath}: Ligne ${index + 1} trop longue (${line.length} caractères)`);
      }
    });
  }
  
  checkMarkdownFiles(docsDir);
  
  if (issues.length > 0) {
    console.log('⚠️  Problèmes trouvés:');
    issues.forEach(issue => console.log(`  ${issue}`));
    console.log(`\n📊 Total: ${issues.length} problèmes\n`);
  } else {
    console.log('✅ Aucun problème trouvé\n');
  }
  
  return issues;
}

// Fonction pour générer les métriques
function generateMetrics() {
  console.log('📊 Génération des métriques...\n');
  
  const docsDir = path.join(DOCS_SITE_ROOT, 'docs');
  const metrics = {
    timestamp: new Date().toISOString(),
    files: {
      total: 0,
      byCategory: {}
    },
    content: {
      totalWords: 0,
      totalLines: 0,
      averageWordsPerFile: 0
    },
    links: {
      internal: 0,
      external: 0,
      broken: 0
    }
  };
  
  // Analyser les fichiers
  function analyzeFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        analyzeFiles(filePath);
      } else if (file.endsWith('.md')) {
        analyzeFile(filePath);
      }
    }
  }
  
  function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(docsDir, filePath);
    const category = path.dirname(relativePath) || 'root';
    
    metrics.files.total++;
    metrics.files.byCategory[category] = (metrics.files.byCategory[category] || 0) + 1;
    
    // Compter les mots et lignes
    const words = content.split(/\s+/).length;
    const lines = content.split('\n').length;
    
    metrics.content.totalWords += words;
    metrics.content.totalLines += lines;
    
    // Analyser les liens
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      
      if (url.startsWith('http')) {
        metrics.links.external++;
      } else {
        metrics.links.internal++;
      }
    }
  }
  
  analyzeFiles(docsDir);
  
  // Calculer les moyennes
  if (metrics.files.total > 0) {
    metrics.content.averageWordsPerFile = Math.round(metrics.content.totalWords / metrics.files.total);
  }
  
  // Sauvegarder les métriques
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  const metricsPath = path.join(REPORTS_DIR, 'docs-metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
  
  console.log('📈 Métriques générées:');
  console.log(`  Fichiers: ${metrics.files.total}`);
  console.log(`  Mots: ${metrics.content.totalWords.toLocaleString()}`);
  console.log(`  Lignes: ${metrics.content.totalLines.toLocaleString()}`);
  console.log(`  Mots par fichier: ${metrics.content.averageWordsPerFile}`);
  console.log(`  Liens internes: ${metrics.links.internal}`);
  console.log(`  Liens externes: ${metrics.links.external}`);
  console.log(`\n📊 Métriques sauvegardées: ${metricsPath}\n`);
  
  return metrics;
}

// Fonction pour build le site
function buildSite() {
  console.log('🏗️  Build du site Docusaurus...\n');
  
  // Installer les dépendances si nécessaire
  if (!fs.existsSync(path.join(DOCS_SITE_ROOT, 'node_modules'))) {
    console.log('📦 Installation des dépendances...');
    runCommand('npm install', DOCS_SITE_ROOT);
  }
  
  // Build du site
  runCommand('npm run build', DOCS_SITE_ROOT);
  
  // Vérifier que le build a réussi
  if (!fs.existsSync(BUILD_DIR)) {
    throw new Error('Le build a échoué - dossier build manquant');
  }
  
  console.log('✅ Build réussi\n');
}

// Fonction pour générer le rapport final
function generateReport(issues, metrics) {
  console.log('📋 Génération du rapport final...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    build: {
      status: 'success',
      buildDir: BUILD_DIR,
      size: getDirSize(BUILD_DIR)
    },
    validation: {
      issues: issues.length,
      details: issues
    },
    metrics: metrics,
    nextSteps: [
      'Vérifier le site localement: npm run serve',
      'Déployer sur Vercel: vercel --prod',
      'Mettre à jour les liens dans le README principal'
    ]
  };
  
  const reportPath = path.join(REPORTS_DIR, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📄 Rapport final généré:');
  console.log(`  Status: ${report.build.status}`);
  console.log(`  Taille: ${formatBytes(report.build.size)}`);
  console.log(`  Problèmes: ${report.validation.issues}`);
  console.log(`  Fichiers: ${report.metrics.files.total}`);
  console.log(`\n📊 Rapport sauvegardé: ${reportPath}\n`);
  
  return report;
}

// Fonction utilitaire pour calculer la taille d'un dossier
function getDirSize(dir) {
  let size = 0;
  
  function calculateSize(itemPath) {
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      files.forEach(file => {
        calculateSize(path.join(itemPath, file));
      });
    } else {
      size += stat.size;
    }
  }
  
  if (fs.existsSync(dir)) {
    calculateSize(dir);
  }
  
  return size;
}

// Fonction utilitaire pour formater les bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Fonction principale
function main() {
  console.log('🚀 Début du build de la documentation AgriConnect\n');
  
  try {
    // 1. Valider la documentation
    const issues = validateDocumentation();
    
    // 2. Générer les métriques
    const metrics = generateMetrics();
    
    // 3. Build le site
    buildSite();
    
    // 4. Générer le rapport final
    const report = generateReport(issues, metrics);
    
    console.log('🎉 Build terminé avec succès !');
    console.log('\n📋 Prochaines étapes:');
    report.nextSteps.forEach(step => console.log(`  ${step}`));
    
  } catch (error) {
    console.error('❌ Erreur lors du build:', error.message);
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  validateDocumentation,
  generateMetrics,
  buildSite,
  generateReport
};
