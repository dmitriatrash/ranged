import type { ReactNode } from "react";

export function StatRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-(--zp-foreground)">{value}</dd>
    </div>
  );
}
