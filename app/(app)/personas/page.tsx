import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DeletePersonaButton from "@/components/DeletePersonaButton";

export default async function PersonasPage() {
  const supabase = await createClient();
  const { data: personas, error } = await supabase
    .from("personas")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suas personas</h1>
          <p className="text-sm text-zinc-500">
            Crie personalidades de IA para conversar sozinho ou entre si.
          </p>
        </div>
        <Link
          href="/personas/new"
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2"
        >
          + Nova persona
        </Link>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error.message}
        </p>
      )}

      {personas && personas.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-zinc-500">
          Você ainda não criou nenhuma persona.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personas?.map((persona) => (
          <div
            key={persona.id}
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-4 flex flex-col gap-3"
            style={{ borderTopColor: persona.color, borderTopWidth: 3 }}
          >
            <div className="flex items-center gap-3">
              {persona.avatar_url ? (
                <Image
                  src={persona.avatar_url}
                  alt={persona.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: persona.color }}
                >
                  {persona.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="font-medium">{persona.name}</h2>
                {persona.tone && (
                  <span className="text-xs text-zinc-500">{persona.tone}</span>
                )}
              </div>
            </div>
            <p className="text-sm text-zinc-500 line-clamp-3">{persona.personality}</p>
            <div className="mt-auto flex items-center gap-2 pt-2 text-sm">
              <Link
                href={`/personas/${persona.id}/edit`}
                className="rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Editar
              </Link>
              <DeletePersonaButton personaId={persona.id} personaName={persona.name} />
              <Link
                href={`/chat/new?persona=${persona.id}`}
                className="ml-auto rounded-md bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5"
              >
                Conversar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
