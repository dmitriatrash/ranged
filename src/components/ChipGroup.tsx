import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface ChipOption {
  key: string;
  label: ReactNode;
  /** Optional longer accessible name. */
  ariaLabel?: string;
}

interface ChipGroupProps {
  label: string;
  options: readonly ChipOption[];
  /** Key of the chip matching the current value, if any. */
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  size?: "sm" | "md";
  className?: string;
}

/** Row of preset chips (distance presets, click values). */
export function ChipGroup({ label, options, selectedKey, onSelect, size = "sm", className }: ChipGroupProps) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      isDetached
      selectedKeys={selectedKey ? [selectedKey] : []}
      onSelectionChange={() => {}}
      className={cx("flex w-full flex-wrap justify-start gap-2", className)}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.key}
          id={option.key}
          aria-label={option.ariaLabel}
          onPress={() => onSelect(option.key)}
          className={cx(
            "h-auto rounded-xl border px-3 text-sm font-medium transition",
            size === "sm" ? "min-h-10 py-1.5 sm:min-h-0" : "min-h-10 py-2 sm:min-h-0",
            "[--toggle-button-bg:oklch(100%_0_0/0.05)] [--toggle-button-bg-hover:oklch(100%_0_0/0.1)] [--toggle-button-bg-pressed:oklch(100%_0_0/0.1)]",
            "[--toggle-button-fg:color-mix(in_oklab,var(--zp-foreground)_80%,transparent)]",
            "[--toggle-button-bg-selected:color-mix(in_oklab,var(--zp-primary)_15%,transparent)]",
            "[--toggle-button-bg-selected-hover:color-mix(in_oklab,var(--zp-primary)_15%,transparent)]",
            "[--toggle-button-bg-selected-pressed:color-mix(in_oklab,var(--zp-primary)_20%,transparent)]",
            "[--toggle-button-fg-selected:var(--zp-primary)]",
            "border-white/10 data-[selected=true]:border-primary/60 data-[selected=true]:glow-ring",
          )}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
