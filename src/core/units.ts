/**
 * Unit definitions and conversions. Pure functions only — no platform APIs —
 * so this module can be reused in React Native or ported to Swift verbatim.
 */

export type DistanceUnit = "yd" | "m";
export type OffsetUnit = "in" | "cm";
export type AdjustmentUnit = "MOA" | "MIL";

export const INCHES_PER_YARD = 36;
export const CM_PER_INCH = 2.54;
export const METERS_PER_YARD = 0.9144;
export const INCHES_PER_METER = 100 / CM_PER_INCH;

/** Size of one adjustment unit in radians. */
export const RADIANS_PER_UNIT: Record<AdjustmentUnit, number> = {
  MOA: Math.PI / (180 * 60),
  MIL: 0.001,
};

export function distanceToInches(value: number, unit: DistanceUnit): number {
  return unit === "yd" ? value * INCHES_PER_YARD : value * INCHES_PER_METER;
}

export function offsetToInches(value: number, unit: OffsetUnit): number {
  return unit === "in" ? value : value / CM_PER_INCH;
}

export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return from === "yd" ? value * METERS_PER_YARD : value / METERS_PER_YARD;
}

export function convertOffset(value: number, from: OffsetUnit, to: OffsetUnit): number {
  if (from === to) return value;
  return from === "in" ? value * CM_PER_INCH : value / CM_PER_INCH;
}

/**
 * Angle subtended by `offsetInches` at `distanceInches`, expressed in the
 * given adjustment unit. Uses the exact arctangent rather than a
 * small-angle approximation.
 */
export function subtendedAngle(
  offsetInches: number,
  distanceInches: number,
  unit: AdjustmentUnit,
): number {
  return Math.atan(Math.abs(offsetInches) / distanceInches) / RADIANS_PER_UNIT[unit];
}

/** Linear size of one adjustment unit at a distance, in inches. */
export function unitSubtensionInches(distanceInches: number, unit: AdjustmentUnit): number {
  return Math.tan(RADIANS_PER_UNIT[unit]) * distanceInches;
}
