import type { OffsetUnit } from "../../core";

const CELL = 22;
const ORIGIN = 26;
const SIZE = 316;
const CENTER = 158;
const RINGS = 6;
const GRID_END = ORIGIN + CELL * 12;

const clamp = (n: number) => Math.max(-RINGS, Math.min(RINGS, n));
const UNIT_NAMES: Record<OffsetUnit, [string, string]> = { in: ["inch", "inches"], cm: ["centimeter", "centimeters"] };

function diamond(ring: number) {
  const r = ring * CELL;
  return `${CENTER},${CENTER - r} ${CENTER + r},${CENTER} ${CENTER},${CENTER + r} ${CENTER - r},${CENTER}`;
}

function describe(vertical: number, horizontal: number, unit: OffsetUnit) {
  const name = (n: number) => `${Math.abs(n)} ${UNIT_NAMES[unit][Math.abs(n) === 1 ? 0 : 1]}`;
  const parts: string[] = [];
  if (vertical !== 0) parts.push(`${name(vertical)} ${vertical > 0 ? "high" : "low"}`);
  if (horizontal !== 0) parts.push(`${name(horizontal)} ${horizontal > 0 ? "right" : "left"}`);
  const where = parts.length ? `Impact ${parts.join(" and ")} of point of aim` : "Impact centered on point of aim";
  const offGrid = Math.abs(vertical) > RINGS || Math.abs(horizontal) > RINGS ? ", beyond the edge of the grid" : "";
  return `Target with a 1-${UNIT_NAMES[unit][0]} grid. ${where}${offGrid}.`;
}

interface ImpactTargetProps {
  /** Signed vertical offset in the selected unit; positive = high. */
  vertical: number;
  /** Signed horizontal offset in the selected unit; positive = right. */
  horizontal: number;
  unit: OffsetUnit;
}

/** Point-of-impact plot on a ±6 unit grid. Labels mark where the impact sits (L/R, U/D). */
export function ImpactTarget({ vertical, horizontal, unit }: ImpactTargetProps) {
  const x = CENTER + clamp(horizontal) * CELL;
  const y = CENTER - clamp(vertical) * CELL;
  const steps = Array.from({ length: RINGS }, (_, i) => i + 1);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-full w-full max-w-[320px]"
      role="img"
      aria-label={describe(vertical, horizontal, unit)}
    >
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.22 0.02 240 / 0.85)" />
          <stop offset="100%" stopColor="oklch(0.16 0.02 250 / 0.7)" />
        </linearGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect
        x={ORIGIN - 4}
        y={ORIGIN - 4}
        width={272}
        height={272}
        rx={6}
        fill="url(#paper)"
        stroke="oklch(1 0 0 / 0.12)"
      />
      <g stroke="oklch(1 0 0 / 0.08)" strokeWidth={1}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={ORIGIN + i * CELL} y1={ORIGIN} x2={ORIGIN + i * CELL} y2={GRID_END} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`h${i}`} x1={ORIGIN} y1={ORIGIN + i * CELL} x2={GRID_END} y2={ORIGIN + i * CELL} />
        ))}
      </g>
      <g
        fill="oklch(1 0 0 / 0.5)"
        fontSize={9}
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
        dominantBaseline="middle"
        aria-hidden="true"
      >
        {steps.map((n) => (
          <text key={`l${n}`} x={CENTER - n * CELL} y={ORIGIN - 12}>{`${n}L`}</text>
        ))}
        {steps.map((n) => (
          <text key={`r${n}`} x={CENTER + n * CELL} y={ORIGIN - 12}>{`${n}R`}</text>
        ))}
        {steps.map((n) => (
          <text key={`u${n}`} x={304} y={CENTER - n * CELL}>{`${n}U`}</text>
        ))}
        {steps.map((n) => (
          <text key={`d${n}`} x={304} y={CENTER + n * CELL}>{`${n}D`}</text>
        ))}
      </g>
      <line x1={CENTER} y1={ORIGIN} x2={CENTER} y2={GRID_END} stroke="var(--zp-primary)" strokeOpacity={0.35} />
      <line x1={ORIGIN} y1={CENTER} x2={GRID_END} y2={CENTER} stroke="var(--zp-primary)" strokeOpacity={0.35} />
      <g fill="none" stroke="var(--zp-primary)" strokeLinejoin="miter">
        <polygon points={diamond(3)} strokeWidth={3} opacity={0.75} />
        <polygon points={diamond(2)} strokeWidth={2.5} opacity={0.85} />
        <polygon points={diamond(1)} strokeWidth={2} />
      </g>
      <circle cx={CENTER} cy={CENTER} r={2.5} fill="oklch(1 0 0 / 0.9)" />
      <g filter="url(#glow)" data-testid="impact-marker" data-x={x} data-y={y}>
        <circle cx={x} cy={y} r={9} fill="var(--zp-primary)" opacity={0.25} />
        <circle cx={x} cy={y} r={5} fill="var(--zp-primary)" />
        <circle cx={x} cy={y} r={5} fill="none" stroke="oklch(1 0 0 / 0.9)" strokeWidth={1} />
      </g>
    </svg>
  );
}
