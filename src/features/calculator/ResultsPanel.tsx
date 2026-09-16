import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Crosshair } from "lucide-react";
import type { AdjustmentUnit, ElevationDirection, WindageDirection } from "../../core";
import { cx } from "../../components/cx";
import { SectionHeading } from "../../components/SectionHeading";

const ICONS = { up: ArrowUp, down: ArrowDown, left: ArrowLeft, right: ArrowRight, none: Crosshair };

interface AxisCardProps {
  label: string;
  clicks: number;
  correction: number;
  direction: ElevationDirection | WindageDirection;
  unit: AdjustmentUnit;
}

function AxisCard({ label, clicks, correction, direction, unit }: AxisCardProps) {
  const Icon = ICONS[direction];
  const none = direction === "none";
  const clickWord = `click${clicks === 1 ? "" : "s"}`;
  const summary = none
    ? `${label}: on target, 0 clicks.`
    : `${label}: ${clicks} ${clickWord} ${direction}, ${correction.toFixed(2)} ${unit}.`;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
          <span
            className={cx(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              none ? "bg-(--zp-muted)/40 text-muted-foreground" : "bg-primary/15 text-primary",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {none ? "On target" : direction.toUpperCase()}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-mono text-4xl font-bold tracking-tight text-glow">{clicks}</span>
          <span className="text-sm text-muted-foreground">{clickWord}</span>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {correction.toFixed(2)} {unit}
        </p>
      </div>
    </div>
  );
}

interface ResultsPanelProps {
  unit: AdjustmentUnit;
  elevation?: { clicks: number; correction: number; direction: ElevationDirection };
  windage?: { clicks: number; correction: number; direction: WindageDirection };
  instruction?: string;
  hasErrors: boolean;
}

export function ResultsPanel({ unit, elevation, windage, instruction, hasErrors }: ResultsPanelProps) {
  const fallback = hasErrors
    ? "Fix the highlighted fields to see your adjustment."
    : "Enter shot data above to see your adjustment.";
  return (
    <section
      aria-labelledby="adjustment-heading"
      className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <SectionHeading id="adjustment-heading">Adjustment</SectionHeading>
      <div className="grid gap-4 sm:grid-cols-2">
        <AxisCard
          label="Elevation"
          clicks={elevation?.clicks ?? 0}
          correction={elevation?.correction ?? 0}
          direction={elevation?.direction ?? "none"}
          unit={unit}
        />
        <AxisCard
          label="Windage"
          clicks={windage?.clicks ?? 0}
          correction={windage?.correction ?? 0}
          direction={windage?.direction ?? "none"}
          unit={unit}
        />
      </div>
      <div className="mt-5 rounded-2xl border border-primary/30 bg-primary/10 p-4">
        <h3 className="text-xs font-semibold tracking-widest text-primary/80 uppercase">What to do next</h3>
        <p className="mt-1 text-base font-medium text-(--zp-foreground)" data-testid="instruction">
          {instruction ?? fallback}
        </p>
      </div>
    </section>
  );
}
