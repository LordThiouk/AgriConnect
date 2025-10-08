const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  console.log('🔍 Vérification des buckets Supabase Storage');
  console.log('============================================\n');

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log(`📦 Nombre de buckets trouvés: ${buckets.length}`);
    console.log('\n📋 Détails des buckets:');
    
    buckets.forEach((bucket, index) => {
      console.log(`\n${index + 1}. ${bucket.id}`);
      console.log(`   - Nom: ${bucket.name}`);
      console.log(`   - Public: ${bucket.public}`);
      console.log(`   - Créé: ${bucket.created_at}`);
      console.log(`   - Taille max: ${bucket.file_size_limit || 'Non défini'}`);
      console.log(`   - Types MIME: ${bucket.allowed_mime_types?.join(', ') || 'Tous'}`);
    });

    const mediaBucket = buckets.find(b => b.id === 'media');
    if (mediaBucket) {
      console.log('\n✅ Bucket "media" trouvé !');
    } else {
      console.log('\n❌ Bucket "media" non trouvé');
      console.log('💡 Il faut le créer manuellement via l\'interface Supabase ou via une migration');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkBuckets();
