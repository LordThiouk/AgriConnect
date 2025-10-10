const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs-site', 'docs');

// Mapping des liens cassés vers les fichiers existants
const linkMappings = {
  // Liens vers des fichiers qui n'existent pas
  'endpoints.md': 'api/overview.md',
  'authentication.md': 'getting-started/supabase-setup.md',
  'postman.md': 'api/overview.md',
  'security.md': 'architecture/SECURITY.md',
  'maintenance.md': 'development/guide.md',
  
  // Liens vers des fichiers mobiles qui n'existent pas
  './UI_COMPONENTS_GUIDE.md': 'mobile/overview.md',
  './DESIGN_SYSTEM.md': 'mobile/overview.md',
  './MIGRATION_GUIDE.md': 'development/guide.md',
  
  // Liens vers intro qui n'existe pas
  '/docs/intro': '/docs/README'
};

function fixBrokenLinks(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix broken links
    Object.entries(linkMappings).forEach(([brokenLink, correctLink]) => {
      // Fix relative links
      const relativePattern = new RegExp(`\\[([^\\]]+)\\]\\(${brokenLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      const relativeReplacement = `[$1](${correctLink})`;
      
      if (content.match(relativePattern)) {
        content = content.replace(relativePattern, relativeReplacement);
        modified = true;
      }
      
      // Fix absolute links
      const absolutePattern = new RegExp(`\\[([^\\]]+)\\]\\(${brokenLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      const absoluteReplacement = `[$1](${correctLink})`;
      
      if (content.match(absolutePattern)) {
        content = content.replace(absolutePattern, absoluteReplacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed broken links in: ${path.relative(docsDir, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing links in ${filePath}:`, error.message);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.md')) {
      fixBrokenLinks(filePath);
    }
  });
}

console.log('🔧 Fixing broken links...');
processDirectory(docsDir);
console.log('✅ Broken links fixes completed!');
