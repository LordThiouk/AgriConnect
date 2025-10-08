/**
 * Simuler le flux complet d'édition de visite mobile
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

async function debugMobileEditFlow() {
  console.log('🔍 Simulation du flux d\'édition de visite mobile\n');
  console.log('═'.repeat(80));
  
  // Test avec une visite existante
  const testVisitId = 'c67bf8ca-938d-4e87-889f-ca42d0c642d6';
  
  console.log(`📋 Test avec la visite: ${testVisitId}`);
  
  try {
    // 1. Simuler loadVisitData()
    console.log('\n1️⃣ Simulation de loadVisitData():');
    const { data: visitData, error: visitError } = await supabase.rpc('get_visit_for_edit', {
      p_visit_id: testVisitId
    });
    
    if (visitError || !visitData) {
      console.error('❌ Erreur RPC:', visitError);
      return;
    }
    
    console.log('✅ Visite récupérée via RPC');
    console.log('   Producer:', visitData.producer?.first_name, visitData.producer?.last_name);
    console.log('   Plot:', visitData.plot?.name);
    console.log('   Plot ID:', visitData.plot?.id);
    
    // 2. Simuler la création des objets comme dans le mobile
    console.log('\n2️⃣ Simulation de la création des objets:');
    
    const producerFromRPC = {
      id: visitData.producer.id,
      name: `${visitData.producer.first_name} ${visitData.producer.last_name}`,
      phone: visitData.producer.phone,
      village: visitData.producer.village,
      commune: visitData.producer.commune,
      region: visitData.producer.region,
      cooperative_id: visitData.producer.cooperative_id,
      is_active: true
    };
    
    const plotFromRPC = {
      id: visitData.plot.id,
      name: visitData.plot.name,
      area_hectares: visitData.plot.area_hectares,
      soil_type: visitData.plot.soil_type,
      water_source: visitData.plot.water_source,
      status: visitData.plot.status,
      producer_id: visitData.visit.producer_id
    };
    
    console.log('✅ Producteur créé:', producerFromRPC.name);
    console.log('✅ Parcelle créée:', plotFromRPC.name, 'ID:', plotFromRPC.id);
    
    // 3. Simuler l'état initial des listes
    console.log('\n3️⃣ Simulation de l\'état initial des listes:');
    let producers = [];
    let plots = [];
    let selectedProducer = null;
    let selectedPlot = null;
    let formData = {
      producer_id: '',
      plot_id: '',
      visit_date: new Date().toISOString(),
      visit_type: 'planned',
      status: 'scheduled',
      duration_minutes: 30,
      notes: '',
      weather_conditions: ''
    };
    
    console.log('État initial:');
    console.log('   producers.length:', producers.length);
    console.log('   plots.length:', plots.length);
    console.log('   selectedProducer:', selectedProducer);
    console.log('   selectedPlot:', selectedPlot);
    
    // 4. Simuler setFormData avec les données de la visite
    console.log('\n4️⃣ Simulation de setFormData:');
    formData = {
      producer_id: visitData.visit.producer_id,
      plot_id: visitData.visit.plot_id,
      visit_date: visitData.visit.visit_date,
      visit_type: visitData.visit.visit_type,
      status: visitData.visit.status,
      duration_minutes: visitData.visit.duration_minutes?.toString() || '',
      notes: visitData.visit.notes || '',
      weather_conditions: visitData.visit.weather_conditions || ''
    };
    
    console.log('formData mis à jour:');
    console.log('   producer_id:', formData.producer_id);
    console.log('   plot_id:', formData.plot_id);
    console.log('   visit_type:', formData.visit_type);
    console.log('   status:', formData.status);
    
    // 5. Simuler setSelectedProducer et setSelectedPlot
    console.log('\n5️⃣ Simulation de setSelectedProducer et setSelectedPlot:');
    selectedProducer = producerFromRPC;
    selectedPlot = plotFromRPC;
    
    console.log('selectedProducer:', selectedProducer.name);
    console.log('selectedPlot:', selectedPlot.name, 'ID:', selectedPlot.id);
    
    // 6. Simuler l'ajout aux listes
    console.log('\n6️⃣ Simulation de l\'ajout aux listes:');
    
    // Ajouter le producteur
    const producerExists = producers.some(p => p.id === producerFromRPC.id);
    if (!producerExists) {
      producers = [...producers, producerFromRPC];
      console.log('✅ Producteur ajouté à la liste');
    } else {
      console.log('⚠️ Producteur déjà dans la liste');
    }
    
    // Ajouter la parcelle
    const plotExists = plots.some(p => p.id === plotFromRPC.id);
    if (!plotExists) {
      plots = [...plots, plotFromRPC];
      console.log('✅ Parcelle ajoutée à la liste');
    } else {
      console.log('⚠️ Parcelle déjà dans la liste');
    }
    
    console.log('État après ajout:');
    console.log('   producers.length:', producers.length);
    console.log('   plots.length:', plots.length);
    
    // 7. Simuler la génération des options du dropdown
    console.log('\n7️⃣ Simulation de la génération des options du dropdown:');
    
    const plotOptions = [
      { value: '', label: 'Aucune parcelle spécifique' },
      ...plots.map(plot => ({
        value: plot.id,
        label: plot.name,
        subtitle: `${plot.area_hectares?.toFixed(2)} ha`
      }))
    ];
    
    console.log('plotOptions générées:');
    plotOptions.forEach((option, index) => {
      console.log(`   ${index}. ${option.label} (${option.value}) - ${option.subtitle}`);
    });
    
    // 8. Vérifier la sélection
    console.log('\n8️⃣ Vérification de la sélection:');
    console.log('formData.plot_id:', formData.plot_id);
    console.log('selectedPlot.id:', selectedPlot.id);
    console.log('Correspondance:', formData.plot_id === selectedPlot.id);
    
    const selectedOption = plotOptions.find(option => option.value === formData.plot_id);
    if (selectedOption) {
      console.log('✅ Option trouvée dans plotOptions:', selectedOption.label);
    } else {
      console.log('❌ Option NON trouvée dans plotOptions');
      console.log('   Recherche de:', formData.plot_id);
      console.log('   Options disponibles:', plotOptions.map(o => o.value));
    }
    
    // 9. Test de la condition du dropdown
    console.log('\n9️⃣ Test de la condition du dropdown:');
    console.log('selectedProducer:', !!selectedProducer);
    console.log('plotOptions.length:', plotOptions.length);
    console.log('Condition dropdown:', selectedProducer && plotOptions.length > 0);
    
    if (selectedProducer && plotOptions.length > 0) {
      console.log('✅ Dropdown devrait être affiché');
    } else {
      console.log('❌ Dropdown ne devrait PAS être affiché');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugMobileEditFlow().catch(console.error);
