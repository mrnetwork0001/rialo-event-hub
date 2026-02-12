import { supabase } from "@/integrations/supabase/client";

export async function uploadEventImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("event-images")
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage
    .from("event-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
