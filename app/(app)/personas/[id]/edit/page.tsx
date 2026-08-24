import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PersonaForm from "@/components/PersonaForm";

export default async function EditPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: persona } = await supabase
    .from("personas")
    .select("*")
    .eq("id", id)
    .single();

  if (!persona) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Editar persona</h1>
      <PersonaForm persona={persona} />
    </div>
  );
}
