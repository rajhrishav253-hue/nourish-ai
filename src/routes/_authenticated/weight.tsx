import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { todayISO, weightProgress } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/weight")({
  head: () => ({
    meta: [
      { title: "Weight progress — NutriTrack" },
      { name: "description", content: "Log weigh-ins and track your trend toward your target weight." },
      { property: "og:title", content: "Weight progress — NutriTrack" },
      { property: "og:description", content: "Log weigh-ins and see your weight trend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WeightPage,
});

function WeightPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(todayISO());

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const logs = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const { data, error } = await supabase.from("weight_logs").select("id,log_date,weight_kg").order("log_date");
      if (error) throw error;
      return data;
    },
  });
  const [target, setTarget] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const w = Number(kg);
      if (!(w > 20 && w < 400)) throw new Error("Enter a weight between 20 and 400 kg");
      const { error } = await supabase.from("weight_logs").insert({ weight_kg: w, log_date: date });
      if (error) throw error;
      await supabase.from("profiles").update({ weight_kg: w, ...(profile.data?.start_weight_kg ? {} : { start_weight_kg: w }) }).eq("id", user.id);
    },
    onSuccess: () => { setKg(""); qc.invalidateQueries({ queryKey: ["weights"] }); qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Weigh-in saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("weight_logs").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weights"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const saveTarget = useMutation({
    mutationFn: async () => {
      const t = Number(target);
      if (!(t > 20 && t < 400)) throw new Error("Enter a target between 20 and 400 kg");
      const { error } = await supabase.from("profiles").update({ target_weight_kg: t }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { setTarget(""); qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Target updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = (logs.data ?? []).map((l) => ({ date: l.log_date, kg: Number(l.weight_kg) }));
  const current = data.at(-1)?.kg ?? profile.data?.weight_kg ?? null;
  const start = profile.data?.start_weight_kg ?? data[0]?.kg ?? null;
  const goal = profile.data?.target_weight_kg ?? null;
  const pct = start != null && current != null && goal != null ? weightProgress(Number(start), Number(current), Number(goal)) : null;
  const change = start != null && current != null ? Math.round((Number(current) - Number(start)) * 10) / 10 : null;

  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-5 md:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Weight progress</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Card label="Current" value={current != null ? `${Number(current)} kg` : "—"} />
          <Card label="Change" value={change != null ? `${change > 0 ? "+" : ""}${change} kg` : "—"} />
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="font-display text-2xl font-bold">{goal != null ? `${Number(goal)} kg` : "Not set"}</p>
            {pct != null && <><Progress value={pct} className="mt-3" /><p className="mt-1 text-xs text-muted-foreground">{pct}% of the way there</p></>}
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); saveTarget.mutate(); }}>
              <Input type="number" step="0.1" placeholder="New target kg" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target weight" />
              <Button type="submit" variant="outline" disabled={saveTarget.isPending}>Set</Button>
            </form>
          </div>
        </div>

        <section className="rounded-3xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Log a weigh-in</h2>
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
            <Input className="w-36" type="number" step="0.1" inputMode="decimal" placeholder="Weight kg" value={kg} onChange={(e) => setKg(e.target.value)} aria-label="Weight in kg" />
            <Input className="w-44" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
            <Button type="submit" disabled={add.isPending}>{add.isPending ? "Saving…" : "Save"}</Button>
          </form>
        </section>

        <section className="rounded-3xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Trend</h2>
          {logs.isLoading ? <Skeleton className="h-64 w-full" /> : logs.isError ? (
            <div className="text-center"><p className="text-destructive">Couldn't load weigh-ins.</p><Button size="sm" variant="outline" onClick={() => logs.refetch()}>Retry</Button></div>
          ) : data.length < 2 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Log at least two weigh-ins to see your trend.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
                  {goal != null && <ReferenceLine y={Number(goal)} strokeDasharray="6 4" stroke="var(--color-primary)" label={{ value: "Target", fontSize: 12 }} />}
                  <Line type="monotone" dataKey="kg" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {data.length > 0 && (
          <section className="rounded-3xl border bg-card p-5">
            <h2 className="mb-2 font-semibold">History</h2>
            <ul className="divide-y">
              {[...(logs.data ?? [])].reverse().map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{l.log_date}</span>
                  <span className="flex items-center gap-2 font-semibold">{Number(l.weight_kg)} kg
                    <Button variant="ghost" size="icon" aria-label="Delete weigh-in" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-2xl font-bold">{value}</p></div>;
}
