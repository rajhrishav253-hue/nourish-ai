import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Trash2, LogOut, Droplet, MessageCircle, Scale, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MEALS, scaleNutrition, todayISO, type Serving } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — NutriTrack" },
      { name: "description", content: "Your daily calories, macros and food log." },
      { property: "og:title", content: "Today — NutriTrack" },
      { property: "og:description", content: "Your daily calories, macros and food log." },
    ],
  }),
  component: Dashboard,
});

type Food = { id: string; name: string; category: string; kcal: number; protein: number; carbs: number; fat: number; fiber: number; servings: Serving[] };

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const nav = useNavigate();
  const date = todayISO();
  const [logMeal, setLogMeal] = useState<string | null>(null);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const logs = useQuery({
    queryKey: ["logs", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("food_logs").select("*").eq("log_date", date).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const water = useQuery({
    queryKey: ["water", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("water_logs").select("amount_ml").eq("log_date", date);
      if (error) throw error;
      return data.reduce((s, r) => s + r.amount_ml, 0);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logs"] }); toast.success("Removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const addWater = useMutation({
    mutationFn: async (ml: number) => {
      const { error } = await supabase.from("water_logs").insert({ amount_ml: ml, log_date: date });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["water"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    for (const l of logs.data ?? []) for (const k of Object.keys(t) as (keyof typeof t)[]) t[k] += Number(l[k]);
    return t;
  }, [logs.data]);

  const p = profile.data;
  const target = { kcal: p?.calorie_target ?? 2200, protein: p?.protein_target ?? 100, carbs: p?.carb_target ?? 250, fat: p?.fat_target ?? 70, fiber: p?.fiber_target ?? 30 };
  const waterTarget = p?.water_target_ml ?? 2500;
  const remaining = Math.round(target.kcal - totals.kcal);
  const pct = Math.min(100, (totals.kcal / target.kcal) * 100);

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <div>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Hi {p?.name ?? "there"} 👋</h1>
        </div>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm"><Link to="/coach"><MessageCircle className="mr-1 h-4 w-4" /><span className="hidden sm:inline">AI Coach</span></Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/weight"><Scale className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Weight</span></Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/profile"><UserCog className="mr-1 h-4 w-4" /><span className="hidden sm:inline">My goals</span></Link></Button>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }}>
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3 md:px-6">
        <section className="animate-rise rounded-3xl border bg-card p-6 md:col-span-2">
          {logs.isError ? (
            <ErrorBox onRetry={() => logs.refetch()} />
          ) : logs.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Ring pct={pct} label={remaining >= 0 ? `${remaining}` : `+${-remaining}`} sub={remaining >= 0 ? "kcal left" : "kcal over"} />
              <div className="grid w-full flex-1 gap-4">
                <Stat label="Eaten" value={`${Math.round(totals.kcal)} / ${target.kcal} kcal`} />
                <Macro name="Protein" v={totals.protein} t={target.protein} color="bg-protein" />
                <Macro name="Carbs" v={totals.carbs} t={target.carbs} color="bg-carbs" />
                <Macro name="Fat" v={totals.fat} t={target.fat} color="bg-fat" />
                <Macro name="Fiber" v={totals.fiber} t={target.fiber} color="bg-fiber" />
              </div>
            </div>
          )}
        </section>

        <section className="animate-rise rounded-3xl border bg-card p-6">
          <div className="flex items-center gap-2 text-water"><Droplet className="h-5 w-5" /><h2 className="font-semibold text-foreground">Water</h2></div>
          <p className="mt-3 font-display text-3xl font-bold">{((water.data ?? 0) / 1000).toFixed(2)} L</p>
          <p className="text-sm text-muted-foreground">of {(waterTarget / 1000).toFixed(1)} L goal</p>
          <Progress value={Math.min(100, ((water.data ?? 0) / waterTarget) * 100)} className="mt-4" />
          <div className="mt-4 flex gap-2">
            {[250, 500].map((ml) => (
              <Button key={ml} variant="outline" size="sm" disabled={addWater.isPending} onClick={() => addWater.mutate(ml)}>+{ml} ml</Button>
            ))}
          </div>
        </section>

        <section className="space-y-4 md:col-span-3">
          {MEALS.map((m) => {
            const items = (logs.data ?? []).filter((l) => l.meal_type === m.id);
            if (m.id === "other" && items.length === 0) return null;
            const kcal = items.reduce((s, l) => s + Number(l.kcal), 0);
            return (
              <div key={m.id} className="rounded-3xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{m.label}</h3>
                    <p className="text-sm text-muted-foreground">{Math.round(kcal)} kcal</p>
                  </div>
                  <Button size="sm" onClick={() => setLogMeal(m.id)}><Plus className="mr-1 h-4 w-4" />Add food</Button>
                </div>
                {items.length > 0 && (
                  <ul className="mt-3 divide-y">
                    {items.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{l.food_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Number(l.quantity)} {l.unit} · {Math.round(Number(l.grams))} g · P {Number(l.protein)} · C {Number(l.carbs)} · F {Number(l.fat)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{Math.round(Number(l.kcal))}</span>
                          <Button variant="ghost" size="icon" aria-label={`Remove ${l.food_name}`} onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      </div>

      <Button className="fixed bottom-6 right-6 h-14 rounded-full px-6 shadow-lg md:hidden" onClick={() => setLogMeal("snacks")}>
        <Plus className="mr-1 h-5 w-5" />Log food
      </Button>

      <LogFoodDialog meal={logMeal} date={date} onClose={() => setLogMeal(null)} />
    </main>
  );
}

function LogFoodDialog({ meal, date, onClose }: { meal: string | null; date: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [food, setFood] = useState<Food | null>(null);
  const [unit, setUnit] = useState("g");
  const [qty, setQty] = useState("100");
  const [mealType, setMealType] = useState(meal ?? "snacks");

  const results = useQuery({
    queryKey: ["foods", q],
    enabled: !!meal,
    queryFn: async () => {
      let query = supabase.from("foods").select("id,name,category,kcal,protein,carbs,fat,fiber,servings").order("name").limit(30);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Food[];
    },
  });

  const units: Serving[] = food ? [{ label: "grams", unit: "g", grams: 1 }, ...(food.servings ?? [])] : [];
  const sel = units.find((u) => u.unit === unit) ?? units[0];
  const grams = sel ? (Number(qty) || 0) * sel.grams : 0;
  const n = food ? scaleNutrition(food, grams) : null;

  const save = useMutation({
    mutationFn: async () => {
      if (!food || !sel || grams <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("food_logs").insert({
        food_id: food.id, food_name: food.name, quantity: Number(qty), unit: sel.unit, grams, log_date: date, meal_type: mealType, ...n!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logs"] });
      toast.success(`${food?.name} logged`);
      close();
    },
    onError: (e: Error) => toast.error(e.message, { action: { label: "Retry", onClick: () => save.mutate() } }),
  });

  function close() { setFood(null); setQ(""); setQty("100"); setUnit("g"); onClose(); }

  return (
    <Dialog open={!!meal} onOpenChange={(o) => { if (!o) close(); else if (meal) setMealType(meal); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" onOpenAutoFocus={() => meal && setMealType(meal)}>
        <DialogHeader><DialogTitle>{food ? food.name : "Search foods"}</DialogTitle></DialogHeader>
        {!food ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input autoFocus placeholder="e.g. rice, egg, paneer" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {results.isLoading && <Skeleton className="h-24 w-full" />}
              {results.isError && <ErrorBox onRetry={() => results.refetch()} />}
              {results.data?.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No foods found.</p>}
              {results.data?.map((f) => (
                <button key={f.id} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-muted"
                  onClick={() => { setFood(f); const s = f.servings?.[0]; setUnit(s ? s.unit : "g"); setQty(s ? "1" : "100"); }}>
                  <div><p className="font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{f.category}</p></div>
                  <span className="text-sm text-muted-foreground">{Number(f.kcal)} kcal/100g</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" inputMode="decimal" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity" />
              <Select value={sel?.unit ?? "g"} onValueChange={setUnit}>
                <SelectTrigger aria-label="Unit"><SelectValue /></SelectTrigger>
                <SelectContent>{units.map((u) => <SelectItem key={u.unit} value={u.unit}>{u.unit === "g" ? "grams" : `${u.label} (${u.grams} g)`}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger aria-label="Meal"><SelectValue /></SelectTrigger>
              <SelectContent>{MEALS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-5 gap-2 rounded-2xl bg-muted p-3 text-center text-xs">
              {(["kcal", "protein", "carbs", "fat", "fiber"] as const).map((k) => (
                <div key={k}><p className="font-display text-base font-bold">{n?.[k]}</p><p className="capitalize text-muted-foreground">{k === "kcal" ? "kcal" : `${k} g`}</p></div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">{Math.round(grams)} g total</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setFood(null)}>Back</Button>
              <Button className="flex-1" disabled={save.isPending || grams <= 0} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : "Log food"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Ring({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 70, c = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} strokeWidth="14" className="fill-none stroke-muted" />
        <circle cx="80" cy="80" r={r} strokeWidth="14" strokeLinecap="round" className="fill-none stroke-kcal transition-all duration-700" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold">{label}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function Macro({ name, v, t, color }: { name: string; v: number; t: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-muted-foreground">{Math.round(v)} / {t} g</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(100, (v / t) * 100)}%` }} /></div>
    </div>
  );
}

function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-6 text-center text-sm">
      <p className="text-destructive">Couldn't load your data.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>Retry</Button>
    </div>
  );
}
