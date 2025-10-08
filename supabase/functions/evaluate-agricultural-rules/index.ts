import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RuleResult {
  producer_id: string;
  producer_name: string;
  crop_name: string;
  plot_name: string;
  days: number;
  additional_data: any;
}

interface Recommendation {
  title: string;
  message: string;
  producer_id: string;
  status: string;
  recommendation_type: string;
  priority: string;
  rule_code?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔧 Début de l\'évaluation des règles agricoles...')

    // 1. Récupérer toutes les règles actives
    const { data: rules, error: rulesError } = await supabaseClient
      .from('agri_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) {
      console.error('❌ Erreur lors de la récupération des règles:', rulesError)
      throw new Error(`Erreur récupération règles: ${rulesError.message}`)
    }

    console.log(`📋 ${rules.length} règles actives trouvées`)

    const allRecommendations: Recommendation[] = []

    // 2. Évaluer chaque règle
    for (const rule of rules) {
      console.log(`🔍 Évaluation de la règle: ${rule.name} (${rule.code})`)

      try {
        // Exécuter la condition de la règle
        const { data: ruleResults, error: ruleError } = await supabaseClient
          .rpc('execute_rule_condition', { 
            rule_condition: rule.condition_sql 
          })

        if (ruleError) {
          console.error(`❌ Erreur lors de l'exécution de la règle ${rule.code}:`, ruleError)
          continue
        }

        console.log(`📊 Règle ${rule.code}: ${ruleResults.length} producteurs affectés`)

        // 3. Générer des recommandations pour chaque résultat
        for (const result of ruleResults) {
          // Mapper les valeurs pour correspondre à la structure de la table
          const mapSeverityToPriority = (severity: string) => {
            switch (severity) {
              case 'critical': return 'urgent';
              case 'high': return 'high';
              case 'medium': return 'medium';
              case 'info': return 'low';
              default: return 'medium';
            }
          };

          const mapActionTypeToRecommendationType = (actionType: string) => {
            switch (actionType) {
              case 'recommendation': return 'fertilisation';
              case 'notification': return 'other';
              case 'alert': return 'pest_control';
              case 'warning': return 'irrigation';
              default: return 'fertilisation';
            }
          };

          // Déterminer le type de contenu (alerte ou recommandation)
          const isAlert = rule.action_type === 'alert' || rule.severity === 'critical';
          const titlePrefix = isAlert ? '🚨 ALERTE' : '💡 RECOMMANDATION';
          
          const recommendation: Recommendation = {
            title: `${titlePrefix} ${rule.code} - ${rule.name}`,
            message: rule.action_message
              .replace('{producer_name}', result.producer_name || 'Producteur')
              .replace('{crop_name}', result.crop_name || 'Culture')
              .replace('{plot_name}', result.plot_name || 'Parcelle'),
            producer_id: result.producer_id,
            status: 'pending',
            recommendation_type: mapActionTypeToRecommendationType(rule.action_type),
            priority: mapSeverityToPriority(rule.severity),
            rule_code: rule.code
          }

          allRecommendations.push(recommendation)
        }

      } catch (error) {
        console.error(`❌ Erreur lors de l'évaluation de la règle ${rule.code}:`, error)
        continue
      }
    }

    // Séparer les alertes des recommandations (basé sur le titre et la priorité)
    const alerts = allRecommendations.filter(rec => 
      rec.title.includes('🚨 ALERTE') || rec.priority === 'urgent'
    )
    const recommendations = allRecommendations.filter(rec => 
      !rec.title.includes('🚨 ALERTE') && rec.priority !== 'urgent'
    )

    console.log(`📋 Total: ${allRecommendations.length} éléments générés`)
    console.log(`🚨 Alertes: ${alerts.length}`)
    console.log(`💡 Recommandations: ${recommendations.length}`)

    // 4. Insérer les recommandations dans la base de données
    if (allRecommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('recommendations')
        .insert(allRecommendations)

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion des recommandations:', insertError)
        throw new Error(`Erreur insertion recommandations: ${insertError.message}`)
      }

      console.log(`✅ ${allRecommendations.length} éléments insérés avec succès`)
      if (alerts.length > 0) {
        console.log(`🚨 ${alerts.length} alertes critiques générées`)
      }
      if (recommendations.length > 0) {
        console.log(`💡 ${recommendations.length} recommandations générées`)
      }
    }

    // 5. Retourner le résumé
    const summary = {
      success: true,
      rules_evaluated: rules.length,
      total_generated: allRecommendations.length,
      alerts_generated: alerts.length,
      recommendations_generated: recommendations.length,
      timestamp: new Date().toISOString(),
      rules: rules.map(r => ({
        code: r.code,
        name: r.name,
        severity: r.severity,
        action_type: r.action_type
      }))
    }

    console.log('🎉 Évaluation des règles terminée avec succès')

    return new Response(
      JSON.stringify(summary),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})