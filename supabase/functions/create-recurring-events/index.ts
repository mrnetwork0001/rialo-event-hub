import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find recurring events that have become "live" or "past" and need a new upcoming instance
    const { data: recurringEvents, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .neq("recurrence_type", "none")
      .in("status", ["live", "past"])
      .eq("approval_status", "approved");

    if (fetchError) throw fetchError;

    let created = 0;

    for (const event of recurringEvents ?? []) {
      // Check if there's already an upcoming child event for this recurring series
      const parentId = event.recurrence_parent_id || event.id;

      const { data: existingUpcoming } = await supabase
        .from("events")
        .select("id")
        .or(`recurrence_parent_id.eq.${parentId},id.eq.${parentId}`)
        .eq("status", "upcoming")
        .eq("approval_status", "approved")
        .limit(1);

      if (existingUpcoming && existingUpcoming.length > 0) {
        continue; // Already has an upcoming instance
      }

      // Calculate next event date
      const currentDate = new Date(event.event_date);
      let nextDate: Date;

      if (event.recurrence_type === "weekly") {
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (event.recurrence_type === "monthly") {
        nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        continue;
      }

      // Ensure next date is in the future
      const now = new Date();
      while (nextDate <= now) {
        if (event.recurrence_type === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
      }

      // Create new event instance
      const { error: insertError } = await supabase.from("events").insert({
        title: event.title,
        description: event.description,
        category: event.category,
        status: "upcoming",
        event_date: nextDate.toISOString(),
        host: event.host,
        platform: event.platform,
        join_link: event.join_link,
        share_link: event.share_link,
        image_url: event.image_url,
        is_pinned: event.is_pinned,
        recurrence_type: event.recurrence_type,
        recurrence_parent_id: parentId,
        approval_status: "approved",
        rsvp_count: 0,
        recap_summary: null,
        recording_link: null,
      });

      if (insertError) {
        console.error(`Failed to create recurring event from ${event.id}:`, insertError);
      } else {
        created++;
        console.log(`Created recurring event from ${event.id}, next date: ${nextDate.toISOString()}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
