// Send pending notifications using Twilio (SMS/WhatsApp) and Expo Push
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type NotificationRow = {
  id: string;
  profile_id: string | null;  // Pour les agents inscrits
  producer_id: string | null; // Pour les producteurs non-inscrits  
  channel: string;
  title: string;
  body: string;
  status: string | null;
};

type TwilioResponse = {
  sid: string;
  status: string;
  error?: any;
};

async function sendSMS(to: string, body: string): Promise<{ success: boolean; twilioResponse?: TwilioResponse; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const phoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !phoneNumber) {
    return {
      success: false,
      error: "Missing Twilio environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)"
    };
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "To": to,
        "From": phoneNumber,
        "Body": body
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `Twilio API error: ${data.message || 'Unknown error'}`,
        twilioResponse: data
      };
    }

    return {
      success: true,
      twilioResponse: {
        sid: data.sid,
        status: data.status
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to send SMS: ${error.message}`
    };
  }
}

async function sendPush(_expoPushToken: string, _title: string, _body: string) {
  // TODO: integrate Expo push. For MVP, simulate success.
  await new Promise((r) => setTimeout(r, 5));
}

serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), { status: 500 });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Fetch a small batch of pending notifications (now with both profile_id and producer_id support)
  const { data, error } = await supabase
    .from("notifications")
    .select("id, profile_id, producer_id, channel, title, body, status")
    .eq("status", "pending")
    .limit(50);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const rows = (data ?? []) as NotificationRow[];
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const row of rows) {
    try {
      if (row.channel === "sms" || row.channel === "whatsapp") {
        let phoneNumber: string | null = null;

        // Logique hybride : producteur OU agent inscrit
        if (row.producer_id) {
          // Cas 1: Notification pour un producteur non-inscrit
          const { data: producerData, error: producerError } = await supabase
            .from("producers")
            .select("phone")
            .eq("id", row.producer_id)
            .single();

          if (!producerError && producerData?.phone) {
            phoneNumber = producerData.phone;
            console.log(`📱 Producteur non-inscrit trouvé: ${row.producer_id} -> ${phoneNumber}`);
          }
        } else if (row.profile_id) {
          // Cas 2: Notification pour un agent inscrit
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("phone")
            .eq("user_id", row.profile_id)  // CORRECTION: utiliser user_id pour la FK
            .single();

          if (!profileError && profileData?.phone) {
            phoneNumber = profileData.phone;
            console.log(`📱 Agent inscrit trouvé: ${row.profile_id} -> ${phoneNumber}`);
          }
        }

        if (!phoneNumber) {
          const recipientInfo = row.producer_id 
            ? `producer ${row.producer_id}` 
            : `agent ${row.profile_id}`;
            
          await supabase
            .from("notifications")
            .update({ 
              status: "failed", 
              error_message: `No phone number found for ${recipientInfo}`,
              updated_at: new Date().toISOString()
            })
            .eq("id", row.id);
          results.failed++;
          results.errors.push(`${recipientInfo}: No phone number found`);
          continue;
        }

        // Send SMS using Twilio
        console.log(`📱 Attempting to send SMS to ${phoneNumber} for notification ${row.id}`);
        const smsResult = await sendSMS(phoneNumber, row.body);

        if (smsResult.success) {
          await supabase
            .from("notifications")
            .update({ 
              status: "sent", 
              sent_at: new Date().toISOString(),
              metadata: { 
                twilio_sid: smsResult.twilioResponse?.sid,
                delivery_status: smsResult.twilioResponse?.status
              },
              updated_at: new Date().toISOString()
            })
            .eq("id", row.id);
          results.sent++;
          console.log(`✅ SMS sent successfully to ${phoneNumber} (SID: ${smsResult.twilioResponse?.sid})`);
        } else {
          await supabase
            .from("notifications")
            .update({ 
              status: "failed", 
              error_message: smsResult.error,
              metadata: { 
                twilio_error: smsResult.twilioResponse,
                attempted_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq("id", row.id);
          results.failed++;
          results.errors.push(`SMS failed for ${phoneNumber}: ${smsResult.error}`);
          console.log(`❌ SMS failed for ${phoneNumber}: ${smsResult.error}`);
        }

      } else if (row.channel === "push") {
        // For now, skip push notifications
        await supabase
          .from("notifications")
          .update({ 
            status: "failed", 
            error_message: "Push notifications not implemented yet",
            updated_at: new Date().toISOString()
          })
          .eq("id", row.id);
        results.failed++;
        results.errors.push(`Push notifications not implemented for notification ${row.id}`);
      }

    } catch (err) {
      await supabase
        .from("notifications")
        .update({ 
          status: "failed", 
          error_message: String(err),
          updated_at: new Date().toISOString()
        })
        .eq("id", row.id);
      results.failed++;
      results.errors.push(`Unknown error for ${row.id}: ${err.message}`);
      console.log(`❌ Unknown error for notification ${row.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ 
    ok: true, 
    processed: rows.length,
    results: {
      sent: results.sent,
      failed: results.failed,
      errors: results.errors
    }
  }), { status: 200 });
});


