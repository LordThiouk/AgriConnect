/**
 * Script pour créer un profil de test avec l'ID spécifique
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestProfile() {
  console.log('🔄 Création du profil de test...');
  
  const testProfile = {
    id: 'd6daff9e-c1af-4a96-ab51-bd8925813890',
    user_id: 'd6daff9e-c1af-4a96-ab51-bd8925813890',
    first_name: 'Test',
    last_name: 'User',
    role: 'agent',
    phone: '+221770951543',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Vérifier si le profil existe déjà
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testProfile.id)
      .single();

    if (existingProfile) {
      console.log('✅ Profil de test existe déjà:', existingProfile);
      return;
    }

    // Créer le profil
    const { data, error } = await supabase
      .from('profiles')
      .insert([testProfile])
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création du profil:', error);
      return;
    }

    console.log('✅ Profil de test créé avec succès:', data);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createTestProfile();
