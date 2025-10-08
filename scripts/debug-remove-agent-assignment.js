const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ROLE_KEY
);

async function debugRemoveAgentAssignment() {
  console.log('🔍 Débogage de remove_agent_assignment...\n');

  try {
    // 1. Vérifier les fonctions RPC disponibles
    console.log('1️⃣ Vérification des fonctions RPC disponibles...');
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            routine_name, 
            routine_type,
            specific_name,
            parameter_name,
            data_type,
            parameter_mode
          FROM information_schema.routines 
          LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
          WHERE routine_schema = 'public' 
            AND routine_name LIKE '%agent%'
            AND routine_name LIKE '%assignment%'
          ORDER BY routine_name, ordinal_position;
        `
      });

    if (functionsError) {
      console.log('❌ Erreur lors de la récupération des fonctions:', functionsError.message);
      
      // Alternative: essayer une requête directe
      console.log('\n2️⃣ Tentative alternative...');
      const { data: altFunctions, error: altError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT routine_name, routine_type 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
              AND routine_name LIKE '%remove%agent%'
          `
        });
      
      if (altError) {
        console.log('❌ Erreur alternative aussi:', altError.message);
      } else {
        console.log('✅ Fonctions trouvées:', altFunctions);
      }
    } else {
      console.log('✅ Fonctions trouvées:', functions);
    }

    // 2. Tester directement la fonction avec différents paramètres
    console.log('\n3️⃣ Test direct de la fonction...');
    
    // D'abord, récupérer un assignment_id existant
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('id')
      .limit(1);

    if (assignmentsError) {
      console.log('❌ Erreur lors de la récupération des assignations:', assignmentsError.message);
      return;
    }

    if (!assignments || assignments.length === 0) {
      console.log('❌ Aucune assignation trouvée pour le test');
      return;
    }

    const assignmentId = assignments[0].id;
    console.log(`✅ Assignment ID pour test: ${assignmentId}`);

    // Tester la fonction avec l'ID
    console.log('\n4️⃣ Test remove_agent_assignment avec assignment_id_param...');
    const { data: result1, error: error1 } = await supabase
      .rpc('remove_agent_assignment', { 
        assignment_id_param: assignmentId 
      });

    if (error1) {
      console.log('❌ Erreur avec assignment_id_param:', error1.message);
    } else {
      console.log('✅ Succès avec assignment_id_param:', result1);
    }

    // Tester avec d'autres noms de paramètres possibles
    console.log('\n5️⃣ Test avec d\'autres noms de paramètres...');
    
    const { data: result2, error: error2 } = await supabase
      .rpc('remove_agent_assignment', { 
        assignment_id: assignmentId 
      });

    if (error2) {
      console.log('❌ Erreur avec assignment_id:', error2.message);
    } else {
      console.log('✅ Succès avec assignment_id:', result2);
    }

    // 3. Vérifier la structure de la table agent_assignments
    console.log('\n6️⃣ Vérification de la table agent_assignments...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'agent_assignments' 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.log('❌ Erreur lors de la vérification de la table:', tableError.message);
    } else {
      console.log('✅ Structure de la table agent_assignments:', tableInfo);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

debugRemoveAgentAssignment();
