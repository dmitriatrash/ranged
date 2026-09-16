import type { ReactNode } from "react";

export function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-4 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </h2>
  );
}
