import { todayISO } from "./nutrition";

export type Period = "weekly" | "monthly" | "yearly";
export type NutritionLog = { log_date: string; kcal: number; protein: number; carbs: number; fat: number };
export type WeighIn = { log_date: string; weight_kg: number };
export type ReportDay = { date: string; label: string; kcal: number; protein: number; carbs: number; fat: number; weight: number | null; logged: boolean };
export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const localDate = (s: string) => new Date(`${s}T12:00:00`);
export function periodRange(period: Period, anchor: string) {
  const start = localDate(anchor);
  if (period === "weekly") start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  else if (period === "monthly") start.setDate(1);
  else start.setMonth(0, 1);
  const end = new Date(start);
  if (period === "weekly") end.setDate(end.getDate() + 6);
  else if (period === "monthly") end.setMonth(end.getMonth() + 1, 0);
  else end.setMonth(11, 31);
  const previous = new Date(start);
  if (period === "weekly") previous.setDate(previous.getDate() - 7);
  else if (period === "monthly") previous.setMonth(previous.getMonth() - 1);
  else previous.setFullYear(previous.getFullYear() - 1);
  return { start: isoDate(start), end: isoDate(end), previous: isoDate(previous) };
}
export function shiftPeriod(period: Period, anchor: string, direction: number) {
  const d = localDate(periodRange(period, anchor).start);
  if (period === "weekly") d.setDate(d.getDate() + direction * 7);
  else if (period === "monthly") d.setMonth(d.getMonth() + direction);
  else d.setFullYear(d.getFullYear() + direction);
  return isoDate(d);
}
const round = (n: number) => Math.round(n * 10) / 10;
export function buildReport(period: Period, anchor: string, logs: NutritionLog[], weights: WeighIn[], targets: { kcal: number; protein: number }, today = todayISO()) {
  const range = periodRange(period, anchor);
  const days: ReportDay[] = [];
  for (const d = localDate(range.start); isoDate(d) <= range.end; d.setDate(d.getDate() + 1)) {
    const date = isoDate(d);
    days.push({ date, label: period === "weekly" ? d.toLocaleDateString("en", { weekday: "short" }) : String(d.getDate()), kcal: 0, protein: 0, carbs: 0, fat: 0, weight: null, logged: false });
  }
  const byDate = new Map(days.map(d => [d.date, d]));
  for (const l of logs) {
    const d = byDate.get(l.log_date);
    if (!d || l.log_date > today) continue;
    d.logged = true;
    for (const k of ["kcal", "protein", "carbs", "fat"] as const) d[k] += Number(l[k]);
  }
  const sortedWeights = [...weights].filter(w => w.log_date <= today).sort((a, b) => a.log_date.localeCompare(b.log_date));
  const grouped = new Map<string, number[]>();
  for (const w of sortedWeights) {
    const entries = grouped.get(w.log_date) ?? [];
    entries.push(Number(w.weight_kg)); grouped.set(w.log_date, entries);
  }
  for (const [date, entries] of grouped) { const d = byDate.get(date); if (d) d.weight = round(entries.reduce((a, b) => a + b, 0) / entries.length); }
  const elapsed = days.filter(d => d.date <= today);
  const total = elapsed.reduce((s, d) => ({ kcal: s.kcal + d.kcal, protein: s.protein + d.protein, carbs: s.carbs + d.carbs, fat: s.fat + d.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  const avg = { kcal: round(total.kcal / (elapsed.length || 1)), protein: round(total.protein / (elapsed.length || 1)), carbs: round(total.carbs / (elapsed.length || 1)), fat: round(total.fat / (elapsed.length || 1)) };
  const achieved = elapsed.filter(d => d.logged && targets.kcal > 0 && targets.protein > 0 && d.kcal <= targets.kcal && d.protein >= targets.protein).length;
  const inPeriod = sortedWeights.filter(w => w.log_date >= range.start && w.log_date <= range.end);
  const baseline = sortedWeights.filter(w => w.log_date < range.start).at(-1) ?? inPeriod[0];
  const latest = inPeriod.at(-1);
  const startWeight = baseline ? Number(baseline.weight_kg) : null;
  const currentWeight = latest ? Number(latest.weight_kg) : null;
  const change = startWeight != null && currentWeight != null && (baseline !== latest) ? round(currentWeight - startWeight) : null;
  const rows = period !== "yearly" ? days : Array.from({ length: 12 }, (_, i) => {
    const month = `${range.start.slice(0, 4)}-${String(i + 1).padStart(2, "0")}`;
    const ds = elapsed.filter(d => d.date.startsWith(month));
    const ws = ds.filter(d => d.weight != null);
    const sum = (key: "kcal" | "protein" | "carbs" | "fat") => ds.reduce((s, d) => s + d[key], 0);
    return { date: `${month}-01`, label: new Date(2020, i, 1).toLocaleDateString("en", { month: "short" }), kcal: round(sum("kcal") / (ds.length || 1)), protein: round(sum("protein") / (ds.length || 1)), carbs: round(sum("carbs") / (ds.length || 1)), fat: round(sum("fat") / (ds.length || 1)), weight: ws.length ? round(ws.reduce((s, d) => s + (d.weight ?? 0), 0) / ws.length) : null, logged: ds.some(d => d.logged) };
  });
  return { ...range, days, rows, total, avg, elapsedDays: elapsed.length, loggedDays: elapsed.filter(d => d.logged).length, achieved, completion: Math.round(achieved / (elapsed.length || 1) * 100), startWeight, currentWeight, change };
}