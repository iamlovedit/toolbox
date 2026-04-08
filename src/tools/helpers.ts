import type { StatusTone } from "@/types";

export function getStatusClassName(tone: StatusTone): string {
  return `status-line is-${tone}`;
}

export function requireFilledField({
  value,
  fieldLabel,
  focusTarget,
  showRequiredFieldDialog,
}: {
  value: string;
  fieldLabel: string;
  focusTarget?: HTMLElement | null;
  showRequiredFieldDialog: (
    fieldLabel: string,
    focusTarget?: HTMLElement | null,
  ) => void;
}): boolean {
  if (value.trim()) {
    return true;
  }

  showRequiredFieldDialog(fieldLabel, focusTarget);
  return false;
}
