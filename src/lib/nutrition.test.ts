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

import { weightProgress } from "./nutrition";
describe("weightProgress", () => {
  it("loss: 80 -> 75 toward 70 is 50%", () => expect(weightProgress(80, 75, 70)).toBe(50));
  it("gain: 60 -> 63 toward 66 is 50%", () => expect(weightProgress(60, 63, 66)).toBe(50));
  it("moving away clamps to 0", () => expect(weightProgress(80, 82, 70)).toBe(0));
});
