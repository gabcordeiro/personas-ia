import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export async function getAboutMeText(
  supabase: SupabaseClient<Database>,
  ownerId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("about_me")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const text = data?.about_me?.trim();
  return text ? text : null;
}
