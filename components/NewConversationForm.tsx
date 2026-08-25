"use client";

import { useState, useTransition } from "react";
import type { Persona, ConversationMode } from "@/lib/database.types";
import { createConversation } from "@/app/(app)/chat/actions";

export default function NewConversationForm({
  personas,
  preselectedPersonaId,
  initialMode,
}: {
  personas: Persona[];
  preselectedPersonaId?: string;
  initialMode: ConversationMode;
}) {
  const [mode, setMode] = useState<ConversationMode>(initialMode);
  const [selected, setSelected] = useState<string[]>(
    preselectedPersonaId ? [preselectedPersonaId] : []
  );
  const [title, setTitle] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [maxTurns, setMaxTurns] = useState(10);
  const [continuous, setContinuous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (mode === "user_persona") {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
    });
  }

  function moveOrder(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const idx = prev.indexOf(id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.length === 0) {
      setError("Selecione ao menos uma persona.");
      return;
    }
    if (mode === "multi_persona" && selected.length < 2) {
      setError("Selecione ao menos duas personas para o modo multi-persona.");
      return;
    }
    if (mode === "multi_persona" && !initialMessage.trim()) {
      setError("Escreva uma mensagem/tópico inicial para começar a conversa entre personas.");
      return;
    }

    startTransition(async () => {
      try {
        await createConversation({
          mode,
          personaIds: selected,
          title:
            title.trim() ||
            (mode === "multi_persona"
              ? "Conversa entre personas"
              : personas.find((p) => p.id === selected[0])?.name ?? "Nova conversa"),
          initialMessage,
          maxTurns: continuous ? 0 : maxTurns,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar conversa");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("user_persona");
            setSelected((prev) => prev.slice(0, 1));
          }}
          className={`rounded-md px-4 py-2 text-sm font-medium border ${
            mode === "user_persona"
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-black/10 dark:border-white/15"
          }`}
        >
          1:1 com uma persona
        </button>
        <button
          type="button"
          onClick={() => setMode("multi_persona")}
          className={`rounded-md px-4 py-2 text-sm font-medium border ${
            mode === "multi_persona"
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-black/10 dark:border-white/15"
          }`}
        >
          Personas conversando entre si
        </button>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">
          {mode === "user_persona" ? "Escolha a persona" : "Escolha 2 ou mais personas"}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {personas.map((p) => {
            const isSelected = selected.includes(p.id);
            const order = selected.indexOf(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleSelect(p.id)}
                className={`cursor-pointer rounded-lg border px-3 py-2 flex items-center gap-3 ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                    : "border-black/10 dark:border-white/15"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.tone && <p className="text-xs text-zinc-500 truncate">{p.tone}</p>}
                </div>
                {isSelected && mode === "multi_persona" && (
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-zinc-500 w-4 text-center">{order + 1}</span>
                    <button
                      type="button"
                      onClick={() => moveOrder(p.id, -1)}
                      className="h-6 w-6 rounded border border-black/10 dark:border-white/15 text-xs"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOrder(p.id, 1)}
                      className="h-6 w-6 rounded border border-black/10 dark:border-white/15 text-xs"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {mode === "multi_persona" && (
          <p className="text-xs text-zinc-500 mt-1">
            A ordem acima define quem fala primeiro (turn_order).
          </p>
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Título (opcional)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="initialMessage" className="block text-sm font-medium mb-1">
          {mode === "multi_persona" ? "Mensagem/tópico inicial" : "Mensagem inicial (opcional)"}
        </label>
        <textarea
          id="initialMessage"
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
          rows={3}
          placeholder={
            mode === "multi_persona"
              ? 'ex: "Discutam se vale a pena investir em Bitcoin"'
              : undefined
          }
          className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {mode === "multi_persona" && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={continuous}
              onChange={(e) => setContinuous(e.target.checked)}
              className="h-4 w-4 rounded border-black/20 dark:border-white/25"
            />
            Conversa contínua (sem limite de turnos)
          </label>
          <p className="text-xs text-zinc-500">
            As personas seguem se revezando indefinidamente, sempre lendo o histórico
            completo — só param quando você clicar em &ldquo;Pausar&rdquo;.
          </p>

          {!continuous && (
            <div>
              <label htmlFor="maxTurns" className="block text-sm font-medium mb-1">
                Limite de turnos (segurança)
              </label>
              <input
                id="maxTurns"
                type="number"
                min={1}
                max={100}
                value={maxTurns}
                onChange={(e) => setMaxTurns(Number(e.target.value))}
                className="w-32 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Criando..." : "Criar conversa"}
      </button>
    </form>
  );
}
