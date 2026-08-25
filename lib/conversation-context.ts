import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Message } from "./database.types";
import { generateReply, type ChatMessage } from "./ai";

/** How many of the most recent messages are always sent verbatim. */
const KEEP_RECENT = 16;
/** Re-summarize once this many not-yet-summarized messages pile up past the recent window. */
const RESUMMARIZE_CHUNK = 10;

interface ConversationSummaryState {
  summary: string | null;
  summary_covers_count: number;
}

/**
 * Keeps the prompt bounded in long/continuous conversations: once older
 * messages fall outside the recent window, they get folded into a running
 * summary (persisted on the conversation) instead of being resent verbatim
 * forever. Mutates `conversation` in place when it (re)generates the summary.
 */
export async function getConversationContext(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  conversation: ConversationSummaryState,
  allMessages: Message[],
  nameFor: (message: Message) => string
): Promise<{ summary: string | null; messages: Message[] }> {
  const cutoff = Math.max(0, allMessages.length - KEEP_RECENT);
  const pending = cutoff - conversation.summary_covers_count;

  if (cutoff > 0 && pending >= RESUMMARIZE_CHUNK) {
    const chunk = allMessages.slice(conversation.summary_covers_count, cutoff);
    const transcript = chunk.map((m) => `${nameFor(m)}: ${m.content}`).join("\n");

    const summarizeMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          "Você resume conversas de forma objetiva e compacta, em terceira pessoa, preservando fatos, decisões, tom geral e qualquer detalhe que importe para continuar a conversa depois. Não invente nada que não esteja no texto. Responda apenas com o resumo, sem comentários extras.",
      },
      {
        role: "user",
        content: conversation.summary
          ? `Resumo até agora:\n${conversation.summary}\n\nNovas mensagens a incorporar:\n${transcript}\n\nProduza um novo resumo atualizado, incorporando as novas mensagens ao resumo existente.`
          : `Resuma esta conversa até agora:\n${transcript}`,
      },
    ];

    try {
      const newSummary = await generateReply(summarizeMessages);
      await supabase
        .from("conversations")
        .update({ summary: newSummary, summary_covers_count: cutoff })
        .eq("id", conversationId);
      conversation.summary = newSummary;
      conversation.summary_covers_count = cutoff;
    } catch {
      // Summarization failing shouldn't break the conversation — just keep
      // sending full history until it succeeds on a later turn.
    }
  }

  const startIndex = Math.min(conversation.summary_covers_count, allMessages.length);
  return {
    summary: conversation.summary,
    messages: allMessages.slice(startIndex),
  };
}
