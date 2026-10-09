import { describe, expect, it } from "vitest";
import { scaleNutrition } from "./nutrition";

describe("scaleNutrition", () => {
  it("scales per-100g values by grams eaten", () => {
    const r = scaleNutrition({ kcal: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, 150);
    expect(r.kcal).toBe(247.5);
    expect(r.protein).toBe(46.5);
    expect(r.fat).toBe(5.4);
  });
});
