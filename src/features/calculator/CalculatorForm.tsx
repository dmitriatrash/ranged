import { Button } from "@heroui/react";
import { Crosshair, RotateCcw } from "lucide-react";
import { type RefObject } from "react";
import {
  type DraftField,
  CLICK_PRESETS,
  DISTANCE_PRESETS,
  formatForInput,
  numericValue,
} from "../../core";
import { ChipGroup } from "../../components/ChipGroup";
import { NumberField } from "../../components/NumberField";
import { SectionHeading } from "../../components/SectionHeading";
import { SegmentedControl } from "../../components/SegmentedControl";
import type { CalculatorController } from "./useCalculator";

interface CalculatorFormProps {
  calc: CalculatorController;
  fieldRefs: Record<DraftField, RefObject<HTMLInputElement | null>>;
  onCalculate: () => void;
  onReset: () => void;
}

export function CalculatorForm({ calc, fieldRefs, onCalculate, onReset }: CalculatorFormProps) {
  const { draft, errors } = calc;
  const distance = numericValue(draft.distance);
  const clickValue = numericValue(draft.clickValue);
  const clickPresets = CLICK_PRESETS[draft.adjustmentUnit];

  return (
    <section aria-labelledby="shot-data-heading" className="glass rounded-3xl p-5 sm:p-6">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onCalculate();
        }}
      >
        <SectionHeading id="shot-data-heading">Shot data</SectionHeading>

        <NumberField
          id="distance"
          label="Zero distance"
          value={draft.distance}
          onChange={(v) => calc.setField("distance", v)}
          onBlur={() => calc.markTouched("distance")}
          error={errors.distance}
          inputRef={fieldRefs.distance}
          trailing={
            <SegmentedControl
              label="Distance unit"
              value={draft.distanceUnit}
              onChange={calc.setDistanceUnit}
              options={[
                { value: "yd", label: "yd" },
                { value: "m", label: "m" },
              ]}
            />
          }
        >
          <ChipGroup
            label="Distance presets"
            className="mt-2 pt-1"
            selectedKey={DISTANCE_PRESETS.find((p) => p === distance)?.toString()}
            onSelect={(key) => {
              calc.setField("distance", key);
              calc.markTouched("distance");
            }}
            options={DISTANCE_PRESETS.map((p) => ({ key: String(p), label: `${p} ${draft.distanceUnit}` }))}
          />
        </NumberField>

        <div className="mt-5">
          <NumberField
            id="vertical"
            label="Vertical offset"
            value={draft.verticalOffset}
            onChange={(v) => calc.setField("verticalOffset", v)}
            onBlur={() => calc.markTouched("verticalOffset")}
            error={errors.verticalOffset}
            inputRef={fieldRefs.verticalOffset}
            trailing={
              <SegmentedControl
                label="Impact above or below aim"
                value={draft.verticalImpact}
                onChange={(v) => calc.update({ verticalImpact: v })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "high", label: "High" },
                ]}
              />
            }
          />
        </div>

        <div className="mt-5">
          <NumberField
            id="horizontal"
            label="Horizontal offset"
            value={draft.horizontalOffset}
            onChange={(v) => calc.setField("horizontalOffset", v)}
            onBlur={() => calc.markTouched("horizontalOffset")}
            error={errors.horizontalOffset}
            inputRef={fieldRefs.horizontalOffset}
            trailing={
              <SegmentedControl
                label="Impact left or right of aim"
                value={draft.horizontalImpact}
                onChange={(v) => calc.update({ horizontalImpact: v })}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
              />
            }
          />
        </div>

        <div className="mt-5">
          <p id="offset-unit-label" className="mb-2 block text-sm leading-none font-medium">
            Offset unit
          </p>
          <SegmentedControl
            label="Offset unit"
            full
            value={draft.offsetUnit}
            onChange={calc.setOffsetUnit}
            options={[
              { value: "in", label: "inches" },
              { value: "cm", label: "cm" },
            ]}
          />
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <SectionHeading>Optic</SectionHeading>
          <div className="mb-4">
            <p className="mb-2 block text-sm leading-none font-medium">Adjustment type</p>
            <SegmentedControl
              label="Adjustment type"
              full
              value={draft.adjustmentUnit}
              onChange={calc.setAdjustmentUnit}
              options={[
                { value: "MOA", label: "MOA" },
                { value: "MIL", label: "MIL" },
              ]}
            />
          </div>

          <NumberField
            id="click"
            label={`Click value (${draft.adjustmentUnit})`}
            value={draft.clickValue}
            onChange={(v) => calc.setField("clickValue", v)}
            onBlur={() => calc.markTouched("clickValue")}
            error={errors.clickValue}
            inputRef={fieldRefs.clickValue}
            placeholder="Custom value"
            size="md"
            before={
              <ChipGroup
                label={`Click value presets (${draft.adjustmentUnit})`}
                className="mt-2 mb-3"
                size="md"
                selectedKey={clickPresets.find((p) => p.value === clickValue)?.label}
                onSelect={(key) => {
                  const preset = clickPresets.find((p) => p.label === key);
                  if (preset) calc.setField("clickValue", formatForInput(preset.value, 3));
                }}
                options={clickPresets.map((p) => ({ key: p.label, label: p.label }))}
              />
            }
          />
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            type="submit"
            className="h-12 flex-1 rounded-2xl bg-transparent gradient-primary text-primary-foreground glow-ring hover:opacity-90 data-[hovered=true]:bg-transparent"
          >
            <Crosshair className="mr-1 h-4 w-4" aria-hidden="true" /> Calculate
          </Button>
          <Button
            type="button"
            onPress={onReset}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-(--zp-foreground) hover:bg-white/10 data-[hovered=true]:bg-white/10"
          >
            <RotateCcw className="mr-1 h-4 w-4" aria-hidden="true" /> Reset
          </Button>
        </div>
      </form>
    </section>
  );
}
