import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, event } = await req.json();
    // type: "new_submission" | "event_approved"
    // event: { title, category, host, event_date, ... }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

    if (type === "new_submission") {
      // Notify admin subscribers only
      const { data: admins } = await supabase
        .from("telegram_subscribers")
        .select("chat_id")
        .eq("is_admin", true)
        .eq("subscribed", true);

      const eventDate = new Date(event.event_date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const message =
        `📥 <b>New Event Submission</b>\n\n` +
        `<b>${escapeHtml(event.title)}</b>\n` +
        `📂 ${escapeHtml(event.category)} · 🎙 ${escapeHtml(event.host)}\n` +
        `📅 ${eventDate}\n\n` +
        `Head to the admin panel to approve or reject it.`;

      for (const admin of admins ?? []) {
        await sendMessage(botToken, admin.chat_id, message);
      }

      return new Response(JSON.stringify({ sent: (admins ?? []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "event_approved") {
      // Notify all subscribers
      const { data: subscribers } = await supabase
        .from("telegram_subscribers")
        .select("chat_id")
        .eq("subscribed", true);

      const eventDate = new Date(event.event_date).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const message =
        `🎉 <b>New Event Published!</b>\n\n` +
        `<b>${escapeHtml(event.title)}</b>\n` +
        `📂 ${escapeHtml(event.category)} · 🎙 ${escapeHtml(event.host)}\n` +
        `📅 ${eventDate}\n` +
        (event.join_link ? `\n🔗 <a href="${escapeHtml(event.join_link)}">Join here</a>` : "") +
        `\n\nCheck it out on Rialo Events Hub!`;

      for (const sub of subscribers ?? []) {
        await sendMessage(botToken, sub.chat_id, message);
      }

      return new Response(JSON.stringify({ sent: (subscribers ?? []).length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-telegram error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage(botToken: string, chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error(`Failed to send to ${chatId}:`, e);
  }
}
