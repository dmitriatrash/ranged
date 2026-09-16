import { describe, expect, it } from "vitest";
import {
  DEFAULT_DRAFT,
  parseDecimal,
  validateDraft,
  validateField,
  withAdjustmentUnit,
  withDistanceUnit,
  withOffsetUnit,
} from "./draft";

describe("parseDecimal", () => {
  it.each([
    ["100", 100],
    [" 1.5 ", 1.5],
    ["1,5", 1.5],
    [".25", 0.25],
    ["3.", 3],
    ["-2", -2],
    ["0", 0],
  ])("parses %s", (text, value) => {
    expect(parseDecimal(text)).toEqual({ kind: "number", value });
  });

  it.each(["", "   "])("treats %j as empty", (text) => {
    expect(parseDecimal(text)).toEqual({ kind: "empty" });
  });

  it.each(["abc", "12abc", "1e3", "Infinity", "1.2.3", "-", ".", "1,2,3", "0x10"])(
    "rejects %j",
    (text) => {
      expect(parseDecimal(text)).toEqual({ kind: "invalid" });
    },
  );
});

describe("validateField", () => {
  it("distance", () => {
    expect(validateField("distance", "")).toMatch(/Enter your zero distance/);
    expect(validateField("distance", "far")).toMatch(/must be a number/);
    expect(validateField("distance", "-10")).toMatch(/can't be negative/);
    expect(validateField("distance", "0")).toMatch(/greater than 0/);
    expect(validateField("distance", "25")).toBeUndefined();
  });

  it("offsets allow zero but not negatives", () => {
    expect(validateField("verticalOffset", "0")).toBeUndefined();
    expect(validateField("verticalOffset", "")).toMatch(/or 0 if/);
    expect(validateField("verticalOffset", "-1")).toMatch(/Low \/ High/);
    expect(validateField("horizontalOffset", "-1")).toMatch(/Left \/ Right/);
    expect(validateField("horizontalOffset", "x")).toMatch(/must be a number/);
  });

  it("click value", () => {
    expect(validateField("clickValue", "")).toMatch(/Pick a click value/);
    expect(validateField("clickValue", "0")).toMatch(/greater than 0/);
    expect(validateField("clickValue", "-0.1")).toMatch(/can't be negative/);
    expect(validateField("clickValue", "quarter")).toMatch(/must be a number/);
    expect(validateField("clickValue", "0.125")).toBeUndefined();
  });
});

describe("validateDraft", () => {
  it("produces calculator input for a valid draft", () => {
    const v = validateDraft({ ...DEFAULT_DRAFT, verticalOffset: "1,5" });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.input).toMatchObject({ distance: 100, verticalOffset: 1.5, clickValue: 0.25 });
  });

  it("collects every error", () => {
    const v = validateDraft({ ...DEFAULT_DRAFT, distance: "", verticalOffset: "-1", horizontalOffset: "a", clickValue: "0" });
    expect(v.ok).toBe(false);
    expect(Object.keys(v.errors).sort()).toEqual(["clickValue", "distance", "horizontalOffset", "verticalOffset"]);
  });
});

describe("unit switching preserves the physical measurement", () => {
  it("distance yd ↔ m", () => {
    const m = withDistanceUnit(DEFAULT_DRAFT, "m");
    expect(m).toMatchObject({ distance: "91.44", distanceUnit: "m" });
    expect(withDistanceUnit(m, "yd").distance).toBe("100");
    expect(withDistanceUnit({ ...DEFAULT_DRAFT, distance: "36" }, "m").distance).toBe("32.92");
  });

  it("offsets in ↔ cm", () => {
    const cm = withOffsetUnit({ ...DEFAULT_DRAFT, verticalOffset: "1.5", horizontalOffset: "2" }, "cm");
    expect(cm).toMatchObject({ verticalOffset: "3.81", horizontalOffset: "5.08", offsetUnit: "cm" });
    const back = withOffsetUnit(cm, "in");
    expect(back).toMatchObject({ verticalOffset: "1.5", horizontalOffset: "2" });
  });

  it("leaves unparseable text alone", () => {
    expect(withDistanceUnit({ ...DEFAULT_DRAFT, distance: "abc" }, "m").distance).toBe("abc");
    expect(withOffsetUnit({ ...DEFAULT_DRAFT, verticalOffset: "" }, "cm").verticalOffset).toBe("");
  });

  it("is a no-op for the same unit", () => {
    expect(withDistanceUnit(DEFAULT_DRAFT, "yd")).toBe(DEFAULT_DRAFT);
  });

  it("resets the click value when switching MOA/MIL", () => {
    expect(withAdjustmentUnit(DEFAULT_DRAFT, "MIL")).toMatchObject({ adjustmentUnit: "MIL", clickValue: "0.1" });
    expect(withAdjustmentUnit({ ...DEFAULT_DRAFT, adjustmentUnit: "MIL", clickValue: "0.2" }, "MOA").clickValue).toBe("0.25");
  });
});
