/**
 * Service de diagnostic pour les opérations visits
 * Aide à debugger les problèmes RLS et authentification
 */

import { supabase } from '../supabase';

export class VisitsDiagnostic {
  /**
   * Diagnostic complet de la session et des permissions
   */
  static async diagnoseVisitPermissions(visitId: string): Promise<void> {
    console.log('\n🔍 ════ DIAGNOSTIC PERMISSIONS VISITS ════\n');
    
    try {
      // 1. Vérifier la session auth
      console.log('1️⃣ Session Auth:');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('   ❌ PAS DE SESSION AUTH !');
        console.log('   → L\'utilisateur doit se reconnecter');
        return;
      }
      
      console.log('   ✅ Session active');
      console.log(`      user_id (auth.uid): ${session.user.id}`);
      console.log(`      email: ${session.user.email || 'N/A'}`);
      console.log(`      phone: ${session.user.phone || 'N/A'}`);
      console.log(`      expires_at: ${new Date(session.expires_at! * 1000).toLocaleString('fr-FR')}`);
      
      // 2. Vérifier le profil de l'utilisateur
      console.log('\n2️⃣ Profil Utilisateur:');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, role, phone, display_name')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (profileError || !profile) {
        console.log('   ❌ PROFIL NON TROUVÉ !');
        console.log(`      Erreur: ${profileError?.message || 'Profile vide'}`);
        return;
      }
      
      console.log('   ✅ Profil trouvé');
      console.log(`      profile_id: ${profile.id}`);
      console.log(`      role: ${profile.role}`);
      console.log(`      phone: ${profile.phone}`);
      console.log(`      user_id: ${profile.user_id}`);
      console.log(`      Match user_id: ${profile.user_id === session.user.id ? '✅' : '❌'}`);
      
      // 3. Vérifier la visite
      console.log('\n3️⃣ Visite:');
      const { data: visit, error: visitError } = await supabase
        .from('visits')
        .select('id, agent_id, producer_id, plot_id, status')
        .eq('id', visitId)
        .maybeSingle();
      
      if (visitError) {
        console.log(`   ❌ Erreur récupération visite: ${visitError.code} - ${visitError.message}`);
        return;
      }
      
      if (!visit) {
        console.log('   ❌ VISITE NON TROUVÉE (bloquée par RLS ou inexistante)');
        console.log('   → Vérifier que visit.agent_id correspond à profile.id');
        return;
      }
      
      console.log('   ✅ Visite accessible');
      console.log(`      visit_id: ${visit.id}`);
      console.log(`      agent_id: ${visit.agent_id}`);
      console.log(`      status: ${visit.status}`);
      console.log(`      Match agent_id: ${visit.agent_id === profile.id ? '✅' : '❌'}`);
      
      // 4. Test UPDATE
      console.log('\n4️⃣ Test UPDATE:');
      const { error: updateError } = await supabase
        .from('visits')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', visitId);
      
      if (updateError) {
        console.log(`   ❌ UPDATE échoue: ${updateError.code} - ${updateError.message}`);
        
        if (updateError.code === 'PGRST204') {
          console.log('   → RLS a filtré la visite (pas d\'accès)');
        }
      } else {
        console.log('   ✅ UPDATE fonctionne !');
      }
      
      // 5. Test DELETE (non destructif - ID différent)
      console.log('\n5️⃣ Test DELETE:');
      const { error: deleteError } = await supabase
        .from('visits')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        if (deleteError.code === 'PGRST116') {
          console.log('   ✅ DELETE autorisé (pas de correspondance)');
        } else {
          console.log(`   ❌ DELETE échoue: ${deleteError.code} - ${deleteError.message}`);
        }
      } else {
        console.log('   ✅ DELETE fonctionne !');
      }
      
      // 6. Résumé
      console.log('\n═'.repeat(40));
      console.log('\n📊 RÉSUMÉ:\n');
      
      const hasSession = !!session;
      const hasProfile = !!profile;
      const hasVisit = !!visit;
      const matchUserId = profile?.user_id === session.user.id;
      const matchAgentId = visit?.agent_id === profile?.id;
      
      console.log(`Session active:        ${hasSession ? '✅' : '❌'}`);
      console.log(`Profil trouvé:         ${hasProfile ? '✅' : '❌'}`);
      console.log(`Visite accessible:     ${hasVisit ? '✅' : '❌'}`);
      console.log(`Match user_id:         ${matchUserId ? '✅' : '❌'}`);
      console.log(`Match agent_id:        ${matchAgentId ? '✅' : '❌'}`);
      
      if (hasSession && hasProfile && hasVisit && matchUserId && matchAgentId) {
        console.log('\n🎉 TOUT EST OK ! UPDATE/DELETE devraient fonctionner.');
      } else {
        console.log('\n❌ PROBLÈME DÉTECTÉ !');
        
        if (!hasSession) console.log('   → Reconnecter l\'utilisateur');
        if (!hasProfile) console.log('   → Vérifier la table profiles');
        if (!hasVisit) console.log('   → Vérifier que visit.agent_id = profile.id');
        if (!matchUserId) console.log('   → Problème sync auth <> profiles');
        if (!matchAgentId) console.log('   → L\'agent n\'a pas accès à cette visite');
      }
      
    } catch (e: any) {
      console.error('❌ Erreur diagnostic:', e.message);
    }
    
    console.log('\n═'.repeat(40));
    console.log('');
  }
  
  /**
   * Log rapide de la session (à appeler au démarrage)
   */
  static async logSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('⚠️  PAS DE SESSION AUTH');
      return;
    }
    
    console.log('🔐 Session:', {
      user_id: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      expires_in: Math.floor((session.expires_at! * 1000 - Date.now()) / 1000 / 60) + ' min'
    });
  }
}

