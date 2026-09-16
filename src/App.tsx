import { Button, Tabs, Toast, toast } from "@heroui/react";
import { BookOpen, Crosshair, Save, Target } from "lucide-react";
import { type Key, useCallback, useMemo, useRef, useState } from "react";
import {
  type DraftField,
  type ProfileDetails,
  type ProfileRepository,
  type ZeroProfile,
  createProfile,
  draftFromInput,
  numericValue,
  profileToInput,
  updateProfile,
} from "./core";
import { brand } from "./config/brand";
import { cx } from "./components/cx";
import { SafetyNote } from "./components/SafetyNote";
import { SectionHeading } from "./components/SectionHeading";
import { StatRow } from "./components/StatRow";
import { CalculatorForm } from "./features/calculator/CalculatorForm";
import { ImpactTarget } from "./features/calculator/ImpactTarget";
import { ResultsPanel } from "./features/calculator/ResultsPanel";
import { useCalculator } from "./features/calculator/useCalculator";
import { type ProfileDialogAction, type ProfileDialogMode, ProfileDialog } from "./features/profiles/ProfileDialog";
import { ProfileList } from "./features/profiles/ProfileList";
import { useProfiles } from "./features/profiles/useProfiles";
import { ReferencePanel } from "./features/reference/ReferencePanel";

type TabKey = "calc" | "saved" | "ref";

export interface AppProps {
  repository: ProfileRepository;
  newId: () => string;
  now?: () => number;
}

const tabClass = cx(
  "flex h-10 min-w-0 items-center justify-center rounded-xl px-3 py-1 text-sm font-medium text-muted-foreground sm:h-7",
  "data-[selected=true]:gradient-primary data-[selected=true]:text-primary-foreground data-[selected=true]:shadow data-[selected=true]:opacity-100",
);

export function App({ repository, newId, now = Date.now }: AppProps) {
  const calc = useCalculator();
  const { profiles, save, remove } = useProfiles(repository);
  const [tab, setTab] = useState<TabKey>("calc");
  const [activeId, setActiveId] = useState<string>();
  const [dialog, setDialog] = useState<{ open: boolean; mode: ProfileDialogMode; target?: ZeroProfile }>({
    open: false,
    mode: { kind: "create" },
  });
  const [announcement, setAnnouncement] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const fieldRefs: Record<DraftField, React.RefObject<HTMLInputElement | null>> = {
    distance: useRef<HTMLInputElement>(null),
    verticalOffset: useRef<HTMLInputElement>(null),
    horizontalOffset: useRef<HTMLInputElement>(null),
    clickValue: useRef<HTMLInputElement>(null),
  };

  const activeProfile = useMemo(() => profiles.find((p) => p.id === activeId), [profiles, activeId]);
  const { draft, result, instruction, validation } = calc;

  const announce = useCallback((message: string) => {
    // Clear first so repeating the same message is announced again.
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(message));
  }, []);

  const onCalculate = () => {
    const invalid = calc.submit();
    if (invalid) {
      fieldRefs[invalid].current?.focus();
      announce("Some fields need attention.");
      return;
    }
    if (instruction) announce(instruction);
    const el = resultsRef.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const onReset = () => {
    calc.reset();
    setActiveId(undefined);
    toast.success("Reset to defaults");
  };

  const openSaveDialog = () => {
    setDialog({
      open: true,
      mode: activeProfile ? { kind: "update", details: activeProfile } : { kind: "create" },
      target: activeProfile,
    });
  };

  const onDialogSubmit = (details: ProfileDetails, action: ProfileDialogAction) => {
    const target = dialog.target;
    if (action === "edit" && target) {
      void save(updateProfile(target, details, now()));
      toast.success("Profile updated");
    } else if (validation.ok && instruction) {
      const zero = { input: validation.input, instruction };
      if (action === "update" && target) {
        void save(updateProfile(target, details, now(), zero));
        toast.success("Profile updated");
      } else {
        const profile = createProfile(details, zero.input, zero.instruction, { id: newId(), now: now() });
        void save(profile);
        setActiveId(profile.id);
        toast.success("Profile saved");
      }
    }
    setDialog((d) => ({ ...d, open: false }));
  };

  const onOpenProfile = (profile: ZeroProfile) => {
    calc.load(draftFromInput(profileToInput(profile)));
    setActiveId(profile.id);
    setTab("calc");
    window.scrollTo({ top: 0 });
    toast.success(`Loaded ${profile.firearm}`, {
      description: profile.shot ? undefined : "This profile has no saved offsets — enter your latest group.",
    });
  };

  const onDeleteProfile = (profile: ZeroProfile) => {
    void remove(profile.id);
    if (activeId === profile.id) setActiveId(undefined);
    const id = toast(`Deleted ${profile.firearm}`, {
      actionProps: {
        children: "Undo",
        onPress: () => {
          void save(profile);
          toast.close(id);
        },
      },
    });
  };

  const vertical = numericValue(draft.verticalOffset) ?? 0;
  const horizontal = numericValue(draft.horizontalOffset) ?? 0;
  const signedVertical = (draft.verticalImpact === "high" ? 1 : -1) * Math.abs(vertical);
  const signedHorizontal = (draft.horizontalImpact === "right" ? 1 : -1) * Math.abs(horizontal);

  return (
    <div className="min-h-screen pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <Toast.Provider placement="top" />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <header className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl gradient-primary glow-ring" aria-hidden="true">
              <Crosshair className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {brand.nameParts[0]}
                <span className="text-primary text-glow">{brand.nameParts[1]}</span>
              </h1>
              <p className="truncate text-xs text-muted-foreground">{brand.tagline}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <Tabs selectedKey={tab} onSelectionChange={(k: Key) => setTab(k as TabKey)} className="w-full gap-0">
          <Tabs.List
            aria-label="Sections"
            className="glass mb-6 grid w-full min-w-0 grid-cols-3 items-center gap-0 rounded-2xl p-1 sm:h-9"
          >
            <Tabs.Tab id="calc" className={tabClass}>
              <Target className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" /> Calculator
            </Tabs.Tab>
            <Tabs.Tab id="saved" className={tabClass}>
              <Save className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" /> Profiles
            </Tabs.Tab>
            <Tabs.Tab id="ref" className={tabClass}>
              <BookOpen className="mr-1.5 h-4 w-4 shrink-0" aria-hidden="true" /> Reference
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel id="calc" className="mt-0 p-0 data-[orientation=horizontal]:mt-0">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <CalculatorForm calc={calc} fieldRefs={fieldRefs} onCalculate={onCalculate} onReset={onReset} />

              <div className="space-y-6" ref={resultsRef} style={{ scrollMarginTop: 16 }}>
                <ResultsPanel
                  unit={draft.adjustmentUnit}
                  elevation={result?.elevation}
                  windage={result?.windage}
                  instruction={instruction}
                  hasErrors={calc.hasVisibleErrors}
                />

                <section aria-labelledby="impact-heading" className="glass rounded-3xl p-5 sm:p-6">
                  <SectionHeading id="impact-heading">Impact</SectionHeading>
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <ImpactTarget vertical={signedVertical} horizontal={signedHorizontal} unit={draft.offsetUnit} />
                    <dl className="w-full flex-1 space-y-2 text-sm">
                      <StatRow label="Vertical" value={`${Math.abs(vertical)} ${draft.offsetUnit} ${draft.verticalImpact}`} />
                      <StatRow
                        label="Horizontal"
                        value={`${Math.abs(horizontal)} ${draft.offsetUnit} ${draft.horizontalImpact}`}
                      />
                      <StatRow label="Distance" value={`${numericValue(draft.distance) || 0} ${draft.distanceUnit}`} />
                      <StatRow label="Click" value={`${numericValue(draft.clickValue) || 0} ${draft.adjustmentUnit}`} />
                    </dl>
                  </div>
                </section>

                <div>
                  <Button
                    isDisabled={!result}
                    onPress={openSaveDialog}
                    className="h-12 w-full rounded-2xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    {activeProfile ? `Update “${activeProfile.firearm}”` : "Save this zero"}
                  </Button>
                  {activeProfile && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Loaded from saved profiles.{" "}
                      <button
                        type="button"
                        className="focus-ring rounded text-primary underline-offset-2 hover:underline"
                        onClick={() => setActiveId(undefined)}
                      >
                        Save as a new zero instead
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <SafetyNote />
          </Tabs.Panel>

          <Tabs.Panel id="saved" className="mt-0 p-0 data-[orientation=horizontal]:mt-0">
            <ProfileList
              profiles={profiles}
              activeId={activeId}
              onOpen={onOpenProfile}
              onEdit={(p) => setDialog({ open: true, mode: { kind: "edit", details: p }, target: p })}
              onDelete={onDeleteProfile}
            />
            <SafetyNote />
          </Tabs.Panel>

          <Tabs.Panel id="ref" className="mt-0 p-0 data-[orientation=horizontal]:mt-0">
            <ReferencePanel />
            <SafetyNote />
          </Tabs.Panel>
        </Tabs>
      </main>

      <ProfileDialog
        isOpen={dialog.open}
        mode={dialog.mode}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSubmit={onDialogSubmit}
      />
    </div>
  );
}
