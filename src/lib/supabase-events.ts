import { supabase } from "@/integrations/supabase/client";

export type EventCategory = "AMA" | "Quiz & Games" | "X Space" | "Workshop" | "Meetup" | "Builders Showcase" | "Educational";
export type EventStatus = "upcoming" | "live" | "past";

export interface DbEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  event_date: string;
  host: string;
  platform: string;
  join_link: string | null;
  share_link: string | null;
  recap_summary: string | null;
  recording_link: string | null;
  rsvp_count: number;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: EventCategory[] = [
  "AMA", "Quiz & Games", "X Space", "Workshop", "Meetup", "Builders Showcase", "Educational"
];

export async function fetchEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbEvent[];
}

export async function createEvent(event: Omit<DbEvent, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("events").insert(event).select().single();
  if (error) throw error;
  return data as DbEvent;
}

export async function updateEvent(id: string, updates: Partial<Omit<DbEvent, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase.from("events").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data as DbEvent;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");
  return (data ?? []).length > 0;
}
