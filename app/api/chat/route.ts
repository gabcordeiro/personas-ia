import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReply, type ChatMessage } from "@/lib/ai";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { conversationId, content } = await req.json();

  if (!conversationId || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  const { data: participants, error: partError } = await supabase
    .from("conversation_participants")
    .select("*, personas(*)")
    .eq("conversation_id", conversationId)
    .order("turn_order", { ascending: true });

  const persona = participants?.[0]?.personas as
    | { id: string; name: string; personality: string; tone: string | null }
    | undefined;

  if (partError || !persona) {
    return NextResponse.json({ error: "Nenhuma persona nesta conversa" }, { status: 400 });
  }

  const { data: userMessage, error: insertUserError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "user",
      content: content.trim(),
    })
    .select()
    .single();

  if (insertUserError) {
    return NextResponse.json({ error: insertUserError.message }, { status: 500 });
  }

  const { data: history } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const systemPrompt = [
    persona.personality,
    persona.tone ? `Tom de voz: ${persona.tone}.` : null,
    "Responda sempre em português, de forma natural, como se estivesse em uma conversa real.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).map((m): ChatMessage => ({
      role: m.sender_type === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  let replyContent: string;
  try {
    replyContent = await generateReply(chatMessages);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao gerar resposta" },
      { status: 502 }
    );
  }

  const { data: personaMessage, error: insertPersonaError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "persona",
      sender_persona_id: persona.id,
      content: replyContent,
    })
    .select()
    .single();

  if (insertPersonaError) {
    return NextResponse.json({ error: insertPersonaError.message }, { status: 500 });
  }

  return NextResponse.json({ userMessage, personaMessage });
}
