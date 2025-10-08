/**
 * Configuration automatisation notifications AgriConnect
 */

// Load environment variables
import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_ROLE_KEY manquante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 CONFIGURATION AUTOMATISATION NOTIFICATIONS');
console.log('==============================================');

async function setupAutomation() {
  try {
    // OPTION 1: Automatisation via automation_tasks + pg_cron
    console.log('\n📋 Option 1: Automatisation via pg_cron');
    console.log('─────────────────────────');
    
    // 1. Créer une tâche d'automatisation
    const { data: automationTask, error: autoError } = await supabase
      .from('automation_tasks')
      .insert({
        name: 'Notifications SMS Analytics',
        task_type: 'notification',
        schedule_pattern: 'every 5 minutes',
        filter_condition: { status: 'pending', channel: ['sms'] },
        status: 'active'
      })
      .select()
      .single();

    if (autoError) {
      if (autoError.message.includes('already exists')) {
        console.log('✅ Tâche automatisation déjà configurée');
      } else {
        console.log('❌ Erreur automation_tasks:', autoError.message);
      }
    } else {
      console.log('✅ Tâche automation créée:', automationTask.id);
    }

    // 2. Configurer pg_cron pour appeler automatiquement send-notifications
    console.log('\n🕒 Configuration pg_cron (à vérifier)');
    console.log('vim supabase/migrations/xxx_setup_notifications_cron.sql');
    
    // OPTION 2: Edge Function avec déclenchement automatique via triggers de base
    console.log('\n📡 Option 2: Déclenchement automatique via triggers');
    console.log('──────────────────────────────────────────────────────');
    console.log('✅ CT/trigger sur nouvelles notifications → appelle send-notifications');
    
    // OPTION 3: Script externe périodique
    console.log('\n💻 Option 3: Script externe périodique');
    console.log('─────────────────────────────────────────');
    console.log('✅ Cron système → curl + Edge Function');
    
    console.log('\n📊 VÉRIFICATION FINALE AUTOMATISATION ACTIVE');
    console.log('============================================');
    
    const { data: checkTasks } = await supabase
      .from('automation_tasks')
      .select('name, status, schedule_pattern, task_type')
      .eq('task_type', 'notification');

    if (checkTasks && checkTasks.length > 0) {
      console.log('🟢 TÂCHES AUTOMATISATIONS ACTIVES DÉTECTÉES');
      checkTasks.forEach(task => {
        console.log(`   📌 ${task.name} (${task.status}) - ${task.schedule_pattern}`);
      });
    } else {
      console.log('🔴 AUCUNE AUTOMATISATION CONFIGURÉE');
      console.log('📝 Actions recommandées:');
      console.log('   1. Configurer pg_cron dans Supabase');
      console.log('   2. Ou déclencher via triggers');
      console.log('   3. Ou script externe périodique');
    }

  } catch (error) {
    console.error('\n💥 Erreur configuration automatisation:', error.message);
  }
}

// Lancement
setupAutomation().catch(e => console.error('🔥 Fatal error:', e.message));
