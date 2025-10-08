/**
 * Lister toutes les visites disponibles avec leurs parcelles
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllVisits() {
  console.log('🔍 Liste de toutes les visites disponibles\n');
  console.log('═'.repeat(80));
  
  try {
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        producer_id,
        plot_id,
        visit_date,
        status,
        notes,
        producers!inner(first_name, last_name),
        plots!inner(name_season_snapshot, area_hectares, soil_type, water_source)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    if (!visits || visits.length === 0) {
      console.log('⚠️ Aucune visite trouvée');
      return;
    }
    
    console.log(`✅ ${visits.length} visites trouvées:\n`);
    
    visits.forEach((visit, index) => {
      console.log(`${index + 1}. Visite ID: ${visit.id}`);
      console.log(`   Producteur: ${visit.producers.first_name} ${visit.producers.last_name}`);
      console.log(`   Parcelle: ${visit.plots.name_season_snapshot}`);
      console.log(`   Plot ID: ${visit.plot_id}`);
      console.log(`   Superficie: ${visit.plots.area_hectares} ha`);
      console.log(`   Type de sol: ${visit.plots.soil_type}`);
      console.log(`   Source d'eau: ${visit.plots.water_source}`);
      console.log(`   Date: ${visit.visit_date}`);
      console.log(`   Statut: ${visit.status}`);
      console.log(`   Notes: ${visit.notes || 'Aucune'}`);
      console.log('');
    });
    
    // Chercher spécifiquement les visites avec "Parcelle B2 - Légumes"
    console.log('🔍 Recherche des visites avec "Parcelle B2 - Légumes":');
    const legumeVisits = visits.filter(v => v.plots.name_season_snapshot.includes('B2 - Légumes'));
    
    if (legumeVisits.length > 0) {
      console.log(`✅ ${legumeVisits.length} visite(s) trouvée(s) avec "Parcelle B2 - Légumes":`);
      legumeVisits.forEach((visit, index) => {
        console.log(`   ${index + 1}. ${visit.id} - ${visit.producers.first_name} ${visit.producers.last_name}`);
      });
    } else {
      console.log('⚠️ Aucune visite trouvée avec "Parcelle B2 - Légumes"');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

listAllVisits().catch(console.error);
