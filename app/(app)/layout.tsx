import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col min-h-full">
      <header className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/personas" className="font-semibold tracking-tight">
            Personas IA
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/personas" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Personas
            </Link>
            <Link href="/chat/new" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Nova conversa
            </Link>
            <Link href="/profile" className="text-zinc-600 dark:text-zinc-300 hover:text-indigo-600">
              Quem eu sou
            </Link>
            {user && (
              <span className="hidden sm:inline text-zinc-400 text-xs">
                {user.email}
              </span>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
