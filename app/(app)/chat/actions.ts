"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ConversationMode } from "@/lib/database.types";

export interface CreateConversationInput {
  mode: ConversationMode;
  personaIds: string[];
  title: string;
  initialMessage: string;
  maxTurns: number;
}

export async function createConversation(input: CreateConversationInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (input.personaIds.length === 0) {
    throw new Error("Selecione pelo menos uma persona");
  }
  if (input.mode === "multi_persona" && input.personaIds.length < 2) {
    throw new Error("Selecione pelo menos duas personas para o modo multi-persona");
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      owner_id: user.id,
      title: input.title || "Nova conversa",
      mode: input.mode,
      max_turns: input.maxTurns || 10,
      is_running: false,
    })
    .select()
    .single();

  if (convError || !conversation) {
    throw new Error(convError?.message ?? "Falha ao criar conversa");
  }

  const participantRows = input.personaIds.map((personaId, index) => ({
    conversation_id: conversation.id,
    persona_id: personaId,
    turn_order: index,
  }));

  const { error: partError } = await supabase
    .from("conversation_participants")
    .insert(participantRows);

  if (partError) {
    throw new Error(partError.message);
  }

  if (input.initialMessage.trim()) {
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_type: "user",
      content: input.initialMessage.trim(),
    });
    if (msgError) {
      throw new Error(msgError.message);
    }
  }

  revalidatePath("/chat");
  redirect(`/chat/${conversation.id}`);
}

export async function sendUserMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!content.trim()) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "user",
      content: content.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/chat/${conversationId}`);
  return data;
}

export async function setConversationRunning(conversationId: string, running: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("conversations")
    .update({ is_running: running })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);

  revalidatePath(`/chat/${conversationId}`);
}
