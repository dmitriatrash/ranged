import { Button, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import { type FormEvent, useEffect, useState } from "react";
import {
  type ProfileDetails,
  type ProfileDetailsErrors,
  PROFILE_FIELD_MAX_LENGTH,
  validateProfileDetails,
} from "../../core";
import { cx } from "../../components/cx";

export type ProfileDialogMode =
  | { kind: "create" }
  /** Profile loaded into the calculator: update its zero, or save a copy. */
  | { kind: "update"; details: ProfileDetails }
  /** Rename only, from the profile list. */
  | { kind: "edit"; details: ProfileDetails };

export type ProfileDialogAction = "create" | "update" | "edit";

interface ProfileDialogProps {
  isOpen: boolean;
  mode: ProfileDialogMode;
  onOpenChange: (open: boolean) => void;
  onSubmit: (details: ProfileDetails, action: ProfileDialogAction) => void;
}

const EMPTY: ProfileDetails = { firearm: "", optic: "", ammo: "" };

const COPY: Record<ProfileDialogMode["kind"], { title: string; submit: string; description?: string }> = {
  create: { title: "Save profile", submit: "Save profile" },
  update: {
    title: "Update saved zero",
    submit: "Update profile",
    description: "Replace this profile's zero with the current calculator settings, or keep it and save a new one.",
  },
  edit: { title: "Edit profile", submit: "Save changes" },
};

const FIELDS: { key: keyof ProfileDetails; label: string; placeholder: string }[] = [
  { key: "firearm", label: "Firearm", placeholder: 'e.g. AR-15 16"' },
  { key: "optic", label: "Optic", placeholder: "e.g. Vortex Strike Eagle 1-8x" },
  { key: "ammo", label: "Ammunition", placeholder: "e.g. 55gr FMJ" },
];

const buttonBase = "h-9 rounded-md px-4 text-sm font-medium";

export function ProfileDialog({ isOpen, mode, onOpenChange, onSubmit }: ProfileDialogProps) {
  const [values, setValues] = useState<ProfileDetails>(EMPTY);
  const [errors, setErrors] = useState<ProfileDetailsErrors>({});
  const copy = COPY[mode.kind];

  useEffect(() => {
    if (isOpen) {
      setValues(mode.kind === "create" ? EMPTY : mode.details);
      setErrors({});
    }
  }, [isOpen, mode]);

  const submit = (action: ProfileDialogAction) => {
    const found = validateProfileDetails(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`profile-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    onSubmit(values, action);
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(mode.kind);
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} className="bg-black/80">
      <Modal.Container placement="center" className="p-0 sm:p-4">
        <Modal.Dialog
          aria-labelledby="profile-dialog-title"
          className={cx(
            "glass-strong relative grid w-full max-w-none gap-4 rounded-none border-white/10 p-6 text-(--zp-foreground)",
            "sm:max-w-md sm:rounded-lg",
          )}
        >
          <Modal.CloseTrigger
            aria-label="Close"
            className="absolute top-4 right-4 size-6 rounded-sm bg-transparent text-(--zp-foreground) opacity-70 hover:bg-transparent hover:opacity-100"
          />
          <Modal.Header className="flex flex-col space-y-1.5 p-0 text-center sm:text-left">
            <Modal.Heading id="profile-dialog-title" className="text-lg leading-none font-semibold tracking-tight">
              {copy.title}
            </Modal.Heading>
            {copy.description && <p className="pt-1 text-sm text-muted-foreground">{copy.description}</p>}
          </Modal.Header>
          <form id="profile-form" noValidate onSubmit={onFormSubmit} className="contents">
            <Modal.Body className="m-0 space-y-3 overflow-visible p-0 text-base leading-normal text-(--zp-foreground)">
              {FIELDS.map((field) => (
                <TextField
                  key={field.key}
                  value={values[field.key]}
                  onChange={(v) => setValues((current) => ({ ...current, [field.key]: v }))}
                  isInvalid={Boolean(errors[field.key])}
                  isRequired={field.key === "firearm"}
                  validationBehavior="aria"
                  className="flex flex-col gap-0"
                >
                  <Label className="block text-sm leading-6 font-medium text-(--zp-foreground) after:hidden">
                    {field.label}
                    {field.key !== "firearm" && <span className="text-muted-foreground"> (optional)</span>}
                  </Label>
                  <Input
                    id={`profile-${field.key}`}
                    autoFocus={field.key === "firearm"}
                    placeholder={field.placeholder}
                    maxLength={PROFILE_FIELD_MAX_LENGTH + 20}
                    autoComplete="off"
                    enterKeyHint={field.key === "ammo" ? "done" : "next"}
                    className={cx(
                      "mt-1 h-10 w-full rounded-md border border-(--zp-input) bg-white/5 px-3 py-1 text-base shadow-sm sm:h-9 md:text-sm",
                      "placeholder:text-muted-foreground hover:bg-white/5 focus:bg-white/5",
                      "focus:border-(--zp-input) focus:ring-1 focus:ring-primary",
                      "data-[invalid=true]:border-destructive/70 data-[invalid=true]:bg-white/5",
                    )}
                  />
                  <FieldError className="mt-1 h-auto px-0 text-xs text-destructive opacity-100">
                    {errors[field.key]}
                  </FieldError>
                </TextField>
              ))}
            </Modal.Body>
            <Modal.Footer className="m-0 flex flex-col-reverse gap-2 p-0 sm:flex-row sm:justify-end">
              {mode.kind === "update" && (
                <Button
                  type="button"
                  onPress={() => submit("create")}
                  className={cx(buttonBase, "w-full border border-white/10 bg-white/5 text-(--zp-foreground) hover:bg-white/10 sm:w-auto")}
                >
                  Save as new
                </Button>
              )}
              <Button
                type="submit"
                className={cx(buttonBase, "w-full bg-transparent gradient-primary text-primary-foreground shadow hover:opacity-90 sm:w-auto")}
              >
                {copy.submit}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
