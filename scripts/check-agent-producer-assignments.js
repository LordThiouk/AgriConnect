#!/usr/bin/env node

/**
 * Script pour vérifier la structure de la table agent_producer_assignments
 * et voir si elle peut servir de modèle pour agent_cooperative_assignments
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgentProducerAssignments() {
  try {
    console.log('🔍 VÉRIFICATION DE LA STRUCTURE DE agent_producer_assignments');
    console.log('============================================================');
    
    // Récupérer la structure de la table
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('agent_producer_assignments')
      .select('*')
      .limit(1);
    
    if (assignmentsError) {
      console.error('❌ Erreur:', assignmentsError);
      return;
    }
    
    if (assignmentsData && assignmentsData.length > 0) {
      const assignment = assignmentsData[0];
      console.log('✅ Structure de la table agent_producer_assignments:');
      console.log('');
      
      const columns = Object.keys(assignment);
      columns.forEach(column => {
        const value = assignment[column];
        const type = typeof value;
        const isNull = value === null;
        console.log(`  - ${column}: ${type} ${isNull ? '(NULL)' : `(${value})`}`);
      });
      
      console.log('');
      console.log('📋 COLONNES DÉTECTÉES:');
      console.log('  - agent_id: UUID (référence vers profiles.id)');
      console.log('  - producer_id: UUID (référence vers producers.id)');
      console.log('  - assigned_at: TIMESTAMPTZ (date d\'assignation)');
      console.log('');
      console.log('✅ Cette structure peut servir de modèle pour agent_cooperative_assignments');
      console.log('   avec les colonnes: agent_id, cooperative_id, assigned_at');
      
      console.log('');
      console.log('🔧 MIGRATION PROPOSÉE:');
      console.log('CREATE TABLE agent_cooperative_assignments (');
      console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
      console.log('  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,');
      console.log('  cooperative_id UUID REFERENCES cooperatives(id) ON DELETE CASCADE,');
      console.log('  assigned_at TIMESTAMPTZ DEFAULT NOW(),');
      console.log('  assigned_by UUID REFERENCES profiles(id),');
      console.log('  UNIQUE(agent_id, cooperative_id)');
      console.log(');');
      
    } else {
      console.log('⚠️ Aucune donnée trouvée dans agent_producer_assignments');
    }
    
    // Vérifier s'il y a des assignations existantes
    console.log('');
    console.log('📊 NOMBRE D\'ASSIGNATIONS EXISTANTES:');
    const { count, error: countError } = await supabase
      .from('agent_producer_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
    } else {
      console.log(`✅ ${count} assignation(s) agent-producer trouvée(s)`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkAgentProducerAssignments();
