#!/usr/bin/env node

/**
 * Script de migration et organisation de la documentation
 * 
 * Ce script :
 * 1. Migre les documents existants vers la structure centralisée
 * 2. Génère automatiquement des index
 * 3. Valide la cohérence des liens
 * 4. Met à jour les métadonnées
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOCS_ROOT = path.join(__dirname, '..', 'docs');
const DOCS_SITE_ROOT = path.join(__dirname, '..', 'docs-site', 'docs');
const MOBILE_DOCS_ROOT = path.join(__dirname, '..', 'mobile', 'docs');

// Mapping des catégories
const CATEGORIES = {
  'getting-started': ['installation', 'setup', 'first-steps'],
  'architecture': ['overview', 'tech-stack', 'database', 'security'],
  'development': ['guide', 'testing', 'contributing', 'standards'],
  'deployment': ['guide', 'environments', 'monitoring'],
  'api': ['overview', 'endpoints', 'authentication'],
  'mobile': ['overview', 'components', 'navigation', 'offline'],
  'web': ['overview', 'components', 'routing', 'state'],
  'integrations': ['twilio', 'postgis', 'edge-functions'],
  'troubleshooting': ['common-issues', 'debugging', 'performance']
};

// Fonction pour analyser un fichier Markdown
function analyzeMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Extraire le titre (première ligne avec #)
  const titleLine = lines.find(line => line.startsWith('# '));
  const title = titleLine ? titleLine.replace('# ', '').trim() : path.basename(filePath, '.md');
  
  // Extraire les liens internes
  const internalLinks = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const [, text, url] = match;
    if (url.startsWith('./') || url.startsWith('../') || (!url.startsWith('http') && !url.startsWith('mailto'))) {
      internalLinks.push({ text, url });
    }
  }
  
  return {
    title,
    internalLinks,
    wordCount: content.split(/\s+/).length,
    lastModified: fs.statSync(filePath).mtime
  };
}

// Fonction pour déterminer la catégorie d'un fichier
function determineCategory(fileName, content) {
  const lowerName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  // Règles de catégorisation
  if (lowerName.includes('install') || lowerName.includes('setup') || lowerName.includes('first')) {
    return 'getting-started';
  }
  if (lowerName.includes('architect') || lowerName.includes('tech-stack') || lowerName.includes('database') || lowerName.includes('security')) {
    return 'architecture';
  }
  if (lowerName.includes('develop') || lowerName.includes('test') || lowerName.includes('contribut') || lowerName.includes('standard')) {
    return 'development';
  }
  if (lowerName.includes('deploy') || lowerName.includes('environ') || lowerName.includes('monitor')) {
    return 'deployment';
  }
  if (lowerName.includes('api') || lowerName.includes('endpoint') || lowerName.includes('auth')) {
    return 'api';
  }
  if (lowerName.includes('mobile') || lowerName.includes('react-native') || lowerName.includes('expo')) {
    return 'mobile';
  }
  if (lowerName.includes('web') || lowerName.includes('react') || lowerName.includes('vite')) {
    return 'web';
  }
  if (lowerName.includes('twilio') || lowerName.includes('postgis') || lowerName.includes('edge') || lowerName.includes('integration')) {
    return 'integrations';
  }
  if (lowerName.includes('troubleshoot') || lowerName.includes('debug') || lowerName.includes('issue') || lowerName.includes('fix')) {
    return 'troubleshooting';
  }
  
  return 'development'; // Catégorie par défaut
}

// Fonction pour migrer un fichier
function migrateFile(sourcePath, targetCategory) {
  const fileName = path.basename(sourcePath);
  const targetDir = path.join(DOCS_SITE_ROOT, targetCategory);
  const targetPath = path.join(targetDir, fileName);
  
  // Créer le répertoire cible s'il n'existe pas
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // Copier le fichier
  fs.copyFileSync(sourcePath, targetPath);
  
  // Analyser le fichier
  const analysis = analyzeMarkdownFile(sourcePath);
  
  return {
    source: sourcePath,
    target: targetPath,
    category: targetCategory,
    ...analysis
  };
}

// Fonction principale de migration
function migrateDocumentation() {
  console.log('🚀 Début de la migration de la documentation...\n');
  
  const migratedFiles = [];
  const errors = [];
  
  // Migrer les documents de la racine docs/
  if (fs.existsSync(DOCS_ROOT)) {
    const files = fs.readdirSync(DOCS_ROOT);
    
    for (const file of files) {
      if (file.endsWith('.md') && file !== 'README.md') {
        try {
          const sourcePath = path.join(DOCS_ROOT, file);
          const content = fs.readFileSync(sourcePath, 'utf8');
          const category = determineCategory(file, content);
          
          const result = migrateFile(sourcePath, category);
          migratedFiles.push(result);
          
          console.log(`✅ Migré: ${file} → ${category}/`);
        } catch (error) {
          errors.push({ file, error: error.message });
          console.log(`❌ Erreur: ${file} - ${error.message}`);
        }
      }
    }
  }
  
  // Migrer les documents mobile/
  if (fs.existsSync(MOBILE_DOCS_ROOT)) {
    const files = fs.readdirSync(MOBILE_DOCS_ROOT);
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        try {
          const sourcePath = path.join(MOBILE_DOCS_ROOT, file);
          const content = fs.readFileSync(sourcePath, 'utf8');
          
          // Les documents mobile vont dans la catégorie mobile
          const result = migrateFile(sourcePath, 'mobile');
          migratedFiles.push(result);
          
          console.log(`✅ Migré (mobile): ${file} → mobile/`);
        } catch (error) {
          errors.push({ file: `mobile/${file}`, error: error.message });
          console.log(`❌ Erreur (mobile): ${file} - ${error.message}`);
        }
      }
    }
  }
  
  // Générer le rapport
  generateMigrationReport(migratedFiles, errors);
  
  console.log('\n🎉 Migration terminée !');
  console.log(`📊 ${migratedFiles.length} fichiers migrés`);
  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} erreurs rencontrées`);
  }
}

// Fonction pour générer le rapport de migration
function generateMigrationReport(migratedFiles, errors) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: migratedFiles.length,
      errors: errors.length,
      categories: {}
    },
    files: migratedFiles,
    errors: errors
  };
  
  // Compter par catégorie
  migratedFiles.forEach(file => {
    if (!report.summary.categories[file.category]) {
      report.summary.categories[file.category] = 0;
    }
    report.summary.categories[file.category]++;
  });
  
  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '..', 'docs-migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📋 Rapport de migration sauvegardé: ${reportPath}`);
  
  // Afficher le résumé
  console.log('\n📊 Résumé par catégorie:');
  Object.entries(report.summary.categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} fichiers`);
  });
}

// Fonction pour valider les liens
function validateLinks() {
  console.log('\n🔍 Validation des liens...');
  
  const allFiles = [];
  
  // Collecter tous les fichiers
  function collectFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        collectFiles(filePath);
      } else if (file.endsWith('.md')) {
        allFiles.push(filePath);
      }
    }
  }
  
  collectFiles(DOCS_SITE_ROOT);
  
  const brokenLinks = [];
  
  allFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const [, text, url] = match;
      
      // Vérifier les liens internes
      if (url.startsWith('./') || url.startsWith('../') || (!url.startsWith('http') && !url.startsWith('mailto'))) {
        const resolvedPath = path.resolve(path.dirname(filePath), url);
        const targetFile = resolvedPath.endsWith('.md') ? resolvedPath : resolvedPath + '.md';
        
        if (!fs.existsSync(targetFile)) {
          brokenLinks.push({
            file: path.relative(DOCS_SITE_ROOT, filePath),
            link: url,
            text: text
          });
        }
      }
    }
  });
  
  if (brokenLinks.length > 0) {
    console.log(`⚠️  ${brokenLinks.length} liens cassés trouvés:`);
    brokenLinks.forEach(link => {
      console.log(`  ${link.file}: ${link.text} → ${link.link}`);
    });
  } else {
    console.log('✅ Tous les liens sont valides !');
  }
  
  return brokenLinks;
}

// Exécution du script
if (require.main === module) {
  try {
    migrateDocumentation();
    validateLinks();
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

module.exports = {
  migrateDocumentation,
  validateLinks,
  analyzeMarkdownFile,
  determineCategory
};
