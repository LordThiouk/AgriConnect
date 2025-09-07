#!/usr/bin/env node

/**
 * Script de Correction - Rôle Utilisateur
 * Permet de corriger le rôle d'un utilisateur pour autoriser l'accès web
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
  console.log('👥 Liste des utilisateurs:\n');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, display_name, role, region, cooperative, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé');
      return;
    }

    console.log('ID Utilisateur'.padEnd(40) + 'Nom'.padEnd(20) + 'Rôle'.padEnd(15) + 'Région'.padEnd(15) + 'Créé le');
    console.log('-'.repeat(120));

    profiles.forEach(profile => {
      const displayName = (profile.display_name || 'Non défini').substring(0, 18);
      const role = (profile.role || '❌ Non défini').substring(0, 13);
      const region = (profile.region || 'Non définie').substring(0, 13);
      const createdAt = new Date(profile.created_at).toLocaleDateString();
      
      console.log(
        profile.user_id.substring(0, 38).padEnd(40) +
        displayName.padEnd(20) +
        role.padEnd(15) +
        region.padEnd(15) +
        createdAt
      );
    });

    console.log('\n💡 Utilisez l\'ID utilisateur pour corriger le rôle avec:');
    console.log('   node scripts/fix-user-role.js <user_id> <new_role>');
    console.log('\n📋 Rôles disponibles:');
    console.log('   - admin: Accès complet (web + mobile)');
    console.log('   - supervisor: Supervision (web + mobile)');
    console.log('   - coop_admin: Administrateur coopérative (web + mobile)');
    console.log('   - agent: Agent de terrain (mobile uniquement)');
    console.log('   - producer: Producteur (mobile uniquement)');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function fixUserRole(userId, newRole) {
  const validRoles = ['admin', 'supervisor', 'coop_admin', 'agent', 'producer'];
  
  if (!validRoles.includes(newRole)) {
    console.error('❌ Rôle invalide. Rôles disponibles:', validRoles.join(', '));
    return;
  }

  console.log(`🔧 Correction du rôle pour l'utilisateur: ${userId}`);
  console.log(`   Nouveau rôle: ${newRole}`);

  try {
    // Vérifier que l'utilisateur existe
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération du profil:', fetchError.message);
      return;
    }

    if (!existingProfile) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Profil trouvé:');
    console.log(`   Nom: ${existingProfile.display_name || 'Non défini'}`);
    console.log(`   Rôle actuel: ${existingProfile.role || 'Non défini'}`);
    console.log(`   Région: ${existingProfile.region || 'Non définie'}`);

    // Mettre à jour le rôle
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError.message);
      return;
    }

    console.log('✅ Rôle mis à jour avec succès!');
    console.log(`   Nouveau rôle: ${updatedProfile.role}`);

    // Vérifier l'accès web
    const webAllowedRoles = ['admin', 'supervisor', 'coop_admin'];
    const hasWebAccess = webAllowedRoles.includes(newRole);
    
    console.log(`\n🌐 Accès web: ${hasWebAccess ? '✅ Autorisé' : '❌ Non autorisé'}`);
    
    if (hasWebAccess) {
      console.log('   L\'utilisateur peut maintenant accéder à l\'interface web');
    } else {
      console.log('   L\'utilisateur doit utiliser l\'application mobile');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    await listUsers();
  } else if (args.length === 2) {
    const [userId, newRole] = args;
    await fixUserRole(userId, newRole);
  } else {
    console.log('Usage:');
    console.log('  node scripts/fix-user-role.js                    # Lister tous les utilisateurs');
    console.log('  node scripts/fix-user-role.js <user_id> <role>   # Corriger le rôle d\'un utilisateur');
    console.log('');
    console.log('Exemples:');
    console.log('  node scripts/fix-user-role.js');
    console.log('  node scripts/fix-user-role.js 123e4567-e89b-12d3-a456-426614174000 admin');
  }
}

main();
