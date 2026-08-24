"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createPersona, updatePersona, type PersonaInput } from "@/app/(app)/personas/actions";
import type { Persona } from "@/lib/database.types";

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

export default function PersonaForm({ persona }: { persona?: Persona }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(persona?.name ?? "");
  const [tone, setTone] = useState(persona?.tone ?? "");
  const [personality, setPersonality] = useState(persona?.personality ?? "");
  const [color, setColor] = useState(persona?.color ?? COLORS[0]);
  const [preview, setPreview] = useState<string | null>(persona?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const busy = uploading || isPending;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function uploadAvatarIfNeeded(): Promise<string | null> {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return persona?.avatar_url ?? null;

    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("persona-avatars")
      .upload(path, file, { upsert: true });

    setUploading(false);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("persona-avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const avatarUrl = await uploadAvatarIfNeeded();
      const input: PersonaInput = { name, personality, tone, color, avatarUrl };
      startTransition(async () => {
        try {
          if (persona) {
            await updatePersona(persona.id, input);
          } else {
            await createPersona(input);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Erro ao salvar persona");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl"
            style={{ backgroundColor: color }}
          >
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        )}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="text-sm"
          />
          <p className="text-xs text-zinc-500 mt-1">Foto da persona (opcional)</p>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Nome
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="tone" className="block text-sm font-medium mb-1">
          Tom (opcional)
        </label>
        <input
          id="tone"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder='ex: "sarcástico", "formal", "animado"'
          className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="personality" className="block text-sm font-medium mb-1">
          Personalidade (system prompt)
        </label>
        <textarea
          id="personality"
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          required
          rows={8}
          placeholder="Descreva quem é essa persona, como fala, o que sabe, seus valores..."
          className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <span className="block text-sm font-medium mb-1">Cor de identidade</span>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-offset-2 ring-offset-white dark:ring-offset-zinc-950"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Salvando..." : persona ? "Salvar alterações" : "Criar persona"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/personas")}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
