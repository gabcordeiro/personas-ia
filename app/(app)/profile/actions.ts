"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateAboutMe(aboutMe: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_profiles")
    .upsert({ owner_id: user.id, about_me: aboutMe.trim(), updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
}
