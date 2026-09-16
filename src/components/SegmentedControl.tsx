import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group. */
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
  /** Stretch to fill the row (e.g. inches/cm) instead of sitting beside an input. */
  full?: boolean;
}

/** Pill-style single choice, built on HeroUI's ToggleButtonGroup (radio semantics + arrow keys). */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  full,
}: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      isDetached
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (next !== undefined) onChange(next as T);
      }}
      className={cx(
        "items-stretch gap-0 rounded-2xl border border-white/10 bg-white/5 p-1",
        full ? "flex w-full" : "inline-flex w-auto shrink-0",
      )}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          id={option.value}
          className={cx(
            "h-auto rounded-xl px-3 py-2 text-sm font-medium",
            "[--toggle-button-bg:transparent] [--toggle-button-bg-hover:transparent] [--toggle-button-bg-pressed:oklch(100%_0_0/0.06)]",
            "[--toggle-button-bg-selected:transparent] [--toggle-button-bg-selected-hover:transparent] [--toggle-button-bg-selected-pressed:transparent]",
            "[--toggle-button-fg:var(--zp-muted-foreground)] [--toggle-button-fg-selected:var(--zp-primary-foreground)]",
            "not-data-[selected=true]:hover:text-(--zp-foreground)",
            "data-[selected=true]:gradient-primary data-[selected=true]:shadow",
            full && "min-h-11 flex-1 sm:min-h-9",
          )}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
