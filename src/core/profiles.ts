import type { HorizontalImpact, VerticalImpact, ZeroInput } from "./calculator";
import type { AdjustmentUnit, DistanceUnit, OffsetUnit } from "./units";

export interface ProfileDetails {
  firearm: string;
  optic: string;
  ammo: string;
}

/** A saved zero. Timestamps are epoch milliseconds. */
export interface ZeroProfile extends ProfileDetails {
  id: string;
  distance: number;
  distanceUnit: DistanceUnit;
  adjustmentUnit: AdjustmentUnit;
  clickValue: number;
  /** Shot data used for the instruction. Absent on profiles saved by the original app. */
  shot?: {
    verticalOffset: number;
    verticalImpact: VerticalImpact;
    horizontalOffset: number;
    horizontalImpact: HorizontalImpact;
    offsetUnit: OffsetUnit;
  };
  instruction?: string;
  createdAt: number;
  updatedAt: number;
}

export const PROFILE_FIELD_MAX_LENGTH = 80;

export type ProfileDetailsErrors = Partial<Record<keyof ProfileDetails, string>>;

export function normalizeDetails(details: ProfileDetails): ProfileDetails {
  return {
    firearm: details.firearm.trim(),
    optic: details.optic.trim(),
    ammo: details.ammo.trim(),
  };
}

export function validateProfileDetails(details: ProfileDetails): ProfileDetailsErrors {
  const errors: ProfileDetailsErrors = {};
  const d = normalizeDetails(details);
  if (!d.firearm) errors.firearm = "Name the firearm so you can find this zero later.";
  for (const key of ["firearm", "optic", "ammo"] as const) {
    if (d[key].length > PROFILE_FIELD_MAX_LENGTH) {
      errors[key] = `Keep this under ${PROFILE_FIELD_MAX_LENGTH} characters.`;
    }
  }
  return errors;
}

function snapshot(input: ZeroInput, instruction: string) {
  return {
    distance: input.distance,
    distanceUnit: input.distanceUnit,
    adjustmentUnit: input.adjustmentUnit,
    clickValue: input.clickValue,
    shot: {
      verticalOffset: input.verticalOffset,
      verticalImpact: input.verticalImpact,
      horizontalOffset: input.horizontalOffset,
      horizontalImpact: input.horizontalImpact,
      offsetUnit: input.offsetUnit,
    },
    instruction,
  };
}

export function createProfile(
  details: ProfileDetails,
  input: ZeroInput,
  instruction: string,
  meta: { id: string; now: number },
): ZeroProfile {
  return {
    id: meta.id,
    ...normalizeDetails(details),
    ...snapshot(input, instruction),
    createdAt: meta.now,
    updatedAt: meta.now,
  };
}

/** Updates names, and optionally replaces the stored zero with new shot data. */
export function updateProfile(
  profile: ZeroProfile,
  details: ProfileDetails,
  now: number,
  zero?: { input: ZeroInput; instruction: string },
): ZeroProfile {
  return {
    ...profile,
    ...normalizeDetails(details),
    ...(zero ? snapshot(zero.input, zero.instruction) : {}),
    updatedAt: now,
  };
}

/** Rebuilds calculator input from a profile (offsets default to 0 for legacy profiles). */
export function profileToInput(profile: ZeroProfile): ZeroInput {
  return {
    distance: profile.distance,
    distanceUnit: profile.distanceUnit,
    adjustmentUnit: profile.adjustmentUnit,
    clickValue: profile.clickValue,
    verticalOffset: profile.shot?.verticalOffset ?? 0,
    verticalImpact: profile.shot?.verticalImpact ?? "low",
    horizontalOffset: profile.shot?.horizontalOffset ?? 0,
    horizontalImpact: profile.shot?.horizontalImpact ?? "right",
    offsetUnit: profile.shot?.offsetUnit ?? "in",
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;

/**
 * Parses an untrusted stored record. Accepts the current shape and the
 * original app's shape (`adjUnit`, `lastInstruction`, `savedAt`).
 * Returns null for records that can't be used.
 */
export function normalizeProfile(raw: unknown): ZeroProfile | null {
  if (!isObj(raw)) return null;
  const id = str(raw.id);
  const firearm = str(raw.firearm).trim();
  const distance = num(raw.distance);
  const clickValue = num(raw.clickValue);
  const distanceUnit = oneOf(raw.distanceUnit, ["yd", "m"] as const);
  const adjustmentUnit = oneOf(raw.adjustmentUnit ?? raw.adjUnit, ["MOA", "MIL"] as const);
  if (!id || !firearm || !distance || distance <= 0 || !clickValue || clickValue <= 0) return null;
  if (!distanceUnit || !adjustmentUnit) return null;

  const createdAt = num(raw.createdAt) ?? num(raw.savedAt) ?? 0;
  let shot: ZeroProfile["shot"];
  if (isObj(raw.shot)) {
    const s = raw.shot;
    const vo = num(s.verticalOffset);
    const ho = num(s.horizontalOffset);
    const vi = oneOf(s.verticalImpact, ["low", "high"] as const);
    const hi = oneOf(s.horizontalImpact, ["left", "right"] as const);
    const ou = oneOf(s.offsetUnit, ["in", "cm"] as const);
    if (vo !== undefined && vo >= 0 && ho !== undefined && ho >= 0 && vi && hi && ou) {
      shot = { verticalOffset: vo, verticalImpact: vi, horizontalOffset: ho, horizontalImpact: hi, offsetUnit: ou };
    }
  }
  const instruction = str(raw.instruction ?? raw.lastInstruction) || undefined;
  return {
    id,
    firearm,
    optic: str(raw.optic).trim(),
    ammo: str(raw.ammo).trim(),
    distance,
    distanceUnit,
    adjustmentUnit,
    clickValue,
    ...(shot ? { shot } : {}),
    ...(instruction ? { instruction } : {}),
    createdAt,
    updatedAt: num(raw.updatedAt) ?? createdAt,
  };
}

/** Newest first, matching the original app's ordering. */
export function sortProfiles(profiles: readonly ZeroProfile[]): ZeroProfile[] {
  return [...profiles].sort((a, b) => b.createdAt - a.createdAt);
}
