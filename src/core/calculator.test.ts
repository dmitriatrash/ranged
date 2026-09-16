import { describe, expect, it } from "vitest";
import {
  type ZeroInput,
  ON_TARGET_INSTRUCTION,
  calculateZero,
  formatInstruction,
  roundClicks,
} from "./calculator";
import {
  convertDistance,
  convertOffset,
  distanceToInches,
  offsetToInches,
  subtendedAngle,
  unitSubtensionInches,
} from "./units";

const base: ZeroInput = {
  distance: 100,
  distanceUnit: "yd",
  verticalOffset: 0,
  verticalImpact: "low",
  horizontalOffset: 0,
  horizontalImpact: "right",
  offsetUnit: "in",
  adjustmentUnit: "MOA",
  clickValue: 0.25,
};
const calc = (patch: Partial<ZeroInput>) => calculateZero({ ...base, ...patch });

describe("units", () => {
  it("converts distances and offsets", () => {
    expect(distanceToInches(100, "yd")).toBe(3600);
    expect(distanceToInches(1, "m")).toBeCloseTo(39.3700787, 6);
    expect(offsetToInches(2.54, "cm")).toBeCloseTo(1, 12);
    expect(convertDistance(100, "yd", "m")).toBeCloseTo(91.44, 10);
    expect(convertDistance(91.44, "m", "yd")).toBeCloseTo(100, 10);
    expect(convertOffset(1, "in", "cm")).toBeCloseTo(2.54, 12);
    expect(convertOffset(5, "in", "in")).toBe(5);
  });

  it("matches published subtensions", () => {
    expect(unitSubtensionInches(3600, "MOA")).toBeCloseTo(1.047, 3);
    expect(unitSubtensionInches(3600, "MIL")).toBeCloseTo(3.6, 3);
    // 1 MIL = 10 cm at 100 m
    expect(subtendedAngle(offsetToInches(10, "cm"), distanceToInches(100, "m"), "MIL")).toBeCloseTo(1, 5);
    expect(subtendedAngle(1.047, 3600, "MOA")).toBeCloseTo(1, 3);
  });
});

describe("calculateZero — directions", () => {
  const cases = [
    { v: "low", h: "left", elev: "up", wind: "right" },
    { v: "low", h: "right", elev: "up", wind: "left" },
    { v: "high", h: "left", elev: "down", wind: "right" },
    { v: "high", h: "right", elev: "down", wind: "left" },
  ] as const;

  for (const c of cases) {
    it(`impact ${c.v}/${c.h} → dial ${c.elev}/${c.wind}`, () => {
      const r = calc({ verticalOffset: 2, verticalImpact: c.v, horizontalOffset: 2, horizontalImpact: c.h });
      expect(r.elevation.direction).toBe(c.elev);
      expect(r.windage.direction).toBe(c.wind);
      expect(r.elevation.clicks).toBe(8);
      expect(r.windage.clicks).toBe(8);
    });
  }

  it("reports no direction for zero offsets", () => {
    const r = calc({ verticalImpact: "high", horizontalImpact: "left" });
    expect(r.elevation).toMatchObject({ clicks: 0, correction: 0, direction: "none" });
    expect(r.windage).toMatchObject({ clicks: 0, correction: 0, direction: "none" });
    expect(formatInstruction(r)).toBe(ON_TARGET_INSTRUCTION);
  });

  it("reports no direction when an offset rounds to zero clicks", () => {
    const r = calc({ verticalOffset: 0.1, clickValue: 1 });
    expect(r.elevation.correction).toBeGreaterThan(0);
    expect(r.elevation.clicks).toBe(0);
    expect(r.elevation.direction).toBe("none");
  });

  it("handles one axis at a time", () => {
    const r = calc({ horizontalOffset: 1, horizontalImpact: "left" });
    expect(r.elevation.direction).toBe("none");
    expect(r.windage).toMatchObject({ clicks: 4, direction: "right" });
    expect(formatInstruction(r)).toBe("Turn windage 4 clicks right.");
  });
});

describe("calculateZero — MOA", () => {
  it("1 in low at 100 yd with 1/4 MOA clicks", () => {
    const r = calc({ verticalOffset: 1 });
    expect(r.elevation.correction).toBeCloseTo(0.9549, 4);
    expect(r.elevation.exactClicks).toBeCloseTo(3.8197, 4);
    expect(r.elevation.clicks).toBe(4);
  });

  it("matches the original app for 25 yd, 2 in high, 1.5 in left", () => {
    const r = calc({ distance: 25, verticalOffset: 2, verticalImpact: "high", horizontalOffset: 1.5, horizontalImpact: "left" });
    expect(r.elevation.correction.toFixed(2)).toBe("7.64");
    expect(r.windage.correction.toFixed(2)).toBe("5.73");
    expect(r.elevation.clicks).toBe(31);
    expect(r.windage.clicks).toBe(23);
    expect(formatInstruction(r)).toBe("Turn elevation 31 clicks down and windage 23 clicks right.");
  });

  it("scales with distance (2× distance → half the angle)", () => {
    const near = calc({ distance: 50, verticalOffset: 1 });
    const far = calc({ distance: 100, verticalOffset: 1 });
    expect(near.elevation.correction / far.elevation.correction).toBeCloseTo(2, 6);
  });

  it("supports 1/2 and 1 MOA presets", () => {
    expect(calc({ verticalOffset: 3, clickValue: 0.5 }).elevation.clicks).toBe(6); // 2.865 MOA / 0.5 = 5.73
    expect(calc({ verticalOffset: 3, clickValue: 1 }).elevation.clicks).toBe(3); // 2.865
  });

  it("supports custom click values", () => {
    const r = calc({ verticalOffset: 1, clickValue: 0.125 });
    expect(r.elevation.exactClicks).toBeCloseTo(7.639, 3);
    expect(r.elevation.clicks).toBe(8);
  });
});

describe("calculateZero — MIL", () => {
  const mil = { adjustmentUnit: "MIL", clickValue: 0.1 } as const;

  it("10 cm at 100 m is 1 MIL = 10 clicks", () => {
    const r = calc({ ...mil, distance: 100, distanceUnit: "m", offsetUnit: "cm", verticalOffset: 10 });
    expect(r.elevation.correction).toBeCloseTo(1, 5);
    expect(r.elevation.clicks).toBe(10);
  });

  it("3.6 in at 100 yd is 1 MIL", () => {
    const r = calc({ ...mil, verticalOffset: 3.6, horizontalOffset: 3.6, horizontalImpact: "left" });
    expect(r.elevation.correction).toBeCloseTo(1, 5);
    expect(r.windage).toMatchObject({ clicks: 10, direction: "right" });
  });

  it("matches the original app for 25 yd, 2 cm high, 1.5 cm left", () => {
    const r = calc({ ...mil, distance: 25, offsetUnit: "cm", verticalOffset: 2, verticalImpact: "high", horizontalOffset: 1.5, horizontalImpact: "left" });
    expect(r.elevation.correction.toFixed(2)).toBe("0.87");
    expect(r.windage.correction.toFixed(2)).toBe("0.66");
    expect(r.elevation.clicks).toBe(9);
    expect(r.windage.clicks).toBe(7);
  });

  it("supports 0.05 and 0.2 MIL and custom values", () => {
    const shot = { ...mil, distance: 100, distanceUnit: "m", offsetUnit: "cm", verticalOffset: 10 } as const;
    expect(calc({ ...shot, clickValue: 0.05 }).elevation.clicks).toBe(20);
    expect(calc({ ...shot, clickValue: 0.2 }).elevation.clicks).toBe(5);
    expect(calc({ ...shot, clickValue: 0.3 }).elevation.clicks).toBe(3);
  });

  it("gives identical results for equivalent metric and imperial input", () => {
    const imperial = calc({ ...mil, distance: 100, verticalOffset: 2 });
    const metric = calc({ ...mil, distance: 91.44, distanceUnit: "m", offsetUnit: "cm", verticalOffset: 5.08 });
    expect(metric.elevation.correction).toBeCloseTo(imperial.elevation.correction, 10);
  });
});

describe("rounding", () => {
  it("rounds to the nearest click, halves up", () => {
    expect(roundClicks(2.49)).toBe(2);
    expect(roundClicks(2.5)).toBe(3);
    expect(roundClicks(0.49)).toBe(0);
    expect(roundClicks(0.5)).toBe(1);
  });

  it("ignores floating point noise", () => {
    expect(0.35 / 0.1).not.toBe(3.5);
    expect(roundClicks(0.35 / 0.1)).toBe(4);
    expect(roundClicks(2.4999999999999996)).toBe(3);
  });
});

describe("instructions", () => {
  it("uses singular click", () => {
    const r = calc({ verticalOffset: 0.3, horizontalOffset: 0.3, horizontalImpact: "right" });
    expect(formatInstruction(r)).toBe("Turn elevation 1 click up and windage 1 click left.");
  });
});

describe("input guards", () => {
  it.each([
    { distance: 0 },
    { distance: -5 },
    { distance: Number.NaN },
    { clickValue: 0 },
    { clickValue: -0.25 },
    { verticalOffset: -1 },
    { horizontalOffset: Number.POSITIVE_INFINITY },
  ])("rejects %o", (patch) => {
    expect(() => calc(patch)).toThrow(RangeError);
  });
});
