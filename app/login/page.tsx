import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirectTo?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-sm rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-zinc-500 text-center">
          Acesse suas personas de IA
        </p>

        {params.message && (
          <p className="mt-4 rounded-md bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {params.message}
          </p>
        )}
        {params.error && (
          <p className="mt-4 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {params.error}
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/personas"} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 text-sm transition-colors"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
