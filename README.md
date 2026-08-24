# Personas IA

App Next.js 15 (App Router, TypeScript) para criar personas de IA e conversar
com elas — individualmente ou em grupo, umas com as outras.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth, Postgres + RLS, Storage) via `@supabase/ssr`
- Modelo de IA plugável via endpoint OpenAI-compatible (Ollama local, OpenAI, ou proxy Anthropic)

## Funcionalidades

1. **Autenticação** — login/cadastro por e-mail e senha (Supabase Auth), sessão
   renovada no middleware, todas as rotas protegidas.
2. **Personas** (`/personas`) — CRUD completo: nome, foto (upload para o bucket
   `persona-avatars`), personalidade (vira o system prompt), tom e cor de identidade.
3. **Chat 1:1** (`/chat/[id]`, `mode = 'user_persona'`) — conversa direta com
   uma persona, histórico completo enviado como contexto a cada mensagem.
4. **Chat multi-persona** (`/chat/[id]`, `mode = 'multi_persona'`) — duas ou
   mais personas conversam entre si em loop controlado pelo cliente
   (`/api/persona-turn`), respeitando `max_turns` como limite de segurança.
   Pode ser pausado a qualquer momento, e você pode entrar na conversa
   digitando uma mensagem.

## Configuração

1. Rode o SQL de schema no seu projeto Supabase (tabelas `personas`,
   `conversations`, `conversation_participants`, `messages`, bucket de storage
   `persona-avatars` com RLS).
2. Copie `.env.local.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

AI_API_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3.2:3b
```

`AI_API_BASE_URL`/`AI_API_KEY`/`AI_MODEL` apontam para qualquer endpoint
compatível com `/chat/completions` no formato OpenAI — funciona com Ollama
local ou com a API da OpenAI/Anthropic (via proxy compatível). Essas
variáveis só são usadas em rotas de API (server-side), nunca expostas ao
client.

3. Instale as dependências e rode o dev server:

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

```
app/
  login/, signup/            → autenticação
  (app)/personas/            → CRUD de personas
  (app)/chat/                → lista, criação e sala de conversas
  api/chat/                  → 1:1 usuário ↔ persona
  api/persona-turn/          → orquestra um turno no modo multi-persona
lib/
  supabase/                  → clients (browser/server) + middleware de sessão
  ai.ts                      → adaptador para o modelo (OpenAI-compatible)
  database.types.ts          → tipos do schema Supabase
```
