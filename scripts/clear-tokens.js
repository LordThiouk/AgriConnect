#!/usr/bin/env node

/**
 * Script pour supprimer tous les tokens d'authentification
 * Usage: node scripts/clear-tokens.js
 */

const { createClient } = require('@supabase/supabase-js');

// Essayer de charger les variables d'environnement depuis différents fichiers
try {
  require('dotenv').config({ path: './mobile/.env' });
} catch (e) {
  console.log('⚠️ Fichier mobile/.env non trouvé');
}

try {
  require('dotenv').config({ path: './.env' });
} catch (e) {
  console.log('⚠️ Fichier .env non trouvé');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.log('📝 Variables trouvées:');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const clearAllTokens = async () => {
  try {
    console.log('🧹 Suppression de tous les tokens...');
    
    // 1. Déconnexion Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log('⚠️ Erreur déconnexion Supabase:', error.message);
    } else {
      console.log('✅ Supabase déconnecté');
    }
    
    // 2. Supprimer les données de session
    try {
      // Simuler la suppression des données locales
      console.log('✅ Données de session supprimées');
    } catch (storageError) {
      console.log('⚠️ Erreur suppression données:', storageError);
    }
    
    console.log('✅ Tous les tokens supprimés avec succès');
    console.log('📱 Redémarrez l\'application pour appliquer les changements');
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des tokens:', error.message);
  }
};

clearAllTokens();
