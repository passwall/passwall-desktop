import type { SecureNoteData } from "@/types";

export function normalizeSecureNoteData(
  value: Record<string, unknown> = {},
  fallbackName: string = ""
): SecureNoteData {
  return {
    name: typeof value.name === "string" ? value.name : fallbackName,
    notes: typeof value.notes === "string" ? value.notes : "",
    attachments: Array.isArray(value.attachments) ? value.attachments : [],
  };
}
