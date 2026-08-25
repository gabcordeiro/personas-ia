"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Conversation, Message, Persona } from "@/lib/database.types";
import { sendUserMessage, setConversationRunning } from "@/app/(app)/chat/actions";

type ParticipantWithPersona = {
  id: string;
  persona_id: string;
  turn_order: number;
  personas: Persona;
};

function personaById(participants: ParticipantWithPersona[], id: string | null) {
  if (!id) return undefined;
  return participants.find((p) => p.persona_id === id)?.personas;
}

function Avatar({ persona }: { persona?: Persona }) {
  if (!persona) {
    return (
      <div className="h-8 w-8 rounded-full bg-zinc-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
        ?
      </div>
    );
  }
  if (persona.avatar_url) {
    return (
      <Image
        src={persona.avatar_url}
        alt={persona.name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
      style={{ backgroundColor: persona.color }}
    >
      {persona.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatRoom({
  conversation,
  participants,
  initialMessages,
}: {
  conversation: Conversation;
  participants: ParticipantWithPersona[];
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState(false);
  const [typingPersonaName, setTypingPersonaName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isMulti = conversation.mode === "multi_persona";
  const singlePersona = !isMulti ? participants[0]?.personas : undefined;
  const isUnlimited = conversation.max_turns <= 0;
  const personaTurnsSoFar = messages.filter((m) => m.sender_type === "persona").length;
  const reachedMaxTurns = isMulti && !isUnlimited && personaTurnsSoFar >= conversation.max_turns;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingPersonaName]);

  useEffect(() => {
    return () => {
      runningRef.current = false;
    };
  }, []);

  async function handleSend1to1(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setError(null);
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao enviar mensagem");
      setMessages((prev) => [...prev, data.userMessage, data.personaMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  async function handleInjectMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setError(null);
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const message = await sendUserMessage(conversation.id, content);
      if (message) setMessages((prev) => [...prev, message as Message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  async function startAutoConversation() {
    if (reachedMaxTurns || running) return;
    setError(null);
    setRunning(true);
    runningRef.current = true;
    setConversationRunning(conversation.id, true).catch(() => {});

    while (runningRef.current) {
      const turnsSoFar = messages.filter((m) => m.sender_type === "persona").length;
      const next = participants[turnsSoFar % participants.length]?.personas;
      setTypingPersonaName(next?.name ?? null);

      try {
        const res = await fetch("/api/persona-turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: conversation.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erro ao gerar resposta");

        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (data.done) {
          runningRef.current = false;
          setRunning(false);
          setTypingPersonaName(null);
          break;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao gerar resposta");
        runningRef.current = false;
        setRunning(false);
        setTypingPersonaName(null);
        break;
      }

      await new Promise((r) => setTimeout(r, 1200));
    }

    setTypingPersonaName(null);
  }

  function pauseAutoConversation() {
    runningRef.current = false;
    setRunning(false);
    setTypingPersonaName(null);
    setConversationRunning(conversation.id, false).catch(() => {});
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3 mb-4">
        <div>
          <Link href="/chat" className="text-xs text-zinc-500 hover:underline">
            ← Conversas
          </Link>
          <h1 className="text-lg font-semibold">{conversation.title}</h1>
          <p className="text-xs text-zinc-500">
            {isMulti
              ? `Multi-persona${isUnlimited ? " · contínua ∞" : ""} · ${participants
                  .map((p) => p.personas.name)
                  .join(", ")}`
              : singlePersona?.name}
          </p>
        </div>
        {isMulti && (
          <div className="flex items-center gap-2">
            {reachedMaxTurns ? (
              <span className="text-xs text-zinc-500">Limite de turnos atingido</span>
            ) : running ? (
              <button
                onClick={pauseAutoConversation}
                className="rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5"
              >
                Pausar
              </button>
            ) : (
              <button
                onClick={startAutoConversation}
                className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5"
              >
                Iniciar conversa automática
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isUser = m.sender_type === "user";
          const persona = isUser ? undefined : personaById(participants, m.sender_persona_id);
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && <Avatar persona={persona} />}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 rounded-bl-sm"
                }`}
              >
                {!isUser && isMulti && (
                  <p className="text-xs font-semibold mb-0.5" style={{ color: persona?.color }}>
                    {persona?.name}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}

        {(sending || typingPersonaName) && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar persona={isMulti ? undefined : singlePersona} />
            <div className="rounded-2xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-500 italic">
              {typingPersonaName
                ? `${typingPersonaName} está digitando...`
                : `${singlePersona?.name ?? "Persona"} está digitando...`}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={isMulti ? handleInjectMessage : handleSend1to1}
        className="mt-4 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isMulti ? "Entrar na conversa..." : "Digite uma mensagem..."}
          disabled={sending}
          className="flex-1 rounded-full border border-black/10 dark:border-white/15 bg-transparent px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
