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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch unsent reminders where remind_at is now or in the past
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*, events(title, event_date)")
      .eq("sent", false)
      .lte("remind_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    for (const reminder of reminders) {
      const eventTitle = (reminder as any).events?.title ?? "an event";
      const message = `⏰ Reminder: "${eventTitle}" starts in about 5 minutes! Don't miss it.`;

      let success = false;

      if (reminder.channel === "sms") {
        success = await sendSms(reminder.contact, message);
      } else if (reminder.channel === "telegram") {
        success = await sendTelegram(reminder.contact, message);
      }

      if (success) {
        await supabase
          .from("reminders")
          .update({ sent: true })
          .eq("id", reminder.id);
        sentCount++;
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-reminders error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const from = Deno.env.get("TWILIO_PHONE_NUMBER")!;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${token}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    }
  );

  const data = await res.text();
  if (!res.ok) {
    console.error("Twilio error:", data);
    return false;
  }
  return true;
}

async function sendTelegram(username: string, text: string): Promise<boolean> {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

  // First, we need to find the chat_id from the username.
  // Telegram Bot API doesn't support sending by username directly.
  // The user must have started a conversation with the bot first.
  // We'll try using getUpdates to find the chat_id for this username.
  const updatesRes = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates`
  );
  const updatesData = await updatesRes.json();

  if (!updatesData.ok) {
    console.error("Telegram getUpdates error:", updatesData);
    return false;
  }

  // Find chat_id by matching username (case-insensitive)
  const lowerUsername = username.toLowerCase();
  let chatId: number | null = null;

  for (const update of updatesData.result ?? []) {
    const msg = update.message;
    if (msg?.from?.username?.toLowerCase() === lowerUsername) {
      chatId = msg.chat.id;
      break;
    }
  }

  if (!chatId) {
    console.error(`Telegram: No chat found for @${username}. User must message the bot first.`);
    return false;
  }

  const sendRes = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    }
  );

  const sendData = await sendRes.json();
  if (!sendData.ok) {
    console.error("Telegram sendMessage error:", sendData);
    return false;
  }
  return true;
}
