const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMediaBucket() {
  console.log('🛠️ Création du bucket "media" pour Supabase Storage');
  console.log('===================================================\n');

  try {
    // 1. Vérifier si le bucket existe déjà
    console.log('1️⃣ Vérification des buckets existants...');
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erreur lors de la vérification des buckets:', listError);
      return;
    }

    const mediaBucket = existingBuckets.find(bucket => bucket.id === 'media');
    if (mediaBucket) {
      console.log('✅ Bucket "media" existe déjà !');
      console.log(`   - Nom: ${mediaBucket.name}`);
      console.log(`   - Public: ${mediaBucket.public}`);
      return;
    }

    console.log('ℹ️ Bucket "media" non trouvé, création en cours...');

    // 2. Créer le bucket via l'API (si disponible)
    // Note: L'API Supabase ne permet pas de créer des buckets via le client
    // Il faut le faire via l'interface web ou via une migration SQL
    
    console.log('⚠️ Impossible de créer le bucket via l\'API client');
    console.log('💡 Instructions pour créer le bucket manuellement:');
    console.log('\n1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet AgriConnect');
    console.log('3. Allez dans "Storage" dans le menu de gauche');
    console.log('4. Cliquez sur "New bucket"');
    console.log('5. Configurez le bucket:');
    console.log('   - Nom: media');
    console.log('   - Public: Oui (pour les URLs publiques)');
    console.log('   - File size limit: 10MB');
    console.log('   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif');
    console.log('\n6. Cliquez sur "Create bucket"');

    // 3. Tester l'upload après création manuelle
    console.log('\n🧪 Test d\'upload après création manuelle...');
    console.log('Exécutez: node scripts/test-storage-config.js');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

createMediaBucket();
