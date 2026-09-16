import type { ReactNode } from "react";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="mb-2 text-sm font-semibold tracking-widest text-primary uppercase">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-(--zp-foreground)/90">{children}</div>
    </section>
  );
}

export function ReferencePanel() {
  return (
    <article className="glass mx-auto max-w-3xl rounded-3xl p-6 sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight">MOA &amp; MIL — the basics</h2>
      <p className="mt-2 text-muted-foreground">
        A quick primer on the two units rifle optics use to adjust point of impact.
      </p>
      <Block title="Minute of Angle (MOA)">
        <p>
          1 MOA ≈ <strong className="text-(--zp-foreground)">1.047 inches</strong> at 100 yards. Most hunting scopes
          adjust in <strong>1/4 MOA</strong> per click — four clicks moves your point of impact about one inch at 100
          yards.
        </p>
      </Block>
      <Block title="Milliradian (MIL)">
        <p>
          1 MIL = <strong className="text-(--zp-foreground)">3.6 inches</strong> at 100 yards (10 cm at 100 m). Most
          precision scopes adjust in <strong>0.1 MIL</strong> per click — ten clicks moves point of impact 3.6 inches
          at 100 yards.
        </p>
      </Block>
      <Block title="How clicks scale with distance">
        <p>
          The further the target, the more inches each click moves your impact. At 200 yards, one 1/4 MOA click moves
          the bullet about 0.52", not 0.26". This calculator handles the math for you — just enter your true zero
          distance.
        </p>
      </Block>
      <Block title="Direction rules">
        <ul className="list-inside list-disc space-y-1">
          <li>
            Impact <strong>low</strong> → turn elevation <strong>up</strong>
          </li>
          <li>
            Impact <strong>high</strong> → turn elevation <strong>down</strong>
          </li>
          <li>
            Impact <strong>left</strong> → turn windage <strong>right</strong>
          </li>
          <li>
            Impact <strong>right</strong> → turn windage <strong>left</strong>
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Always confirm against your optic's manual — a few scopes label turrets differently.
        </p>
      </Block>
    </article>
  );
}
