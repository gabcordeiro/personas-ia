export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const BASE_URL = process.env.AI_API_BASE_URL || "http://localhost:11434/v1";
const API_KEY = process.env.AI_API_KEY || "ollama";
const MODEL = process.env.AI_MODEL || "llama3.2:3b";

/**
 * Adapter over any OpenAI-compatible chat completions endpoint
 * (Ollama local, OpenAI, or an Anthropic-compatible proxy) so the
 * rest of the app never needs to know which model is behind it.
 */
export async function generateReply(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI response missing content");
  }

  return content.trim();
}
