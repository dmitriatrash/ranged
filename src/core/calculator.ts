import {
  type AdjustmentUnit,
  type DistanceUnit,
  type OffsetUnit,
  distanceToInches,
  offsetToInches,
  subtendedAngle,
} from "./units";

/** Where the group landed relative to the point of aim. */
export type VerticalImpact = "low" | "high";
export type HorizontalImpact = "left" | "right";

/** Which way to turn the turret. */
export type ElevationDirection = "up" | "down" | "none";
export type WindageDirection = "left" | "right" | "none";

export interface ZeroInput {
  distance: number;
  distanceUnit: DistanceUnit;
  /** Magnitude (>= 0); direction comes from `verticalImpact`. */
  verticalOffset: number;
  verticalImpact: VerticalImpact;
  /** Magnitude (>= 0); direction comes from `horizontalImpact`. */
  horizontalOffset: number;
  horizontalImpact: HorizontalImpact;
  offsetUnit: OffsetUnit;
  adjustmentUnit: AdjustmentUnit;
  /** Angular value of one turret click, in `adjustmentUnit`. */
  clickValue: number;
}

export interface AxisCorrection<D extends string> {
  /** Offset magnitude converted to inches. */
  offsetInches: number;
  /** Angular correction in the chosen adjustment unit. */
  correction: number;
  /** Unrounded number of clicks. */
  exactClicks: number;
  /** Clicks rounded to the nearest whole click (halves round up). */
  clicks: number;
  direction: D;
}

export interface ZeroResult {
  adjustmentUnit: AdjustmentUnit;
  elevation: AxisCorrection<ElevationDirection>;
  windage: AxisCorrection<WindageDirection>;
}

/**
 * Rounds a click count to the nearest whole click. The count is first
 * trimmed to 12 significant digits so floating-point noise such as
 * 2.4999999999999996 (from 0.25 / 0.1) is treated as the intended 2.5.
 */
export function roundClicks(exactClicks: number): number {
  return Math.round(Number(Math.abs(exactClicks).toPrecision(12)));
}

function assertInput(input: ZeroInput): void {
  const positive = (n: number) => Number.isFinite(n) && n > 0;
  const nonNegative = (n: number) => Number.isFinite(n) && n >= 0;
  if (!positive(input.distance)) throw new RangeError("distance must be a positive number");
  if (!positive(input.clickValue)) throw new RangeError("clickValue must be a positive number");
  if (!nonNegative(input.verticalOffset)) throw new RangeError("verticalOffset must be >= 0");
  if (!nonNegative(input.horizontalOffset)) throw new RangeError("horizontalOffset must be >= 0");
}

function axis<D extends string>(
  offset: number,
  distanceInches: number,
  input: ZeroInput,
  directionIfNonZero: D,
  none: D,
): AxisCorrection<D> {
  const offsetInches = offsetToInches(offset, input.offsetUnit);
  const correction = subtendedAngle(offsetInches, distanceInches, input.adjustmentUnit);
  const exactClicks = correction / input.clickValue;
  const clicks = roundClicks(exactClicks);
  return {
    offsetInches,
    correction,
    exactClicks,
    clicks,
    direction: clicks === 0 ? none : directionIfNonZero,
  };
}

/** Converts a point-of-impact offset into turret clicks. */
export function calculateZero(input: ZeroInput): ZeroResult {
  assertInput(input);
  const distanceInches = distanceToInches(input.distance, input.distanceUnit);
  return {
    adjustmentUnit: input.adjustmentUnit,
    // Impact low → dial up; impact high → dial down.
    elevation: axis<ElevationDirection>(
      input.verticalOffset,
      distanceInches,
      input,
      input.verticalImpact === "low" ? "up" : "down",
      "none",
    ),
    // Impact left → dial right; impact right → dial left.
    windage: axis<WindageDirection>(
      input.horizontalOffset,
      distanceInches,
      input,
      input.horizontalImpact === "left" ? "right" : "left",
      "none",
    ),
  };
}

export const ON_TARGET_INSTRUCTION = "You're on target. No adjustment needed.";

const plural = (n: number) => `click${n === 1 ? "" : "s"}`;

/** Plain-language instruction, e.g. "Turn elevation 4 clicks up and windage 2 clicks left." */
export function formatInstruction(result: ZeroResult): string {
  const parts: string[] = [];
  const { elevation, windage } = result;
  if (elevation.clicks > 0) parts.push(`elevation ${elevation.clicks} ${plural(elevation.clicks)} ${elevation.direction}`);
  if (windage.clicks > 0) parts.push(`windage ${windage.clicks} ${plural(windage.clicks)} ${windage.direction}`);
  return parts.length === 0 ? ON_TARGET_INSTRUCTION : `Turn ${parts.join(" and ")}.`;
}
