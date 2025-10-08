import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TTSRequest {
  producer_id: string;
  phone_number: string;
  message: string;
  recommendation_id?: string;
}

interface LAfricaMobileResponse {
  success: boolean;
  call_id?: string;
  cost?: number;
  duration?: number;
  error?: string;
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

    // Parse request body
    const { producer_id, phone_number, message, recommendation_id }: TTSRequest = await req.json()

    if (!producer_id || !phone_number || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'producer_id, phone_number et message sont requis'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`📞 Envoi d'appel TTS Wolof à ${phone_number} pour le producteur ${producer_id}`)

    // 1. Enregistrer l'appel TTS en base (statut pending)
    const { data: ttsCall, error: insertError } = await supabaseClient
      .from('tts_calls')
      .insert({
        producer_id,
        phone_number,
        message,
        status: 'pending',
        recommendation_id
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion de l\'appel TTS:', insertError)
      throw new Error(`Erreur insertion appel TTS: ${insertError.message}`)
    }

    console.log(`✅ Appel TTS enregistré avec l'ID: ${ttsCall.id}`)

    // 2. Appeler l'API LAfricaMobile pour la traduction et l'appel
    const lafricamobileResponse = await callLAfricaMobileAPI(message, phone_number)

    // 3. Mettre à jour l'appel TTS avec les résultats
    const updateData: any = {
      status: lafricamobileResponse.success ? 'sent' : 'failed',
      completed_at: new Date().toISOString()
    }

    if (lafricamobileResponse.success) {
      updateData.lafricamobile_id = lafricamobileResponse.call_id
      updateData.cost = lafricamobileResponse.cost
      updateData.duration_seconds = lafricamobileResponse.duration
      updateData.translated_message = message // LAfricaMobile gère la traduction
    } else {
      updateData.error_message = lafricamobileResponse.error
    }

    const { error: updateError } = await supabaseClient
      .from('tts_calls')
      .update(updateData)
      .eq('id', ttsCall.id)

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour de l\'appel TTS:', updateError)
    }

    console.log(`✅ Appel TTS mis à jour: ${updateData.status}`)

    return new Response(
      JSON.stringify({
        success: lafricamobileResponse.success,
        tts_call_id: ttsCall.id,
        lafricamobile_id: lafricamobileResponse.call_id,
        cost: lafricamobileResponse.cost,
        duration: lafricamobileResponse.duration,
        error: lafricamobileResponse.error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: lafricamobileResponse.success ? 200 : 500,
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

async function callLAfricaMobileAPI(message: string, phoneNumber: string): Promise<LAfricaMobileResponse> {
  const username = Deno.env.get('LAFRICAMOBILE_USERNAME')
  const password = Deno.env.get('LAFRICAMOBILE_PASSWORD')
  const apiUrl = Deno.env.get('LAFRICAMOBILE_API_URL') || 'https://ttsapi.lafricamobile.com'
  const clientId = Deno.env.get('LAFRICAMOBILE_CLIENT_ID') || 'agriconnect'
  const clientSecret = Deno.env.get('LAFRICAMOBILE_CLIENT_SECRET') || 'agriconnect_secret'

  console.log('🔧 Configuration LAfricaMobile:')
  console.log(`   - Username: ${username ? 'Défini' : 'NON DÉFINI'}`)
  console.log(`   - Password: ${password ? 'Défini' : 'NON DÉFINI'}`)
  console.log(`   - API URL: ${apiUrl}`)
  console.log(`   - Client ID: ${clientId}`)
  console.log(`   - Client Secret: ${clientSecret ? 'Défini' : 'NON DÉFINI'}`)

  if (!username || !password) {
    console.error('❌ Variables d\'environnement LAfricaMobile manquantes')
    return {
      success: false,
      error: 'Configuration LAfricaMobile manquante'
    }
  }

  try {
    console.log('🌍 Appel de l\'API LAfricaMobile...')

    // Étape 0: Authentification OAuth2
    console.log('🔐 Authentification OAuth2...')
    const authResponse = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
        scope: 'tts',
        client_id: clientId,
        client_secret: clientSecret
      })
    })

    if (!authResponse.ok) {
      const authError = await authResponse.text()
      console.error('❌ Erreur d\'authentification:', authError)
      return {
        success: false,
        error: `Erreur d'authentification: ${authResponse.status} - ${authError}`
      }
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    if (!accessToken) {
      console.error('❌ Token d\'accès non reçu')
      return {
        success: false,
        error: 'Token d\'accès non reçu'
      }
    }

    console.log('✅ Authentification réussie')

    // Étape 1: Traduction français → wolof
    console.log('🌐 Traduction français → wolof...')
    const translateResponse = await fetch(`${apiUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        text: message,
        source_lang: 'fr',
        target_lang: 'wo'
      })
    })

    if (!translateResponse.ok) {
      throw new Error(`Erreur traduction: ${translateResponse.status}`)
    }

    const translateData = await translateResponse.json()
    const translatedMessage = translateData.translated_text || message

    console.log(`✅ Message traduit: ${translatedMessage}`)

    // Étape 2: Synthèse vocale
    console.log('🎵 Synthèse vocale...')
    const synthesizeResponse = await fetch(`${apiUrl}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        text: translatedMessage,
        voice: 'wolof_female',
        format: 'wav'
      })
    })

    if (!synthesizeResponse.ok) {
      throw new Error(`Erreur synthèse: ${synthesizeResponse.status}`)
    }

    const synthesizeData = await synthesizeResponse.json()
    const audioUrl = synthesizeData.audio_url

    console.log(`✅ Audio généré: ${audioUrl}`)

    // Étape 3: Envoi de l'appel
    console.log('📞 Envoi de l\'appel vocal...')
    const callResponse = await fetch(`${apiUrl}/push-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        audio_url: audioUrl,
        max_duration: 60
      })
    })

    if (!callResponse.ok) {
      throw new Error(`Erreur appel: ${callResponse.status}`)
    }

    const callData = await callResponse.json()

    console.log(`✅ Appel envoyé avec l'ID: ${callData.call_id}`)

    return {
      success: true,
      call_id: callData.call_id,
      cost: callData.cost || 0,
      duration: callData.duration || 0
    }

  } catch (error) {
    console.error('❌ Erreur API LAfricaMobile:', error)
    return {
      success: false,
      error: error.message
    }
  }
}