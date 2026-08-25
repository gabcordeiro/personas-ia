import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("owner_id", user!.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Quem eu sou</h1>
      <p className="text-sm text-zinc-500 mb-6 max-w-xl">
        Esse texto é incluído automaticamente em toda conversa, com qualquer persona — assim
        elas já sabem quem você é sem precisar reexplicar toda vez.
      </p>
      <ProfileForm initialAboutMe={profile?.about_me ?? ""} />
    </div>
  );
}
