// Script pour insérer des données de test dans Supabase
import { createClient } from '@supabase/supabase-js';
import { mockProducers } from '../data/mockProducers';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuration Supabase manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedSupabase() {
  console.log('🌱 Début de l\'insertion des données de test...');

  try {
    // Vérifier si des données existent déjà
    const { count, error: countError } = await supabase
      .from('producers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors de la vérification:', countError);
      return;
    }

    if (count && count > 0) {
      console.log(`ℹ️  ${count} producteurs existent déjà dans la base`);
      console.log('Voulez-vous continuer quand même ? (y/N)');
      // Pour l'instant, on continue
    }

    // Préparer les données pour l'insertion
    const producersToInsert = mockProducers.map(producer => ({
      id: producer.id,
      cooperative_id: producer.cooperative_id,
      first_name: producer.first_name,
      last_name: producer.last_name,
      phone: producer.phone,
      email: producer.email,
      region: producer.region,
      department: producer.department,
      commune: producer.commune,
      is_active: producer.is_active,
      created_at: producer.created_at,
      updated_at: producer.updated_at
    }));

    console.log(`📝 Insertion de ${producersToInsert.length} producteurs...`);

    // Insérer par lots de 50 pour éviter les limites
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < producersToInsert.length; i += batchSize) {
      const batch = producersToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('producers')
        .insert(batch);

      if (error) {
        console.error(`❌ Erreur lors de l'insertion du lot ${Math.floor(i / batchSize) + 1}:`, error);
        continue;
      }

      inserted += batch.length;
      console.log(`✅ Lot ${Math.floor(i / batchSize) + 1} inséré: ${batch.length} producteurs`);
    }

    console.log(`🎉 Insertion terminée: ${inserted} producteurs insérés`);

    // Vérifier l'insertion
    const { count: finalCount, error: finalError } = await supabase
      .from('producers')
      .select('*', { count: 'exact', head: true });

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError);
    } else {
      console.log(`📊 Total final dans la base: ${finalCount} producteurs`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
seedSupabase();
