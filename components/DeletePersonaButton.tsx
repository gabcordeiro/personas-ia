"use client";

import { useState, useTransition } from "react";
import { deletePersona } from "@/app/(app)/personas/actions";

export default function DeletePersonaButton({
  personaId,
  personaName,
}: {
  personaId: string;
  personaName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-zinc-500">Excluir {personaName}?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deletePersona(personaId))}
          className="rounded-md bg-red-600 hover:bg-red-700 text-white px-2 py-1 disabled:opacity-50"
        >
          {isPending ? "Excluindo..." : "Sim"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-black/10 dark:border-white/15 px-2 py-1"
        >
          Não
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
    >
      Excluir
    </button>
  );
}
