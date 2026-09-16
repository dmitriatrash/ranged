import { Button } from "@heroui/react";
import { Crosshair, Pencil, Save, Trash2 } from "lucide-react";
import type { ZeroProfile } from "../../core";
import { StatRow } from "../../components/StatRow";

interface ProfileListProps {
  profiles: readonly ZeroProfile[];
  activeId?: string;
  onOpen: (profile: ZeroProfile) => void;
  onEdit: (profile: ZeroProfile) => void;
  onDelete: (profile: ZeroProfile) => void;
}

const formatDate = (ms: number) => (ms > 0 ? new Date(ms).toLocaleDateString() : "—");

export function ProfileList({ profiles, activeId, onOpen, onEdit, onDelete }: ProfileListProps) {
  if (profiles.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
          <Save className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="font-semibold">No saved profiles yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Save a zero from the Calculator tab to see it here.</p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-label="Saved profiles">
      {profiles.map((p) => {
        const headingId = `profile-${p.id}-name`;
        return (
          <li key={p.id} aria-labelledby={headingId} className="glass relative flex flex-col rounded-3xl p-5">
            <Button
              isIconOnly
              aria-label={`Delete ${p.firearm}`}
              onPress={() => onDelete(p)}
              className="absolute top-3 right-3 grid size-8 min-w-0 place-items-center rounded-full bg-white/5 p-0 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive sm:size-8 max-sm:size-10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <h2 id={headingId} className="truncate pr-10 text-lg font-semibold">
              {p.firearm}
            </h2>
            <p className="text-sm text-muted-foreground">{p.optic || "—"}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <StatRow label="Ammo" value={p.ammo || "—"} />
              <StatRow label="Zero" value={`${p.distance} ${p.distanceUnit}`} />
              <StatRow label="Adj" value={`${p.clickValue} ${p.adjustmentUnit}`} />
              <StatRow label="Saved" value={formatDate(p.updatedAt)} />
            </dl>
            {p.instruction && (
              <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{p.instruction}</p>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                onPress={() => onOpen(p)}
                aria-label={`Open ${p.firearm} in calculator`}
                className="h-10 flex-1 rounded-xl border border-primary/30 bg-primary/10 text-sm text-primary hover:bg-primary/20"
              >
                <Crosshair className="h-4 w-4" aria-hidden="true" />
                {activeId === p.id ? "Open again" : "Open in calculator"}
              </Button>
              <Button
                onPress={() => onEdit(p)}
                aria-label={`Edit ${p.firearm}`}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-(--zp-foreground) hover:bg-white/10"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
