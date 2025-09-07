// Script de test pour vérifier la pagination
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le fichier mockProducers.ts et extraire les données
const mockProducersPath = join(__dirname, 'src', 'data', 'mockProducers.ts');
const mockProducersContent = readFileSync(mockProducersPath, 'utf8');

// Extraire le nombre de producteurs générés
const match = mockProducersContent.match(/for \(let i = 9; i <= (\d+); i\+\+\)/);
const maxProducers = match ? parseInt(match[1]) : 150;

console.log('=== Test de Pagination ===');
console.log(`Nombre maximum de producteurs générés: ${maxProducers}`);

// Simuler les données
const mockProducers = Array.from({ length: maxProducers }, (_, i) => ({
  id: (i + 1).toString(),
  first_name: `Producer${i + 1}`,
  last_name: `Last${i + 1}`,
  region: ['Dakar', 'Thiès', 'Diourbel', 'Kaolack', 'Fatick'][i % 5],
  is_active: i % 10 !== 0 // 90% actifs
}));

console.log(`Total des producteurs simulés: ${mockProducers.length}`);

// Test avec différentes tailles de page
const testPagination = (itemsPerPage) => {
  console.log(`\n--- Test avec ${itemsPerPage} éléments par page ---`);
  
  const totalPages = Math.ceil(mockProducers.length / itemsPerPage);
  console.log(`Nombre total de pages: ${totalPages}`);
  
  // Test de chaque page
  for (let page = 1; page <= Math.min(totalPages, 5); page++) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = mockProducers.slice(startIndex, endIndex);
    
    console.log(`Page ${page}: éléments ${startIndex + 1}-${Math.min(endIndex, mockProducers.length)} (${pageData.length} éléments)`);
    
    // Vérifier que les données sont correctes
    if (pageData.length > 0) {
      console.log(`  Premier: ${pageData[0].first_name} ${pageData[0].last_name}`);
      console.log(`  Dernier: ${pageData[pageData.length - 1].first_name} ${pageData[pageData.length - 1].last_name}`);
    }
  }
};

// Tests avec différentes tailles
testPagination(10);
testPagination(20);
testPagination(50);
testPagination(100);

console.log('\n=== Test de Filtrage ===');

// Test de filtrage par région
const regions = [...new Set(mockProducers.map(p => p.region))];
console.log(`Régions disponibles: ${regions.join(', ')}`);

regions.slice(0, 3).forEach(region => {
  const filtered = mockProducers.filter(p => p.region === region);
  console.log(`\nRégion "${region}": ${filtered.length} producteurs`);
  
  // Test de pagination sur les données filtrées
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  console.log(`  Pages: ${totalPages}`);
  
  if (totalPages > 0) {
    const firstPage = filtered.slice(0, itemsPerPage);
    console.log(`  Page 1: ${firstPage.length} éléments`);
  }
});

console.log('\n=== Test de Recherche ===');

// Test de recherche
const searchTerms = ['Producer1', 'Producer50', 'Producer100'];
searchTerms.forEach(term => {
  const results = mockProducers.filter(p => 
    p.first_name.toLowerCase().includes(term.toLowerCase()) ||
    p.last_name.toLowerCase().includes(term.toLowerCase())
  );
  console.log(`Recherche "${term}": ${results.length} résultats`);
});

console.log('\n=== Test Terminé ===');
