#!/usr/bin/env node

/**
 * Script de Debug - Rôle Utilisateur
 * Diagnostique le problème d'accès web
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugUserRole() {
  console.log('🔍 Diagnostic du rôle utilisateur...\n');

  try {
    // 1. Vérifier l'état d'authentification
    console.log('1️⃣ Vérification de l\'authentification...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError.message);
      return;
    }

    if (!user) {
      console.log('⚠️  Aucun utilisateur connecté');
      console.log('   Connectez-vous d\'abord via l\'interface web');
      return;
    }

    console.log('✅ Utilisateur connecté:', user.email || user.phone);
    console.log('   ID:', user.id);
    console.log('   Créé le:', new Date(user.created_at).toLocaleString());

    // 2. Vérifier les métadonnées utilisateur
    console.log('\n2️⃣ Vérification des métadonnées utilisateur...');
    console.log('   user_metadata:', JSON.stringify(user.user_metadata, null, 2));
    
    const userRole = user.user_metadata?.role;
    console.log('   Rôle dans user_metadata:', userRole || '❌ Non défini');

    // 3. Vérifier le profil dans la table profiles
    console.log('\n3️⃣ Vérification du profil dans la base de données...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
    } else if (profile) {
      console.log('✅ Profil trouvé:');
      console.log('   Rôle dans profiles.role:', profile.role || '❌ Non défini');
      console.log('   Display name:', profile.display_name || '❌ Non défini');
      console.log('   Région:', profile.region || '❌ Non définie');
      console.log('   Coopérative:', profile.cooperative || '❌ Non définie');
    } else {
      console.log('⚠️  Aucun profil trouvé pour cet utilisateur');
    }

    // 4. Vérifier les rôles autorisés pour le web
    console.log('\n4️⃣ Vérification des permissions web...');
    const webAllowedRoles = ['admin', 'supervisor', 'coop_admin'];
    const mobileOnlyRoles = ['agent', 'producer'];
    
    console.log('   Rôles autorisés pour le web:', webAllowedRoles.join(', '));
    console.log('   Rôles mobile uniquement:', mobileOnlyRoles.join(', '));
    
    const effectiveRole = profile?.role || userRole;
    console.log('   Rôle effectif:', effectiveRole || '❌ Non défini');
    
    if (effectiveRole) {
      const isWebAllowed = webAllowedRoles.includes(effectiveRole);
      const isMobileOnly = mobileOnlyRoles.includes(effectiveRole);
      
      console.log('   Accès web autorisé:', isWebAllowed ? '✅' : '❌');
      console.log('   Accès mobile uniquement:', isMobileOnly ? '✅' : '❌');
      
      if (!isWebAllowed && !isMobileOnly) {
        console.log('   ⚠️  Rôle non reconnu!');
      }
    }

    // 5. Suggestions de correction
    console.log('\n5️⃣ Suggestions de correction...');
    
    if (!effectiveRole) {
      console.log('🔧 Problème: Aucun rôle défini');
      console.log('   Solution: Mettre à jour le profil avec un rôle valide');
      console.log('   Exemple SQL:');
      console.log(`   UPDATE profiles SET role = 'admin' WHERE user_id = '${user.id}';`);
    } else if (mobileOnlyRoles.includes(effectiveRole)) {
      console.log('🔧 Problème: Rôle mobile uniquement');
      console.log('   Solution: Changer le rôle pour autoriser l\'accès web');
      console.log('   Rôles web autorisés: admin, supervisor, coop_admin');
      console.log('   Exemple SQL:');
      console.log(`   UPDATE profiles SET role = 'admin' WHERE user_id = '${user.id}';`);
    }

    // 6. Test des fonctions de validation
    console.log('\n6️⃣ Test des fonctions de validation...');
    
    if (effectiveRole) {
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_user_role', { role_text: effectiveRole });
      
      if (validationError) {
        console.error('❌ Erreur validation rôle:', validationError.message);
      } else {
        console.log('   Validation rôle:', validationResult ? '✅ Valide' : '❌ Invalide');
      }

      const { data: platformResult, error: platformError } = await supabase
        .rpc('can_access_platform', { user_role: effectiveRole, platform: 'web' });
      
      if (platformError) {
        console.error('❌ Erreur vérification plateforme:', platformError.message);
      } else {
        console.log('   Accès web autorisé (DB):', platformResult ? '✅' : '❌');
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error.message);
  }
}

// Exécuter le diagnostic
debugUserRole();
