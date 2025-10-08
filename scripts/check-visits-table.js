/**
 * Script pour vérifier la structure et les données de la table visits
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisitsTable() {
  try {
    console.log('🔍 Vérification de la table visits...\n');

    // 1. Vérifier la structure de la table en récupérant un échantillon
    console.log('📋 Structure de la table visits (via échantillon):');
    const { data: sampleVisit, error: sampleError } = await supabase
      .from('visits')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erreur lors de la récupération d\'un échantillon:', sampleError);
      console.log('   La table visits existe-t-elle ?');
      return;
    }

    if (sampleVisit && sampleVisit.length > 0) {
      console.log('   Colonnes détectées:');
      Object.keys(sampleVisit[0]).forEach(key => {
        const value = sampleVisit[0][key];
        const type = typeof value;
        console.log(`   - ${key}: ${type} ${value === null ? '(NULL)' : ''}`);
      });
    } else {
      console.log('   Aucune donnée trouvée dans la table visits');
    }

    // 2. Compter le nombre total de visites
    console.log('\n📊 Statistiques des visites:');
    const { count: totalVisits, error: countError } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
    } else {
      console.log(`   Total des visites: ${totalVisits}`);
    }

    // 3. Vérifier les visites par statut
    console.log('\n📈 Visites par statut:');
    const { data: statusStats, error: statusError } = await supabase
      .from('visits')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('❌ Erreur lors de la récupération des statuts:', statusError);
    } else {
      const statusCounts = statusStats.reduce((acc, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    // 4. Vérifier les visites par date
    console.log('\n📅 Visites par période:');
    const { data: dateStats, error: dateError } = await supabase
      .from('visits')
      .select('visit_date')
      .not('visit_date', 'is', null);

    if (dateError) {
      console.error('❌ Erreur lors de la récupération des dates:', dateError);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayVisits = dateStats.filter(v => v.visit_date === today).length;
      const yesterdayVisits = dateStats.filter(v => v.visit_date === yesterday).length;
      const tomorrowVisits = dateStats.filter(v => v.visit_date === tomorrow).length;
      const futureVisits = dateStats.filter(v => v.visit_date > today).length;
      const pastVisits = dateStats.filter(v => v.visit_date < today).length;

      console.log(`   - Aujourd'hui (${today}): ${todayVisits}`);
      console.log(`   - Hier (${yesterday}): ${yesterdayVisits}`);
      console.log(`   - Demain (${tomorrow}): ${tomorrowVisits}`);
      console.log(`   - Futures: ${futureVisits}`);
      console.log(`   - Passées: ${pastVisits}`);
    }

    // 5. Vérifier les agents assignés
    console.log('\n👥 Visites par agent:');
    const { data: agentStats, error: agentError } = await supabase
      .from('visits')
      .select('agent_id')
      .not('agent_id', 'is', null);

    if (agentError) {
      console.error('❌ Erreur lors de la récupération des agents:', agentError);
    } else {
      const agentCounts = agentStats.reduce((acc, visit) => {
        acc[visit.agent_id] = (acc[visit.agent_id] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(agentCounts).forEach(([agentId, count]) => {
        console.log(`   - Agent ${agentId.substring(0, 8)}...: ${count} visites`);
      });
    }

    // 6. Vérifier les producteurs assignés
    console.log('\n🌾 Visites par producteur:');
    const { data: producerStats, error: producerError } = await supabase
      .from('visits')
      .select('producer_id')
      .not('producer_id', 'is', null);

    if (producerError) {
      console.error('❌ Erreur lors de la récupération des producteurs:', producerError);
    } else {
      const producerCounts = producerStats.reduce((acc, visit) => {
        acc[visit.producer_id] = (acc[visit.producer_id] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   - Nombre de producteurs uniques: ${Object.keys(producerCounts).length}`);
      console.log(`   - Visites par producteur (top 5):`);
      Object.entries(producerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([producerId, count]) => {
          console.log(`     - Producteur ${producerId.substring(0, 8)}...: ${count} visites`);
        });
    }

    // 7. Vérifier les parcelles assignées
    console.log('\n🗺️ Visites par parcelle:');
    const { data: plotStats, error: plotError } = await supabase
      .from('visits')
      .select('plot_id')
      .not('plot_id', 'is', null);

    if (plotError) {
      console.error('❌ Erreur lors de la récupération des parcelles:', plotError);
    } else {
      const plotCounts = plotStats.reduce((acc, visit) => {
        acc[visit.plot_id] = (acc[visit.plot_id] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   - Nombre de parcelles uniques: ${Object.keys(plotCounts).length}`);
      console.log(`   - Visites par parcelle (top 5):`);
      Object.entries(plotCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([plotId, count]) => {
          console.log(`     - Parcelle ${plotId.substring(0, 8)}...: ${count} visites`);
        });
    }

    // 8. Afficher quelques exemples de visites
    console.log('\n📝 Exemples de visites (5 dernières):');
    const { data: sampleVisits, error: sampleVisitsError } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleVisitsError) {
      console.error('❌ Erreur lors de la récupération des exemples:', sampleVisitsError);
    } else {
      sampleVisits.forEach((visit, index) => {
        console.log(`   ${index + 1}. ID: ${visit.id}`);
        console.log(`      Agent: ${visit.agent_id}`);
        console.log(`      Producteur: ${visit.producer_id}`);
        console.log(`      Parcelle: ${visit.plot_id}`);
        console.log(`      Date: ${visit.visit_date}`);
        console.log(`      Statut: ${visit.status}`);
        console.log(`      Type: ${visit.visit_type || 'N/A'}`);
        console.log(`      Créé: ${visit.created_at}`);
        console.log('');
      });
    }

    console.log('✅ Vérification terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
checkVisitsTable();
