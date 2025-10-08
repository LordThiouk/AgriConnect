const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugVisitEditIssues() {
  console.log('🔍 Debug des problèmes d\'édition de visite');
  console.log('='.repeat(50));

  try {
    const agentUserId = 'b00a283f-0a46-41d2-af95-8a256c9c2771';
    
    // 1. Récupérer une visite existante pour test
    console.log('\n1. 🔍 Récupération d\'une visite existante:');
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('id, notes, status, visit_type, duration_minutes')
      .limit(1);

    if (visitsError || !visits || visits.length === 0) {
      console.error('❌ Aucune visite trouvée:', visitsError);
      return;
    }

    const testVisit = visits[0];
    console.log('✅ Visite trouvée:', {
      id: testVisit.id,
      notes: testVisit.notes,
      status: testVisit.status,
      visit_type: testVisit.visit_type,
      duration_minutes: testVisit.duration_minutes
    });

    // 2. Tester le RPC get_visit_for_edit
    console.log('\n2. 🔍 Test du RPC get_visit_for_edit:');
    const { data: visitData, error: rpcError } = await supabase
      .rpc('get_visit_for_edit', {
        p_visit_id: testVisit.id
      });

    if (rpcError) {
      console.error('❌ Erreur RPC get_visit_for_edit:', rpcError);
    } else {
      console.log('✅ RPC get_visit_for_edit réussi');
      console.log('📋 Structure des données retournées:');
      console.log('   visit:', visitData?.visit ? '✅ Présent' : '❌ Manquant');
      console.log('   producer:', visitData?.producer ? '✅ Présent' : '❌ Manquant');
      console.log('   plot:', visitData?.plot ? '✅ Présent' : '❌ Manquant');
      
      if (visitData?.visit) {
        console.log('📝 Données de la visite:');
        console.log('   id:', visitData.visit.id);
        console.log('   notes:', visitData.visit.notes);
        console.log('   status:', visitData.visit.status);
        console.log('   visit_type:', visitData.visit.visit_type);
        console.log('   duration_minutes:', visitData.visit.duration_minutes);
        console.log('   weather_conditions:', visitData.visit.weather_conditions);
      }
      
      if (visitData?.producer) {
        console.log('👤 Données du producteur:');
        console.log('   id:', visitData.producer.id);
        console.log('   first_name:', visitData.producer.first_name);
        console.log('   last_name:', visitData.producer.last_name);
      }
      
      if (visitData?.plot) {
        console.log('🌾 Données de la parcelle:');
        console.log('   id:', visitData.plot.id);
        console.log('   name:', visitData.plot.name);
        console.log('   area_hectares:', visitData.plot.area_hectares);
      }
    }

    // 3. Tester la création d'une visite avec notes
    console.log('\n3. 📝 Test de création d\'une visite avec notes:');
    
    // Récupérer un producteur
    const { data: producers, error: producersError } = await supabase
      .from('producers')
      .select('id, first_name, last_name')
      .limit(1);

    if (producersError || !producers || producers.length === 0) {
      console.error('❌ Aucun producteur trouvé:', producersError);
      return;
    }

    const testProducer = producers[0];
    console.log('✅ Producteur trouvé:', testProducer);

    // Créer une visite avec notes
    const newVisitData = {
      producer_id: testProducer.id,
      plot_id: null,
      visit_date: new Date().toISOString(),
      visit_type: 'routine',
      status: 'scheduled',
      duration_minutes: 30,
      notes: 'Test de notes pour debug - ' + new Date().toISOString(),
      weather_conditions: 'Ensoleillé'
    };

    const { data: createResult, error: createError } = await supabase
      .rpc('create_visit', {
        p_agent_id: agentUserId,
        p_visit_data: newVisitData
      });

    if (createError) {
      console.error('❌ Erreur création visite:', createError);
    } else {
      console.log('✅ Visite créée avec notes:', createResult);
      
      const createdVisitId = createResult.data?.id;
      if (createdVisitId) {
        // Tester la récupération de cette visite
        console.log('\n4. 🔍 Test de récupération de la visite créée:');
        const { data: retrievedVisit, error: retrieveError } = await supabase
          .rpc('get_visit_for_edit', {
            p_visit_id: createdVisitId
          });

        if (retrieveError) {
          console.error('❌ Erreur récupération visite créée:', retrieveError);
        } else {
          console.log('✅ Visite récupérée avec succès');
          console.log('📝 Notes récupérées:', retrievedVisit?.visit?.notes);
          console.log('📝 Notes originales:', newVisitData.notes);
          console.log('✅ Correspondance:', retrievedVisit?.visit?.notes === newVisitData.notes ? 'OUI' : 'NON');
        }

        // Nettoyer la visite de test
        await supabase.rpc('delete_visit', { p_visit_id: createdVisitId });
        console.log('🧹 Visite de test nettoyée');
      }
    }

    // 5. Tester la mise à jour des notes
    console.log('\n5. 📝 Test de mise à jour des notes:');
    
    // Créer une visite pour le test de mise à jour
    const { data: updateTestVisit, error: updateCreateError } = await supabase
      .rpc('create_visit', {
        p_agent_id: agentUserId,
        p_visit_data: {
          ...newVisitData,
          notes: 'Notes originales'
        }
      });

    if (updateCreateError) {
      console.error('❌ Erreur création visite pour test mise à jour:', updateCreateError);
    } else {
      const updateVisitId = updateTestVisit.data?.id;
      console.log('✅ Visite créée pour test mise à jour:', updateVisitId);
      
      // Mettre à jour les notes
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_visit', {
          p_visit_id: updateVisitId,
          p_visit_data: {
            notes: 'Notes mises à jour - ' + new Date().toISOString()
          }
        });

      if (updateError) {
        console.error('❌ Erreur mise à jour notes:', updateError);
      } else {
        console.log('✅ Notes mises à jour avec succès');
        
        // Vérifier la mise à jour
        const { data: updatedVisit, error: verifyError } = await supabase
          .rpc('get_visit_for_edit', {
            p_visit_id: updateVisitId
          });

        if (verifyError) {
          console.error('❌ Erreur vérification mise à jour:', verifyError);
        } else {
          console.log('✅ Vérification mise à jour:');
          console.log('📝 Notes après mise à jour:', updatedVisit?.visit?.notes);
        }
      }

      // Nettoyer
      if (updateVisitId) {
        await supabase.rpc('delete_visit', { p_visit_id: updateVisitId });
        console.log('🧹 Visite de test mise à jour nettoyée');
      }
    }

    console.log('\n✅ Debug des problèmes d\'édition terminé !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugVisitEditIssues();
