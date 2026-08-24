import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ConversationsPage() {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Conversas</h1>
        <Link
          href="/chat/new"
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2"
        >
          + Nova conversa
        </Link>
      </div>

      {conversations && conversations.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-12 text-center text-zinc-500">
          Nenhuma conversa ainda.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {conversations?.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-3 flex items-center justify-between hover:border-indigo-400"
          >
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-xs text-zinc-500">
                {c.mode === "multi_persona" ? "Multi-persona" : "1:1"} ·{" "}
                {new Date(c.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            {c.is_running && (
              <span className="text-xs rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1">
                em andamento
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
