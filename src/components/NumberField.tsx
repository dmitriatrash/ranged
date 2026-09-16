import { FieldError, Input, Label, TextField } from "@heroui/react";
import type { ReactNode, Ref } from "react";
import { cx } from "./cx";

interface NumberFieldProps {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Control rendered beside the input (unit or direction toggle). */
  trailing?: ReactNode;
  /** Content between the input row and the error (e.g. preset chips). */
  children?: ReactNode;
  /** Content between the label and the input row. */
  before?: ReactNode;
  placeholder?: string;
  size?: "lg" | "md";
  inputRef?: Ref<HTMLInputElement>;
  hideLabel?: boolean;
}

/** Decimal text input with the numeric mobile keypad and inline validation. */
export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  trailing,
  children,
  before,
  placeholder,
  size = "lg",
  inputRef,
  hideLabel,
}: NumberFieldProps) {
  return (
    <TextField
      id={`${id}-field`}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      className="flex w-full flex-col gap-0"
    >
      <Label className={cx("block text-sm leading-6 font-medium text-(--zp-foreground)", hideLabel && "sr-only")}>
        {label}
      </Label>
      {before}
      <div className="flex gap-2">
        <Input
          id={id}
          ref={inputRef}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          className={cx(
            "w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-1 font-mono text-(--zp-foreground) shadow-sm",
            "placeholder:text-muted-foreground",
            "hover:bg-white/5 data-[hovered=true]:bg-white/5 focus:bg-white/5",
            "focus:border-white/10 focus:ring-1 focus:ring-primary",
            "data-[invalid=true]:border-destructive/70 data-[invalid=true]:bg-white/5",
            size === "lg" ? "h-14 text-lg md:text-sm" : "h-12 text-base md:text-sm",
          )}
        />
        {trailing}
      </div>
      {children}
      <FieldError className="mt-2 h-auto px-0 text-xs text-destructive opacity-100">{error}</FieldError>
    </TextField>
  );
}
