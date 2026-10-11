import { describe, expect, it } from "vitest";
import { buildReport, periodRange, shiftPeriod } from "./analytics";
const targets = { kcal: 2200, protein: 100 };
const log = (log_date: string, kcal = 2000, protein = 120) => ({ log_date, kcal, protein, carbs: 200, fat: 60 });
describe("saved fitness reports", () => {
  it("weekly includes all seven days starting Monday", () => {
    const r = buildReport("weekly", "2026-10-07", [log("2026-10-05"), log("2026-10-11")], [], targets, "2026-10-11");
    expect(r.days.map(d => d.date)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]);
    expect(r.total.kcal).toBe(4000); expect(r.avg.kcal).toBe(571.4); expect(r.achieved).toBe(2);
  });
  it("monthly computes total and elapsed-day averages without future days", () => {
    const r = buildReport("monthly", "2026-10-07", [log("2026-10-01"), log("2026-10-07"), log("2026-10-20")], [], targets, "2026-10-07");
    expect(r.total.kcal).toBe(4000); expect(r.elapsedDays).toBe(7); expect(r.avg.protein).toBe(34.3); expect(r.completion).toBe(29);
  });
  it("yearly has Jan–Dec averages and leaves missing weights empty", () => {
    const r = buildReport("yearly", "2026-06-01", [log("2026-01-01", 3100)], [{ log_date: "2026-01-01", weight_kg: 80 }, { log_date: "2026-01-31", weight_kg: 78 }, { log_date: "2026-03-01", weight_kg: 76 }], targets, "2026-12-31");
    expect(r.rows).toHaveLength(12); expect(r.rows[0]?.label).toBe("Jan"); expect(r.rows[11]?.label).toBe("Dec"); expect(r.rows[0]?.kcal).toBe(100); expect(r.rows[0]?.weight).toBe(79); expect(r.rows[1]?.weight).toBeNull(); expect(r.change).toBe(-4);
  });
  it("weight change uses a prior baseline and supports gain", () => {
    const r = buildReport("weekly", "2026-10-07", [], [{ log_date: "2026-10-04", weight_kg: 60 }, { log_date: "2026-10-07", weight_kg: 62 }], targets, "2026-10-11");
    expect(r.change).toBe(2); expect(r.achieved).toBe(0);
  });
  it("only counts logged days within calories with protein met", () => {
    const r = buildReport("weekly", "2026-10-07", [log("2026-10-05", 2300), log("2026-10-06", 2000, 90), log("2026-10-07", 2200, 100)], [], targets, "2026-10-11");
    expect(r.achieved).toBe(1); expect(r.completion).toBe(14);
  });
  it("handles leap February and previous-month navigation", () => {
    expect(periodRange("monthly", "2024-02-29").end).toBe("2024-02-29"); expect(shiftPeriod("monthly", "2026-03-31", -1)).toBe("2026-02-01");
  });
});