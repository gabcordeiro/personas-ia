import { createClient } from "@/lib/supabase/server";
import NewConversationForm from "@/components/NewConversationForm";

export default async function NewChatPage({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: personas } = await supabase
    .from("personas")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Nova conversa</h1>
      {personas && personas.length === 0 ? (
        <p className="text-zinc-500">
          Crie uma persona primeiro para poder iniciar uma conversa.
        </p>
      ) : (
        <NewConversationForm
          personas={personas ?? []}
          preselectedPersonaId={params.persona}
          initialMode={params.mode === "multi_persona" ? "multi_persona" : "user_persona"}
        />
      )}
    </div>
  );
}
