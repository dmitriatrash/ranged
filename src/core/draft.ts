import type { HorizontalImpact, VerticalImpact, ZeroInput } from "./calculator";
import {
  type AdjustmentUnit,
  type DistanceUnit,
  type OffsetUnit,
  convertDistance,
  convertOffset,
} from "./units";

/**
 * The calculator form as the user typed it. Numeric fields stay strings so
 * partially typed values ("1.", "") survive until validation.
 */
export interface CalculatorDraft {
  distance: string;
  distanceUnit: DistanceUnit;
  verticalOffset: string;
  verticalImpact: VerticalImpact;
  horizontalOffset: string;
  horizontalImpact: HorizontalImpact;
  offsetUnit: OffsetUnit;
  adjustmentUnit: AdjustmentUnit;
  clickValue: string;
}

export type DraftField = "distance" | "verticalOffset" | "horizontalOffset" | "clickValue";
export type DraftErrors = Partial<Record<DraftField, string>>;

export const DISTANCE_PRESETS = [15, 25, 36, 50, 100] as const;

export interface ClickPreset {
  label: string;
  value: number;
}

export const CLICK_PRESETS: Record<AdjustmentUnit, readonly ClickPreset[]> = {
  MOA: [
    { label: "1/4 MOA", value: 0.25 },
    { label: "1/2 MOA", value: 0.5 },
    { label: "1 MOA", value: 1 },
  ],
  MIL: [
    { label: "0.1 MIL", value: 0.1 },
    { label: "0.05 MIL", value: 0.05 },
    { label: "0.2 MIL", value: 0.2 },
  ],
};

export const DEFAULT_CLICK_VALUE: Record<AdjustmentUnit, string> = { MOA: "0.25", MIL: "0.1" };

export const DEFAULT_DRAFT: CalculatorDraft = {
  distance: "100",
  distanceUnit: "yd",
  verticalOffset: "0",
  verticalImpact: "low",
  horizontalOffset: "0",
  horizontalImpact: "right",
  offsetUnit: "in",
  adjustmentUnit: "MOA",
  clickValue: DEFAULT_CLICK_VALUE.MOA,
};

export type ParsedNumber =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "number"; value: number };

const DECIMAL = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

/**
 * Strictly parses a user-typed decimal. Accepts "." or "," as the decimal
 * separator; rejects anything else ("12abc", "1e3", "Infinity").
 */
export function parseDecimal(text: string): ParsedNumber {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "empty" };
  if (!DECIMAL.test(trimmed)) return { kind: "invalid" };
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? { kind: "number", value } : { kind: "invalid" };
}

/** Returns the numeric value of a field, or undefined if it is not a valid number. */
export function numericValue(text: string): number | undefined {
  const parsed = parseDecimal(text);
  return parsed.kind === "number" ? parsed.value : undefined;
}

interface FieldRules {
  empty: string;
  invalid: string;
  negative: string;
  zero?: string;
}

const RULES: Record<DraftField, FieldRules> = {
  distance: {
    empty: "Enter your zero distance, for example 100.",
    invalid: "Distance must be a number, for example 100 or 91.4.",
    negative: "Distance can't be negative. Enter how far away the target is.",
    zero: "Distance must be greater than 0.",
  },
  verticalOffset: {
    empty: "Enter how far the group is above or below center, or 0 if it's level.",
    invalid: "Vertical offset must be a number, for example 1.5.",
    negative: "Enter a positive number and use Low / High to set the direction.",
  },
  horizontalOffset: {
    empty: "Enter how far the group is left or right of center, or 0 if it's centered.",
    invalid: "Horizontal offset must be a number, for example 1.5.",
    negative: "Enter a positive number and use Left / Right to set the direction.",
  },
  clickValue: {
    empty: "Pick a click value above or type your turret's value.",
    invalid: "Click value must be a number, for example 0.25.",
    negative: "Click value can't be negative. Check your turret's markings.",
    zero: "Click value must be greater than 0.",
  },
};

export function validateField(field: DraftField, text: string): string | undefined {
  const rules = RULES[field];
  const parsed = parseDecimal(text);
  if (parsed.kind === "empty") return rules.empty;
  if (parsed.kind === "invalid") return rules.invalid;
  if (parsed.value < 0) return rules.negative;
  if (parsed.value === 0 && rules.zero) return rules.zero;
  return undefined;
}

export type DraftValidation =
  | { ok: true; input: ZeroInput; errors: DraftErrors }
  | { ok: false; errors: DraftErrors };

export const DRAFT_FIELDS: readonly DraftField[] = [
  "distance",
  "verticalOffset",
  "horizontalOffset",
  "clickValue",
];

export function validateDraft(draft: CalculatorDraft): DraftValidation {
  const errors: DraftErrors = {};
  for (const field of DRAFT_FIELDS) {
    const message = validateField(field, draft[field]);
    if (message) errors[field] = message;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors,
    input: {
      distance: numericValue(draft.distance)!,
      distanceUnit: draft.distanceUnit,
      verticalOffset: numericValue(draft.verticalOffset)!,
      verticalImpact: draft.verticalImpact,
      horizontalOffset: numericValue(draft.horizontalOffset)!,
      horizontalImpact: draft.horizontalImpact,
      offsetUnit: draft.offsetUnit,
      adjustmentUnit: draft.adjustmentUnit,
      clickValue: numericValue(draft.clickValue)!,
    },
  };
}

/** Formats a number for an input field: fixed max decimals, no trailing zeros. */
export function formatForInput(value: number, maxDecimals = 2): string {
  return String(Number(value.toFixed(maxDecimals)));
}

function convertText(text: string, convert: (n: number) => number): string {
  const value = numericValue(text);
  return value === undefined ? text : formatForInput(convert(value));
}

/**
 * Switches the distance unit while keeping the same physical distance
 * (100 yd → 91.44 m). Unparseable text is left untouched.
 */
export function withDistanceUnit(draft: CalculatorDraft, unit: DistanceUnit): CalculatorDraft {
  if (unit === draft.distanceUnit) return draft;
  return {
    ...draft,
    distanceUnit: unit,
    distance: convertText(draft.distance, (n) => convertDistance(n, draft.distanceUnit, unit)),
  };
}

/** Switches the offset unit while keeping the same physical offsets (1 in → 2.54 cm). */
export function withOffsetUnit(draft: CalculatorDraft, unit: OffsetUnit): CalculatorDraft {
  if (unit === draft.offsetUnit) return draft;
  const convert = (n: number) => convertOffset(n, draft.offsetUnit, unit);
  return {
    ...draft,
    offsetUnit: unit,
    verticalOffset: convertText(draft.verticalOffset, convert),
    horizontalOffset: convertText(draft.horizontalOffset, convert),
  };
}

/**
 * Switches MOA/MIL. Click values are a property of the turret rather than a
 * physical measurement, so the click value resets to that unit's common default.
 */
export function withAdjustmentUnit(draft: CalculatorDraft, unit: AdjustmentUnit): CalculatorDraft {
  if (unit === draft.adjustmentUnit) return draft;
  return { ...draft, adjustmentUnit: unit, clickValue: DEFAULT_CLICK_VALUE[unit] };
}

/** Builds a draft that reproduces a validated input. */
export function draftFromInput(input: ZeroInput): CalculatorDraft {
  return {
    distance: String(input.distance),
    distanceUnit: input.distanceUnit,
    verticalOffset: String(input.verticalOffset),
    verticalImpact: input.verticalImpact,
    horizontalOffset: String(input.horizontalOffset),
    horizontalImpact: input.horizontalImpact,
    offsetUnit: input.offsetUnit,
    adjustmentUnit: input.adjustmentUnit,
    clickValue: String(input.clickValue),
  };
}
