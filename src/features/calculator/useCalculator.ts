import { useCallback, useMemo, useRef, useState } from "react";
import {
  type AdjustmentUnit,
  type CalculatorDraft,
  type DistanceUnit,
  type DraftErrors,
  type DraftField,
  type OffsetUnit,
  DEFAULT_DRAFT,
  DRAFT_FIELDS,
  calculateZero,
  formatInstruction,
  validateDraft,
  withAdjustmentUnit,
  withDistanceUnit,
  withOffsetUnit,
} from "../../core";

type ConversionKind = "distance" | "offset";
interface Conversion {
  before: CalculatorDraft;
  after: CalculatorDraft;
}

const sameConvertedText = (kind: ConversionKind, a: CalculatorDraft, b: CalculatorDraft) =>
  kind === "distance"
    ? a.distance === b.distance && a.distanceUnit === b.distanceUnit
    : a.verticalOffset === b.verticalOffset &&
      a.horizontalOffset === b.horizontalOffset &&
      a.offsetUnit === b.offsetUnit;

export function useCalculator() {
  const [draft, setDraft] = useState<CalculatorDraft>(DEFAULT_DRAFT);
  const commit = (next: CalculatorDraft) => {
    draftRef.current = next;
    setDraft(next);
  };
  const [touched, setTouched] = useState<ReadonlySet<DraftField>>(new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);
  // Remembers the last unit conversion so toggling back restores the exact
  // text the user typed instead of a rounded round-trip value.
  const conversions = useRef<Partial<Record<ConversionKind, Conversion>>>({});

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const result = useMemo(() => (validation.ok ? calculateZero(validation.input) : undefined), [validation]);
  const instruction = result ? formatInstruction(result) : undefined;

  const visibleErrors = useMemo(() => {
    const errors: DraftErrors = {};
    for (const field of DRAFT_FIELDS) {
      if (validation.errors[field] && (showAllErrors || touched.has(field))) {
        errors[field] = validation.errors[field];
      }
    }
    return errors;
  }, [validation, touched, showAllErrors]);

  const setField = useCallback((field: DraftField, value: string) => {
    setDraft((d) => ({ ...d, [field]: value }));
  }, []);

  const markTouched = useCallback((field: DraftField) => {
    setTouched((t) => (t.has(field) ? t : new Set(t).add(field)));
  }, []);

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const convert = useCallback(
    (kind: ConversionKind, apply: (d: CalculatorDraft) => CalculatorDraft) => {
      const current = draftRef.current;
      const next = apply(current);
      if (next === current) return;
      const last = conversions.current[kind];
      const unit = (d: CalculatorDraft) => (kind === "distance" ? d.distanceUnit : d.offsetUnit);
      if (last && sameConvertedText(kind, last.after, current) && unit(next) === unit(last.before)) {
        conversions.current[kind] = undefined;
        commit({ ...next, ...pickText(kind, last.before) });
        return;
      }
      conversions.current[kind] = { before: current, after: next };
      commit(next);
    },
    [],
  );

  const setDistanceUnit = useCallback(
    (unit: DistanceUnit) => convert("distance", (d) => withDistanceUnit(d, unit)),
    [convert],
  );
  const setOffsetUnit = useCallback(
    (unit: OffsetUnit) => convert("offset", (d) => withOffsetUnit(d, unit)),
    [convert],
  );
  const setAdjustmentUnit = useCallback((unit: AdjustmentUnit) => {
    setDraft((d) => withAdjustmentUnit(d, unit));
  }, []);

  const update = useCallback((patch: Partial<CalculatorDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  /** Shows every validation error; returns the first invalid field, if any. */
  const submit = useCallback((): DraftField | undefined => {
    setShowAllErrors(true);
    return DRAFT_FIELDS.find((f) => validation.errors[f]);
  }, [validation]);

  const load = useCallback((next: CalculatorDraft) => {
    conversions.current = {};
    setDraft(next);
    setTouched(new Set());
    setShowAllErrors(false);
  }, []);

  const reset = useCallback(() => load(DEFAULT_DRAFT), [load]);

  return {
    draft,
    validation,
    result,
    instruction,
    errors: visibleErrors,
    hasVisibleErrors: Object.keys(visibleErrors).length > 0,
    setField,
    markTouched,
    setDistanceUnit,
    setOffsetUnit,
    setAdjustmentUnit,
    update,
    submit,
    load,
    reset,
  };
}

function pickText(kind: ConversionKind, d: CalculatorDraft): Partial<CalculatorDraft> {
  return kind === "distance"
    ? { distance: d.distance, distanceUnit: d.distanceUnit }
    : { verticalOffset: d.verticalOffset, horizontalOffset: d.horizontalOffset, offsetUnit: d.offsetUnit };
}

export type CalculatorController = ReturnType<typeof useCalculator>;
