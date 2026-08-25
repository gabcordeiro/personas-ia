"use client";

import { useState, useTransition } from "react";
import { updateAboutMe } from "@/app/(app)/profile/actions";

export default function ProfileForm({ initialAboutMe }: { initialAboutMe: string }) {
  const [aboutMe, setAboutMe] = useState(initialAboutMe);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateAboutMe(aboutMe);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      {saved && !isPending && (
        <p className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Salvo.
        </p>
      )}

      <textarea
        value={aboutMe}
        onChange={(e) => {
          setAboutMe(e.target.value);
          setSaved(false);
        }}
        rows={8}
        placeholder="ex: Meu nome é Gabriel, sou desenvolvedor, moro em..., gosto de..."
        className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
