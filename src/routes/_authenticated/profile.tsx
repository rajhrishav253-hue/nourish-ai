import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My details & goals — NutriTrack" },
      { name: "description", content: "Enter your body details and daily nutrition goals." },
      { property: "og:title", content: "My details & goals — NutriTrack" },
      { property: "og:description", content: "Set your personal info and daily calorie and macro targets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const NUM = ["age", "height_cm", "weight_kg", "target_weight_kg", "calorie_target", "protein_target", "carb_target", "fat_target", "fiber_target", "water_target_ml"] as const;
const TXT = ["name", "restrictions", "likes", "dislikes"] as const;
type Form = Record<string, string>;

const SELECTS = {
  gender: [["male", "Male"], ["female", "Female"], ["other", "Other"]],
  activity_level: [["sedentary", "Sedentary"], ["light", "Light"], ["moderate", "Moderate"], ["active", "Active"], ["very_active", "Very active"]],
  goal: [["lose", "Lose weight"], ["maintain", "Maintain"], ["gain", "Gain weight"], ["muscle", "Build muscle"], ["general", "General health"]],
  diet_pref: [["veg", "Vegetarian"], ["non_veg", "Non-vegetarian"], ["vegan", "Vegan"], ["eggetarian", "Eggetarian"]],
} as const;

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>({});
  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!profile.data) return;
    const d = profile.data as unknown as Record<string, unknown>;
    const next: Form = {};
    for (const k of [...NUM, ...TXT, ...Object.keys(SELECTS)]) next[k] = d[k] == null ? "" : String(d[k]);
    setF(next);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const u: Record<string, unknown> = { onboarded: true };
      for (const k of NUM) u[k] = f[k] === "" ? null : Number(f[k]);
      for (const k of [...TXT, ...Object.keys(SELECTS)]) u[k] = f[k] || null;
      if (!profile.data?.start_weight_kg && u["weight_kg"]) u["start_weight_kg"] = u["weight_kg"];
      const { error } = await supabase.from("profiles").update(u as never).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message, { action: { label: "Retry", onClick: () => save.mutate() } }),
  });

  const field = (k: string, label: string, type = "number") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} step="any" value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
    </div>
  );
  const select = (k: keyof typeof SELECTS, label: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={f[k] ?? ""} onValueChange={(v) => setF({ ...f, [k]: v })}>
        <SelectTrigger aria-label={label}><SelectValue placeholder="Choose" /></SelectTrigger>
        <SelectContent>{SELECTS[k].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <form className="mx-auto max-w-3xl space-y-4 px-4 py-5 md:px-6" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <h1 className="font-display text-2xl font-bold md:text-3xl">My details & goals</h1>
        {profile.isLoading ? <Skeleton className="h-96 w-full" /> : (
          <>
            <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
              <h2 className="font-semibold sm:col-span-2">About you</h2>
              {field("name", "Name", "text")}
              {field("age", "Age")}
              {select("gender", "Gender")}
              {field("height_cm", "Height (cm)")}
              {field("weight_kg", "Current weight (kg)")}
              {field("target_weight_kg", "Target weight (kg)")}
              {select("activity_level", "Activity level")}
              {select("goal", "Goal")}
            </section>
            <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
              <h2 className="font-semibold sm:col-span-2">Daily targets</h2>
              {field("calorie_target", "Calories (kcal)")}
              {field("protein_target", "Protein (g)")}
              {field("carb_target", "Carbs (g)")}
              {field("fat_target", "Fat (g)")}
              {field("fiber_target", "Fiber (g)")}
              {field("water_target_ml", "Water (ml)")}
            </section>
            <section className="grid gap-4 rounded-3xl border bg-card p-5 sm:grid-cols-2">
              <h2 className="font-semibold sm:col-span-2">Food preferences</h2>
              {select("diet_pref", "Diet")}
              {field("restrictions", "Allergies / restrictions", "text")}
              {field("likes", "Foods you like", "text")}
              {field("dislikes", "Foods you dislike", "text")}
            </section>
            <Button type="submit" className="w-full" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
          </>
        )}
      </form>
    </main>
  );
}
