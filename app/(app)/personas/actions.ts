"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface PersonaInput {
  name: string;
  personality: string;
  tone: string;
  color: string;
  avatarUrl: string | null;
}

export async function createPersona(input: PersonaInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("personas").insert({
    owner_id: user.id,
    name: input.name,
    personality: input.personality,
    tone: input.tone || null,
    color: input.color,
    avatar_url: input.avatarUrl,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/personas");
  redirect("/personas");
}

export async function updatePersona(id: string, input: PersonaInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("personas")
    .update({
      name: input.name,
      personality: input.personality,
      tone: input.tone || null,
      color: input.color,
      avatar_url: input.avatarUrl,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/personas");
  redirect("/personas");
}

export async function deletePersona(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("personas").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/personas");
}
