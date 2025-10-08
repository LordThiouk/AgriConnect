const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeAlertsSystem() {
  console.log('🔍 Analyse du système d\'alertes AgriConnect');
  console.log('='.repeat(60));

  try {
    const agentUserId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    
    // 1. Vérifier la structure de la table recommendations
    console.log('\n1. 📋 Structure de la table recommendations:');
    console.log('─'.repeat(30));
    
    const { data: recommendations, error: recError } = await supabase
      .from('recommendations')
      .select('*')
      .limit(3);

    if (recError) {
      console.error('❌ Erreur récupération recommendations:', recError);
    } else {
      console.log(`✅ ${recommendations?.length || 0} recommandations trouvées`);
      if (recommendations && recommendations.length > 0) {
        console.log('\n📋 Structure de la table:');
        const sample = recommendations[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          console.log(`   ${key.padEnd(20)}: ${type} = ${value || 'N/A'}`);
        });
      }
    }

    // 2. Vérifier la structure de la table observations
    console.log('\n2. 📊 Structure de la table observations:');
    console.log('─'.repeat(30));
    
    const { data: observations, error: obsError } = await supabase
      .from('observations')
      .select('*')
      .limit(3);

    if (obsError) {
      console.error('❌ Erreur récupération observations:', obsError);
    } else {
      console.log(`✅ ${observations?.length || 0} observations trouvées`);
      if (observations && observations.length > 0) {
        console.log('\n📋 Structure de la table:');
        const sample = observations[0];
        Object.keys(sample).forEach(key => {
          const value = sample[key];
          const type = typeof value;
          console.log(`   ${key.padEnd(20)}: ${type} = ${value || 'N/A'}`);
        });
      }
    }

    // 3. Tester le RPC get_agent_terrain_alerts
    console.log('\n3. 🚨 Test du RPC get_agent_terrain_alerts:');
    console.log('─'.repeat(30));
    
    const { data: alerts, error: alertsError } = await supabase
      .rpc('get_agent_terrain_alerts', {
        p_user_id: agentUserId
      });

    if (alertsError) {
      console.error('❌ Erreur RPC get_agent_terrain_alerts:', alertsError);
    } else {
      console.log(`✅ RPC réussi: ${alerts?.length || 0} alertes trouvées`);
      
      if (alerts && alerts.length > 0) {
        console.log('\n📋 Détails des alertes:');
        alerts.forEach((alert, index) => {
          console.log(`\n${index + 1}. Alerte:`);
          console.log(`   ID: ${alert.id}`);
          console.log(`   Titre: ${alert.title}`);
          console.log(`   Description: ${alert.description}`);
          console.log(`   Sévérité: ${alert.severity}`);
          console.log(`   Parcelle: ${alert.plotName || 'N/A'}`);
          console.log(`   Producteur: ${alert.producerName || 'N/A'}`);
          console.log(`   Date: ${alert.createdAt}`);
        });
      } else {
        console.log('ℹ️ Aucune alerte trouvée pour cet agent');
      }
    }

    // 4. Analyser les observations avec haute sévérité
    console.log('\n4. 🔍 Analyse des observations avec haute sévérité:');
    console.log('─'.repeat(30));
    
    const { data: highSeverityObs, error: highSeverityError } = await supabase
      .from('observations')
      .select(`
        id,
        observation_type,
        description,
        severity,
        created_at,
        plots!inner(
          id,
          name_season_snapshot,
          producers!inner(
            id,
            first_name,
            last_name
          )
        )
      `)
      .gte('severity', 3)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);

    if (highSeverityError) {
      console.error('❌ Erreur récupération observations haute sévérité:', highSeverityError);
    } else {
      console.log(`✅ ${highSeverityObs?.length || 0} observations haute sévérité trouvées`);
      
      if (highSeverityObs && highSeverityObs.length > 0) {
        console.log('\n📋 Observations haute sévérité:');
        highSeverityObs.forEach((obs, index) => {
          console.log(`\n${index + 1}. Observation:`);
          console.log(`   ID: ${obs.id}`);
          console.log(`   Type: ${obs.observation_type}`);
          console.log(`   Description: ${obs.description}`);
          console.log(`   Sévérité: ${obs.severity}`);
          console.log(`   Parcelle: ${obs.plots?.name_season_snapshot || 'N/A'}`);
          console.log(`   Producteur: ${obs.plots?.producers?.first_name} ${obs.plots?.producers?.last_name}`);
          console.log(`   Date: ${obs.created_at}`);
        });
      }
    }

    // 5. Vérifier les règles agricoles
    console.log('\n5. 📜 Vérification des règles agricoles:');
    console.log('─'.repeat(30));
    
    const { data: rules, error: rulesError } = await supabase
      .from('agri_rules')
      .select('*')
      .limit(5);

    if (rulesError) {
      console.error('❌ Erreur récupération règles:', rulesError);
    } else {
      console.log(`✅ ${rules?.length || 0} règles agricoles trouvées`);
      
      if (rules && rules.length > 0) {
        console.log('\n📋 Règles agricoles:');
        rules.forEach((rule, index) => {
          console.log(`\n${index + 1}. Règle:`);
          console.log(`   Code: ${rule.code}`);
          console.log(`   Nom: ${rule.name}`);
          console.log(`   Type: ${rule.rule_type}`);
          console.log(`   Condition: ${rule.condition}`);
          console.log(`   Action: ${rule.action}`);
          console.log(`   Priorité: ${rule.priority}`);
        });
      }
    }

    // 6. Tester la génération d'alertes
    console.log('\n6. ⚙️ Test de génération d\'alertes:');
    console.log('─'.repeat(30));
    
    // Vérifier s'il y a des Edge Functions pour la génération d'alertes
    const { data: functions, error: functionsError } = await supabase
      .from('supabase_functions.functions')
      .select('name, status')
      .like('name', '%alert%');

    if (functionsError) {
      console.log('ℹ️ Impossible de vérifier les Edge Functions (normal en mode local)');
    } else {
      console.log(`✅ ${functions?.length || 0} fonctions liées aux alertes trouvées`);
      functions?.forEach(func => {
        console.log(`   - ${func.name}: ${func.status}`);
      });
    }

    // 7. Résumé du système d'alertes
    console.log('\n7. 📊 Résumé du système d\'alertes:');
    console.log('─'.repeat(30));
    
    console.log('🔍 Sources d\'alertes identifiées:');
    console.log('   1. 📊 Observations (table observations)');
    console.log('      - Sévérité >= 3 génère des alertes');
    console.log('      - Types: ravageur, maladie, levée');
    console.log('      - Via RPC get_agent_terrain_alerts');
    
    console.log('\n   2. 📜 Recommandations (table recommendations)');
    console.log('      - Générées par les règles agricoles');
    console.log('      - Statut "active" pour affichage');
    console.log('      - Via RPC unifié get_agent_dashboard_unified');
    
    console.log('\n   3. 🎯 Règles agricoles (table agri_rules)');
    console.log('      - Définissent les conditions d\'alerte');
    console.log('      - Génèrent des recommandations automatiques');
    console.log('      - Exécutées via Edge Functions ou triggers');

    console.log('\n🎯 Flux d\'alertes:');
    console.log('   1. Agent fait une observation → table observations');
    console.log('   2. Si sévérité >= 3 → alerte via get_agent_terrain_alerts');
    console.log('   3. Règles agricoles analysent les données → table recommendations');
    console.log('   4. Dashboard affiche les alertes actives');
    console.log('   5. Agent peut marquer comme "fait" ou "dismissed"');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

analyzeAlertsSystem();
