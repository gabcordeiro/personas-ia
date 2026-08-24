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

  const { conversationId } = await req.json();

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId é obrigatório" }, { status: 400 });
  }

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  }

  if (conversation.mode !== "multi_persona") {
    return NextResponse.json(
      { error: "Conversa não está no modo multi_persona" },
      { status: 400 }
    );
  }

  const { data: participants, error: partError } = await supabase
    .from("conversation_participants")
    .select("*, personas(*)")
    .eq("conversation_id", conversationId)
    .order("turn_order", { ascending: true });

  if (partError || !participants || participants.length === 0) {
    return NextResponse.json({ error: "Nenhuma persona nesta conversa" }, { status: 400 });
  }

  const { data: history, error: historyError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  const personaTurnsSoFar = (history ?? []).filter((m) => m.sender_type === "persona").length;

  if (personaTurnsSoFar >= conversation.max_turns) {
    await supabase.from("conversations").update({ is_running: false }).eq("id", conversationId);
    return NextResponse.json({ done: true, reason: "max_turns" });
  }

  const nextParticipant = participants[personaTurnsSoFar % participants.length];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const persona = nextParticipant.personas as any;

  if (!persona) {
    return NextResponse.json({ error: "Persona não encontrada" }, { status: 400 });
  }

  const otherNames = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    participants.map((p) => [(p.personas as any).id, (p.personas as any).name])
  );

  const systemPrompt = [
    persona.personality,
    persona.tone ? `Tom de voz: ${persona.tone}.` : null,
    `Você é ${persona.name} e está em uma conversa em grupo com outras pessoas/personas. ` +
      "Responda apenas como você mesmo, em português, de forma natural e breve (1 a 4 frases). " +
      "Não repita o nome de quem está falando na sua resposta, apenas responda.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).map((m): ChatMessage => {
      if (m.sender_type === "persona" && m.sender_persona_id === persona.id) {
        return { role: "assistant", content: m.content };
      }
      const speaker =
        m.sender_type === "user"
          ? "Usuário"
          : otherNames.get(m.sender_persona_id ?? "") ?? "Outra pessoa";
      return { role: "user", content: `${speaker}: ${m.content}` };
    }),
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

  const { data: personaMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_type: "persona",
      sender_persona_id: persona.id,
      content: replyContent,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const done = personaTurnsSoFar + 1 >= conversation.max_turns;
  if (done) {
    await supabase.from("conversations").update({ is_running: false }).eq("id", conversationId);
  }

  return NextResponse.json({ message: personaMessage, done });
}
