#!/usr/bin/env node

/**
 * Script de Mise à Jour - Métadonnées Utilisateur
 * Met à jour les user_metadata avec le rôle depuis la table profiles
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserMetadata(userId) {
  console.log(`🔄 Mise à jour des métadonnées pour l'utilisateur: ${userId}\n`);

  try {
    // 1. Récupérer le profil
    console.log('1️⃣ Récupération du profil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erreur profil:', profileError.message);
      return;
    }

    if (!profile) {
      console.error('❌ Profil non trouvé');
      return;
    }

    console.log('✅ Profil trouvé:');
    console.log(`   Nom: ${profile.display_name || 'Non défini'}`);
    console.log(`   Rôle: ${profile.role || 'Non défini'}`);

    if (!profile.role) {
      console.error('❌ Aucun rôle défini dans le profil');
      return;
    }

    // 2. Récupérer l'utilisateur Auth
    console.log('\n2️⃣ Récupération de l\'utilisateur Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error('❌ Erreur Auth:', authError.message);
      return;
    }

    if (!authUser.user) {
      console.error('❌ Utilisateur Auth non trouvé');
      return;
    }

    console.log('✅ Utilisateur Auth trouvé:');
    console.log(`   Email: ${authUser.user.email || 'Non défini'}`);
    console.log(`   Téléphone: ${authUser.user.phone || 'Non défini'}`);

    // 3. Mettre à jour les métadonnées
    console.log('\n3️⃣ Mise à jour des métadonnées...');
    const currentMetadata = authUser.user.user_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      role: profile.role,
      display_name: profile.display_name || currentMetadata.display_name,
      region: profile.region || currentMetadata.region,
      cooperative: profile.cooperative || currentMetadata.cooperative
    };

    console.log('   Métadonnées actuelles:', JSON.stringify(currentMetadata, null, 2));
    console.log('   Métadonnées mises à jour:', JSON.stringify(updatedMetadata, null, 2));

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: updatedMetadata
    });

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Métadonnées mises à jour avec succès!');
    console.log(`   Nouveau rôle dans user_metadata: ${updatedUser.user.user_metadata?.role}`);

    // 4. Vérification
    console.log('\n4️⃣ Vérification...');
    const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(userId);

    if (verifyError) {
      console.error('❌ Erreur vérification:', verifyError.message);
      return;
    }

    console.log('✅ Vérification réussie:');
    console.log(`   Rôle dans user_metadata: ${verifyUser.user.user_metadata?.role || 'Non défini'}`);
    console.log(`   Rôle dans profiles: ${profile.role}`);

    if (verifyUser.user.user_metadata?.role === profile.role) {
      console.log('\n🎉 Synchronisation réussie! L\'utilisateur peut maintenant accéder à l\'interface web.');
    } else {
      console.log('\n⚠️  Synchronisation incomplète. Vérifiez manuellement.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/update-user-metadata.js <user_id>');
    console.log('Exemple: node scripts/update-user-metadata.js 0891e1e5-9c29-48bc-bead-37342e5d99b1');
    return;
  }

  const userId = args[0];
  await updateUserMetadata(userId);
}

main();
