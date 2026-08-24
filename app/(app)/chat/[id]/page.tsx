import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatRoom from "@/components/ChatRoom";
import type { Conversation, Message } from "@/lib/database.types";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("*, personas(*)")
    .eq("conversation_id", id)
    .order("turn_order", { ascending: true });

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChatRoom
      conversation={conversation as Conversation}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      participants={(participants ?? []) as any}
      initialMessages={(messages ?? []) as Message[]}
    />
  );
}
