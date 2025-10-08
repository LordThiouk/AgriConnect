require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erreur: Les variables d\'environnement Supabase sont manquantes.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkStoragePolicies() {
  console.log('🔍 Vérification des politiques RLS du bucket media');
  console.log('================================================\n');

  try {
    // Vérifier les politiques RLS pour storage.objects
    const { data: policies, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'objects' 
            AND schemaname = 'storage'
          ORDER BY policyname;
        `
      });

    if (error) {
      console.error('❌ Erreur lors de la récupération des politiques:', error);
      return;
    }

    console.log(`📊 Politiques trouvées: ${policies.length}`);
    console.log('');

    policies.forEach((policy, index) => {
      console.log(`${index + 1}. ${policy.policyname}`);
      console.log(`   - Commande: ${policy.cmd}`);
      console.log(`   - Condition: ${policy.qual || 'N/A'}`);
      console.log(`   - With Check: ${policy.with_check || 'N/A'}`);
      console.log('');
    });

    // Vérifier spécifiquement les politiques pour le bucket media
    const mediaPolicies = policies.filter(p => 
      p.policyname.toLowerCase().includes('media') || 
      p.qual?.includes('media') ||
      p.with_check?.includes('media')
    );

    console.log(`🎯 Politiques spécifiques au bucket media: ${mediaPolicies.length}`);
    mediaPolicies.forEach((policy, index) => {
      console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
    });

    if (mediaPolicies.length >= 4) {
      console.log('\n✅ Configuration RLS du bucket media complète !');
    } else {
      console.log(`\n⚠️ Configuration RLS du bucket media incomplète (${mediaPolicies.length}/4 politiques attendues)`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkStoragePolicies();
