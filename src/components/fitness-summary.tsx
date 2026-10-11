import { Link } from "@tanstack/react-router";
import { Scale, Target, TrendingDown, TrendingUp, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { weightProgress } from "@/lib/nutrition";

export function FitnessSummary({ current, start, target, goal }: { current: number | null; start: number | null; target: number | null; goal: string | null }) {
  const change = current != null && start != null ? Math.round((current - start) * 10) / 10 : null;
  const pct = current != null && start != null && target != null ? weightProgress(start, current, target) : null;
  const label = ({ lose: "Weight loss", gain: "Weight gain", muscle: "Build muscle", maintain: "Maintain weight", general: "General fitness" } as Record<string, string>)[goal ?? ""] ?? "Fitness goal";
  return <section className="border-y py-6 md:col-span-3">
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="font-display text-lg font-semibold">Your fitness journey</h2><Button variant="ghost" size="sm" asChild><Link to="/weight">Log weight<ArrowUpRight /></Link></Button></div>
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      <div><p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Scale className="h-4 w-4" />Current weight</p><p className="font-display text-2xl font-semibold tabular">{current ?? "—"}<span className="ml-1 text-sm text-muted-foreground">kg</span></p></div>
      <div><p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" />Target weight</p><p className="font-display text-2xl font-semibold tabular">{target ?? "—"}<span className="ml-1 text-sm text-muted-foreground">kg</span></p></div>
      <div><p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">{change != null && change < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}{change != null && change < 0 ? "Total lost" : "Total gained"}</p><p className="font-display text-2xl font-semibold tabular">{change == null ? "—" : Math.abs(change)}<span className="ml-1 text-sm text-muted-foreground">kg</span></p></div>
      <div className="min-w-0"><p className="mb-2 text-sm text-muted-foreground">{label}</p><p className="font-display text-2xl font-semibold">{pct != null ? `${pct}%` : "Not set"}</p>{pct != null ? <Progress value={pct} className="mt-3 h-1.5" /> : <Button asChild variant="link" className="h-auto px-0"><Link to="/profile">Set your goals<ArrowUpRight /></Link></Button>}</div>
    </div>
  </section>;
}