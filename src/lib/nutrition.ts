export type Serving = { label: string; unit: string; grams: number };

/** Nutrition for a food given per-100g values and grams eaten. */
export function scaleNutrition(
  per100: { kcal: number; protein: number; carbs: number; fat: number; fiber: number },
  grams: number,
) {
  const f = grams / 100;
  const r = (n: number) => Math.round(n * f * 10) / 10;
  return { kcal: r(per100.kcal), protein: r(per100.protein), carbs: r(per100.carbs), fat: r(per100.fat), fiber: r(per100.fiber) };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const MEALS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "snacks", label: "Snacks" },
  { id: "dinner", label: "Dinner" },
  { id: "other", label: "Other" },
] as const;
