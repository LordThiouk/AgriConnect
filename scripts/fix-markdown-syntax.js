const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs-site', 'docs');

function fixMarkdownFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix common MDX issues
    const fixes = [
      // Fix numbered lists that might be causing issues
      {
        pattern: /^(\d+)\.\s*\*\*(.*?)\*\*:\s*(.*)$/gm,
        replacement: (match, num, title, content) => {
          return `${num}. **${title}**: ${content}`;
        }
      },
      // Fix special characters that might cause MDX issues
      {
        pattern: /<(\d+)/g,
        replacement: '&lt;$1'
      },
      {
        pattern: /(\d+)>/g,
        replacement: '$1&gt;'
      },
      // Fix unescaped angle brackets in content
      {
        pattern: /([^<])(\d+)([^>])/g,
        replacement: '$1$2$3'
      },
      // Fix potential JSX-like syntax issues
      {
        pattern: /(\d+)\s*:\s*([^<]*?)(\d+)/g,
        replacement: '$1: $2$3'
      }
    ];
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.relative(docsDir, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
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
      fixMarkdownFile(filePath);
    }
  });
}

console.log('🔧 Fixing Markdown syntax issues...');
processDirectory(docsDir);
console.log('✅ Markdown syntax fixes completed!');
