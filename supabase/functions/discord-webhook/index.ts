import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!DISCORD_WEBHOOK_URL) {
      throw new Error("DISCORD_WEBHOOK_URL is not configured");
    }

    const { event_id } = await req.json();
    if (!event_id) {
      throw new Error("event_id is required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (error || !event) {
      throw new Error("Event not found");
    }

    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    const categoryEmojis: Record<string, string> = {
      "AMA": "🎤",
      "Quiz & Games": "🎮",
      "X Space": "🐦",
      "Workshop": "🛠️",
      "Meetup": "🤝",
      "Builders Showcase": "🏗️",
      "Educational": "📚",
    };

    const emoji = categoryEmojis[event.category] || "📅";

    const fields = [
      { name: "📅 Date", value: formattedDate, inline: true },
      { name: "⏰ Time", value: formattedTime, inline: true },
      { name: "🏷️ Category", value: `${emoji} ${event.category}`, inline: true },
      { name: "🎙️ Host", value: event.host || "TBA", inline: true },
      { name: "📍 Platform", value: event.platform || "TBA", inline: true },
    ];

    if (event.join_link) {
      fields.push({ name: "🔗 Join Link", value: `[Click to Join](${event.join_link})`, inline: false });
    }

    const embed = {
      title: `${emoji} ${event.title}`,
      description: event.description || "No description provided.",
      color: 0xF5A623, // Gold color matching the site theme
      fields,
      thumbnail: event.image_url ? { url: event.image_url } : undefined,
      footer: {
        text: "Rialo Events Hub • rialo-event-hub.vercel.app",
      },
      timestamp: new Date().toISOString(),
    };

    const discordPayload = {
      content: "🚀 **New Event Just Dropped!**",
      embeds: [embed],
    };

    const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      throw new Error(`Discord webhook failed [${discordRes.status}]: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("discord-webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
