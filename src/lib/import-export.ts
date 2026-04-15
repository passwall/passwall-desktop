import type { VaultItem } from "@/types";
import { ItemType } from "@/types";

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

function sanitizeCellForSpreadsheet(val: string): string {
  if (val.length > 0 && FORMULA_PREFIXES.some((p) => val.startsWith(p))) {
    val = `'${val}`;
  }
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function exportItemsToCSV(
  items: Record<string, VaultItem[]>
): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = [];

  for (const [typeName, typeItems] of Object.entries(items)) {
    if (!typeItems.length) continue;

    const allKeys = new Set<string>();
    const skipKeys = new Set([
      "id",
      "item_type",
      "data",
      "metadata",
      "organization_id",
      "item_key_enc",
      "created_at",
      "updated_at",
      "folder_id",
      "is_favorite",
      "auto_fill",
      "auto_login",
      "reprompt",
    ]);

    for (const item of typeItems) {
      for (const key of Object.keys(item)) {
        if (!skipKeys.has(key) && typeof item[key] !== "object") {
          allKeys.add(key);
        }
      }
    }

    const headers = Array.from(allKeys);
    const rows = typeItems.map((item) =>
      headers
        .map((h) => sanitizeCellForSpreadsheet(String(item[h] ?? "")))
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    files.push({
      filename: `passwall-${typeName.toLowerCase()}.csv`,
      content: csv,
    });
  }

  return files;
}

export function detectTypeFromFilename(filename: string): ItemType | null {
  const lower = filename.toLowerCase();
  if (lower.includes("password") || lower.includes("login"))
    return ItemType.Password;
  if (lower.includes("note")) return ItemType.Note;
  if (
    lower.includes("card") ||
    lower.includes("credit") ||
    lower.includes("payment")
  )
    return ItemType.Card;
  if (lower.includes("bank")) return ItemType.Bank;
  if (lower.includes("address")) return ItemType.Address;
  return null;
}

const MAX_FIELD_LENGTH = 10000;

function sanitizeImportValue(val: string): string {
  let v = val;
  if (v.length > MAX_FIELD_LENGTH) {
    v = v.substring(0, MAX_FIELD_LENGTH);
  }
  if (v.length > 0 && FORMULA_PREFIXES.some((p) => v.startsWith(p))) {
    v = v.substring(1);
  }
  return v;
}

export function parseCSV(text: string): Record<string, string>[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h.trim()] = sanitizeImportValue(values[i] || "");
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
