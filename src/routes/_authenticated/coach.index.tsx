import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/coach/")({
  beforeLoad: async () => {
    const { data: latest } = await supabase.from("chat_threads").select("id").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    let id = latest?.id;
    if (!id) {
      const { data, error } = await supabase.from("chat_threads").insert({}).select("id").single();
      if (error) throw error;
      id = data.id;
    }
    throw redirect({ to: "/coach/$threadId", params: { threadId: id } });
  },
});
