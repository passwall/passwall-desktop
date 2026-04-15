import type { PasswordItemData } from "@/types";

export function normalizePasswordItemData(
  value: Record<string, unknown> = {}
): PasswordItemData {
  const totpSecret =
    typeof value.totp_secret === "string" && value.totp_secret.trim()
      ? value.totp_secret
      : undefined;

  return {
    name: typeof value.name === "string" ? value.name : "",
    username: typeof value.username === "string" ? value.username : "",
    password: typeof value.password === "string" ? value.password : "",
    totp_secret: totpSecret,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    uris: Array.isArray(value.uris) ? value.uris : undefined,
    fields: Array.isArray(value.fields) ? value.fields : undefined,
  };
}

export function buildPasswordItemDataFromForm(
  form: Record<string, unknown> = {},
  url: string = ""
): PasswordItemData {
  return normalizePasswordItemData({
    name:
      typeof form.name === "string"
        ? form.name
        : typeof form.title === "string"
          ? form.title
          : "",
    username: (form.username as string) || "",
    password: (form.password as string) || "",
    uris: url ? [{ uri: url, match: null }] : [],
    notes:
      (form.notes as string) || (form.note as string) || (form.extra as string) || "",
    totp_secret: (form.totp_secret as string) || "",
  });
}
