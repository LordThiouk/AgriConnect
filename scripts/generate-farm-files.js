/**
 * Script pour générer des fiches d'exploitation à partir des données existantes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateFarmFilesForAgent(agentId) {
  console.log(`\n🔍 Génération des fiches pour l'agent: ${agentId}`);
  
  try {
    // 1. Récupérer les producteurs assignés à l'agent
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_producer_assignments')
      .select(`
        producer_id,
        producers!inner(
          id,
          first_name,
          last_name,
          village,
          commune,
          department,
          region,
          cooperative_id,
          cooperatives!inner(
            id,
            name
          )
        )
      `)
      .eq('agent_id', agentId);

    if (assignmentsError) {
      console.error('❌ Erreur lors de la récupération des assignations:', assignmentsError.message);
      return { success: false, error: assignmentsError.message };
    }

    if (!assignments || assignments.length === 0) {
      console.log('⚠️  Aucun producteur assigné à cet agent');
      return { success: true, farmFilesCreated: 0 };
    }

    console.log(`📊 ${assignments.length} producteur(s) assigné(s) trouvé(s)`);

    let farmFilesCreated = 0;
    const errors = [];

    // 2. Pour chaque producteur, créer une fiche d'exploitation
    for (const assignment of assignments) {
      const producer = assignment.producers;
      
      try {
        console.log(`\n👤 Traitement du producteur: ${producer.first_name} ${producer.last_name}`);

        // Vérifier si une fiche existe déjà pour ce producteur
        const { data: existingFarmFile } = await supabase
          .from('farm_files')
          .select('id, name')
          .eq('responsible_producer_id', producer.id)
          .eq('created_by', agentId)
          .single();

        if (existingFarmFile) {
          console.log(`   ✅ Fiche déjà existante: ${existingFarmFile.name}`);
          continue;
        }

        // Récupérer les parcelles du producteur
        const { data: plots, error: plotsError } = await supabase
          .from('plots')
          .select('id, name, area_hectares, soil_type, water_source')
          .eq('producer_id', producer.id);

        if (plotsError) {
          console.error(`   ❌ Erreur lors de la récupération des parcelles:`, plotsError.message);
          errors.push(`Producteur ${producer.first_name}: ${plotsError.message}`);
          continue;
        }

        console.log(`   📍 ${plots?.length || 0} parcelle(s) trouvée(s)`);

        // Calculer les statistiques
        const totalArea = plots?.reduce((sum, plot) => sum + (plot.area_hectares || 0), 0) || 0;
        const soilTypes = [...new Set(plots?.map(p => p.soil_type).filter(Boolean))] || [];
        const waterSources = [...new Set(plots?.map(p => p.water_source).filter(Boolean))] || [];

        // Créer la fiche d'exploitation
        const farmFileData = {
          name: `Fiche Exploitation - ${producer.first_name} ${producer.last_name}`,
          region: producer.region || 'Non spécifié',
          department: producer.department || 'Non spécifié',
          commune: producer.commune || 'Non spécifié',
          village: producer.village || 'Non spécifié',
          sector: producer.commune || 'Non spécifié',
          cooperative_id: producer.cooperative_id,
          responsible_producer_id: producer.id,
          census_date: new Date().toISOString().split('T')[0],
          material_inventory: {
            plots_count: plots?.length || 0,
            total_area_hectares: totalArea,
            soil_types: soilTypes,
            water_sources: waterSources,
            generated_at: new Date().toISOString(),
            generated_by: 'system'
          },
          created_by: agentId,
          status: 'draft'
        };

        const { data: farmFile, error: farmFileError } = await supabase
          .from('farm_files')
          .insert(farmFileData)
          .select('id, name')
          .single();

        if (farmFileError) {
          console.error(`   ❌ Erreur lors de la création de la fiche:`, farmFileError.message);
          errors.push(`Producteur ${producer.first_name}: ${farmFileError.message}`);
          continue;
        }

        console.log(`   ✅ Fiche créée: ${farmFile.name}`);
        console.log(`      📊 ${plots?.length || 0} parcelles, ${totalArea.toFixed(2)} ha`);
        console.log(`      🌱 Types de sol: ${soilTypes.join(', ') || 'Non spécifié'}`);
        console.log(`      💧 Sources d'eau: ${waterSources.join(', ') || 'Non spécifié'}`);
        
        farmFilesCreated++;

      } catch (error) {
        console.error(`   ❌ Erreur lors du traitement du producteur ${producer.first_name}:`, error);
        errors.push(`Producteur ${producer.first_name}: ${error.message}`);
      }
    }

    console.log(`\n📋 Résumé pour l'agent ${agentId}:`);
    console.log(`   ✅ Fiches créées: ${farmFilesCreated}`);
    console.log(`   ❌ Erreurs: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n🔍 Détails des erreurs:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

    return { 
      success: farmFilesCreated > 0, 
      farmFilesCreated, 
      errors 
    };

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return { success: false, error: error.message };
  }
}

async function generateFarmFilesForAllAgents() {
  console.log('🚀 Génération des fiches d\'exploitation pour tous les agents\n');

  try {
    // Récupérer tous les agents
    const { data: agents, error: agentsError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('role', 'agent');

    if (agentsError) {
      console.error('❌ Erreur lors de la récupération des agents:', agentsError.message);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️  Aucun agent trouvé');
      return;
    }

    console.log(`👥 ${agents.length} agent(s) trouvé(s)\n`);

    let totalFarmFilesCreated = 0;
    const allErrors = [];

    // Générer des fiches pour chaque agent
    for (const agent of agents) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`👤 Agent: ${agent.display_name || agent.id}`);
      
      const result = await generateFarmFilesForAgent(agent.id);
      
      totalFarmFilesCreated += result.farmFilesCreated || 0;
      allErrors.push(...(result.errors || []));
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 RÉSUMÉ GLOBAL');
    console.log(`${'='.repeat(50)}`);
    console.log(`✅ Total fiches créées: ${totalFarmFilesCreated}`);
    console.log(`❌ Total erreurs: ${allErrors.length}`);

    if (allErrors.length > 0) {
      console.log('\n🔍 Toutes les erreurs:');
      allErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🚀 Génération des fiches pour tous les agents...');
    await generateFarmFilesForAllAgents();
  } else if (args[0] === '--agent' && args[1]) {
    console.log(`🚀 Génération des fiches pour l'agent: ${args[1]}`);
    await generateFarmFilesForAgent(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node generate-farm-files.js                    # Génère pour tous les agents');
    console.log('  node generate-farm-files.js --agent <agent_id> # Génère pour un agent spécifique');
  }
}

main().catch(console.error);
