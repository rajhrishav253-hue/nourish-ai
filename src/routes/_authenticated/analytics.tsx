import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, BarChart3, Flame, Target, Scale } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildReport, periodRange, shiftPeriod, type NutritionLog, type Period, type WeighIn } from "@/lib/analytics";
import { todayISO } from "@/lib/nutrition";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [
    { title: "Fitness analytics — NutriTrack" },
    { name: "description", content: "Explore weekly, monthly and yearly nutrition, goal completion and weight trends from your saved records." },
    { property: "og:title", content: "Fitness analytics — NutriTrack" },
    { property: "og:description", content: "Your calories, macros and weight journey across weeks, months and years." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = Route.useRouteContext();
  const [period, setPeriod] = useState<Period>("weekly");
  const [anchor, setAnchor] = useState(todayISO());
  const range = periodRange(period, anchor);
  const data = useQuery({
    queryKey: ["logs", "analytics", user.id, period, range.start],
    queryFn: async () => {
      const logs: NutritionLog[] = [];
      const weights: WeighIn[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("food_logs").select("log_date,kcal,protein,carbs,fat").eq("user_id", user.id).gte("log_date", range.previous).lte("log_date", range.end).order("log_date").order("id").range(from, from + 999);
        if (error) throw error; logs.push(...data); if (data.length < 1000) break;
      }
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("weight_logs").select("log_date,weight_kg").eq("user_id", user.id).lte("log_date", range.end).order("log_date").order("created_at").range(from, from + 999);
        if (error) throw error; weights.push(...data); if (data.length < 1000) break;
      }
      return { logs, weights };
    },
  });
  const profile = useQuery({ queryKey: ["profile", user.id], queryFn: async () => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(); if (error) throw error; return data;
  } });
  const targets = { kcal: profile.data?.calorie_target ?? 2200, protein: profile.data?.protein_target ?? 100 };
  const report = buildReport(period, anchor, data.data?.logs ?? [], data.data?.weights ?? [], targets);
  const previous = buildReport(period, range.previous, data.data?.logs ?? [], data.data?.weights ?? [], targets);
  const comparison = previous.total.kcal > 0 ? Math.round((report.avg.kcal - previous.avg.kcal) / previous.avg.kcal * 100) : null;
  const title = period === "yearly" ? range.start.slice(0, 4) : period === "monthly" ? new Date(`${range.start}T12:00:00`).toLocaleDateString("en", { month: "long", year: "numeric" }) : `${new Date(`${range.start}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(`${range.end}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}`;
  const formatKg = (n: number | null) => n == null ? "—" : `${n} kg`;
  const loading = data.isPending || profile.isPending;
  const error = data.isError || profile.isError;
  return <main className="min-h-screen bg-background pb-16 text-foreground">
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-6"><Link to="/dashboard"><ArrowLeft />Dashboard</Link></Button>
      <header className="grid gap-5 border-b pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0"><p className="mb-2 flex items-center gap-2 text-sm text-primary"><BarChart3 className="h-4 w-4" />NutriTrack</p><h1 className="font-display text-3xl font-bold">Analytics</h1></div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="group" aria-label="Report period">{(["weekly", "monthly", "yearly"] as const).map(p => <Button key={p} size="sm" variant={p === period ? "default" : "ghost"} aria-pressed={p === period} onClick={() => setPeriod(p)} className="capitalize">{p}</Button>)}</div>
      </header>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-5">
        <Button variant="outline" size="icon" aria-label="Previous period" onClick={() => setAnchor(shiftPeriod(period, anchor, -1))}><ChevronLeft /></Button>
        <div className="min-w-0 text-center"><h2 className="text-sm font-semibold sm:text-lg">{title}</h2>{anchor !== todayISO() && <Button variant="link" size="sm" onClick={() => setAnchor(todayISO())}>Back to current</Button>}</div>
        <Button variant="outline" size="icon" aria-label="Next period" disabled={range.end >= todayISO()} onClick={() => setAnchor(shiftPeriod(period, anchor, 1))}><ChevronRight /></Button>
      </div>
      {loading ? <Skeleton className="h-96 w-full" /> : error ? <div className="py-16 text-center"><p className="text-destructive">Couldn't load your reports.</p><Button variant="outline" className="mt-4" onClick={() => { data.refetch(); profile.refetch(); }}>Retry</Button></div> : <>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Average daily calories" value={report.avg.kcal.toLocaleString()} unit="kcal" icon={<Flame className="h-4 w-4 text-kcal" />} detail={`${report.total.kcal.toLocaleString()} kcal total`} />
          <Metric label="Average daily protein" value={String(report.avg.protein)} unit="g" icon={<BarChart3 className="h-4 w-4 text-protein" />} detail={`Carbs ${report.avg.carbs} g · Fat ${report.avg.fat} g`} />
          <Metric label="Weight change" value={report.change == null ? "—" : `${report.change > 0 ? "+" : ""}${report.change}`} unit="kg" icon={<Scale className="h-4 w-4 text-water" />} detail={`${formatKg(report.startWeight)} → ${formatKg(report.currentWeight)}`} />
          <Metric label="Goals achieved" value={`${report.completion}%`} icon={<Target className="h-4 w-4 text-primary" />} detail={`${report.achieved} of ${report.elapsedDays} elapsed days`} />
        </section>
        <div className="my-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"><p>{report.loggedDays} days with food records · {report.elapsedDays} elapsed days</p><p>Daily averages include unlogged elapsed days as zero.</p>{period === "monthly" && <p>{comparison == null ? "No previous month nutrition to compare" : `${comparison > 0 ? "+" : ""}${comparison}% average calories vs previous month`}</p>}</div>
        {report.loggedDays === 0 && <p className="border-y py-4 text-sm text-muted-foreground">No food records in this period.</p>}
        <section className="grid gap-8 border-y py-7 lg:grid-cols-2">
          <ChartSection title={period === "yearly" ? "Monthly average calories" : "Daily calories"}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={report.rows} margin={{ left: -15, right: 10 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><ReferenceLine y={targets.kcal} stroke="var(--muted-foreground)" strokeDasharray="4 4" /><Bar name="Calories (kcal)" dataKey="kcal" fill="var(--kcal)" radius={[4, 4, 0, 0]} maxBarSize={36} /></BarChart></ResponsiveContainer>
          </ChartSection>
          <ChartSection title={period === "yearly" ? "Monthly average macros" : "Daily macros"}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={report.rows} margin={{ left: -15, right: 10 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Bar name="Protein (g)" dataKey="protein" fill="var(--protein)" stackId="macros" /><Bar name="Carbs (g)" dataKey="carbs" fill="var(--carbs)" stackId="macros" /><Bar name="Fat (g)" dataKey="fat" fill="var(--fat)" stackId="macros" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartSection>
        </section>
        <section className="py-7"><ChartSection title={period === "yearly" ? "Monthly average body weight" : "Body weight records"}>
          {report.rows.some(r => r.weight != null) ? <ResponsiveContainer width="100%" height="100%"><LineChart data={report.rows} margin={{ left: -10, right: 15 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" /><YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={axisTick} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} />{profile.data?.target_weight_kg != null && <ReferenceLine y={profile.data.target_weight_kg} stroke="var(--primary)" strokeDasharray="4 4" />}<Line name="Weight (kg)" dataKey="weight" connectNulls type="monotone" stroke="var(--water)" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No weigh-ins in this period.</div>}
        </ChartSection></section>
        <section className="border-t pt-6"><h2 className="mb-4 font-display text-lg font-semibold">{period === "yearly" ? "Monthly summaries" : "Daily breakdown"}</h2><p className="mb-4 text-xs text-muted-foreground">Goals achieved: logged calories at or below {targets.kcal} kcal and protein at or above {targets.protein} g, using your current targets.</p>
          <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-sm"><thead className="border-b text-xs text-muted-foreground"><tr>{[period === "yearly" ? "Month" : "Date", "Calories", "Protein", "Carbs", "Fat", "Weight"].map(h => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y">{report.rows.map(r => <tr key={r.date} className="tabular"><td className="px-3 py-3 font-medium">{period === "yearly" ? r.label : r.date.slice(5)}</td><td className="px-3 py-3">{r.logged ? Math.round(r.kcal).toLocaleString() : "—"}</td><td className="px-3 py-3">{r.logged ? `${Math.round(r.protein)} g` : "—"}</td><td className="px-3 py-3">{r.logged ? `${Math.round(r.carbs)} g` : "—"}</td><td className="px-3 py-3">{r.logged ? `${Math.round(r.fat)} g` : "—"}</td><td className="px-3 py-3 text-water">{formatKg(r.weight)}</td></tr>)}</tbody></table></div>
        </section>
      </>}
    </div>
  </main>;
}
const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)", borderRadius: 8 };
function Metric({ label, value, unit, detail, icon }: { label: string; value: string; unit?: string; detail: string; icon: React.ReactNode }) {
  return <div className="min-w-0 rounded-lg border bg-card p-4 sm:p-5"><div className="mb-3 flex items-center gap-2">{icon}<p className="min-w-0 text-xs text-muted-foreground">{label}</p></div><p className="break-words font-display text-2xl font-semibold tabular">{value}<span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span></p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>;
}
function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-w-0"><h2 className="mb-5 font-display text-base font-semibold">{title}</h2><div className="h-64 w-full min-w-0">{children}</div></div>;
}