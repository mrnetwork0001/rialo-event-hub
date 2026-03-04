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
    const body = await req.json();
    const message = body?.message;

    if (!message?.text || !message?.chat?.id) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;
    const username = message.from?.username ?? null;
    const text = message.text.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

    if (text === "/start" || text.startsWith("/start ")) {
      // Subscribe user
      const { error } = await supabase
        .from("telegram_subscribers")
        .upsert(
          { chat_id: chatId, username, subscribed: true },
          { onConflict: "chat_id" }
        );

      if (error) {
        console.error("Upsert error:", error);
      }

      await sendTelegramMessage(
        botToken,
        chatId,
        "✅ You're subscribed! You'll receive notifications when new events are approved.\n\nSend /stop to unsubscribe."
      );
    } else if (text === "/stop") {
      await supabase
        .from("telegram_subscribers")
        .update({ subscribed: false })
        .eq("chat_id", chatId);

      await sendTelegramMessage(
        botToken,
        chatId,
        "🔕 You've been unsubscribed. Send /start to subscribe again."
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("telegram-webhook error:", err);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
