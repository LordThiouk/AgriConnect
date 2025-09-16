// Send pending notifications using Twilio (SMS/WhatsApp) and Expo Push
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type NotificationRow = {
  id: string;
  profile_id: string;
  channel: string;
  title: string;
  body: string;
  status: string | null;
};

async function sendSMS(_to: string, _body: string) {
  // TODO: integrate Twilio. For MVP, simulate success.
  await new Promise((r) => setTimeout(r, 5));
}

async function sendPush(_expoPushToken: string, _title: string, _body: string) {
  // TODO: integrate Expo push. For MVP, simulate success.
  await new Promise((r) => setTimeout(r, 5));
}

serve(async () => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), { status: 500 });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Fetch a small batch of pending notifications
  const { data, error } = await supabase
    .from("notifications")
    .select("id, profile_id, channel, title, body, status")
    .eq("status", "pending")
    .limit(50);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const rows = (data ?? []) as NotificationRow[];
  for (const row of rows) {
    try {
      if (row.channel === "sms" || row.channel === "whatsapp") {
        // Lookup phone from profile or recipients
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", row.profile_id)
          .single();
        // In a real impl, fetch phone; here we simulate send
        await sendSMS("+221000000000", row.body);
      } else if (row.channel === "push") {
        await sendPush("ExponentPushToken[placeholder]", row.title, row.body);
      }
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (err) {
      await supabase
        .from("notifications")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", row.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: rows.length }), { status: 200 });
});


