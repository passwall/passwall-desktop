import type { VaultItem } from "@/types";
import { ItemType } from "@/types";

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];
const MAX_FIELD_LENGTH = 10000;
const SUPPORTED_EXPORT_ITEM_TYPES = new Set<ItemType>([
  ItemType.Password,
  ItemType.Note,
  ItemType.Card,
  ItemType.Bank,
  ItemType.Address,
]);

export interface ImportedVaultRow {
  type: ItemType;
  form: Record<string, unknown>;
}

function sanitizeCellForSpreadsheet(val: string): string {
  if (val.length > 0 && FORMULA_PREFIXES.some((p) => val.startsWith(p))) {
    val = `'${val}`;
  }
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function unescapeSpreadsheetFormula(val: string): string {
  return /^'[=+\-@\t\r]/.test(val) ? val.slice(1) : val;
}

export function exportItemsToCSV(
  items: Record<string, VaultItem[]>
): { filename: string; content: string }[] {
  const files: { filename: string; content: string }[] = [];

  for (const [typeName, typeItems] of Object.entries(items)) {
    const supportedItems = typeItems.filter((item) =>
      SUPPORTED_EXPORT_ITEM_TYPES.has(item.item_type)
    );
    if (!supportedItems.length) continue;

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

    for (const item of supportedItems) {
      for (const key of Object.keys(item)) {
        if (!skipKeys.has(key) && typeof item[key] !== "object") {
          allKeys.add(key);
        }
      }
    }

    const headers = Array.from(allKeys);
    const rows = supportedItems.map((item) =>
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

export function exportItemsToJSON(items: Record<string, VaultItem[]>): {
  filename: string;
  content: string;
} {
  const timestamp = new Date().toISOString().split("T")[0];
  const exportedItems = Object.values(items)
    .flat()
    .filter((item) => SUPPORTED_EXPORT_ITEM_TYPES.has(item.item_type))
    .map((item) => {
      const { _orgId, _orgName, data, metadata, ...rest } = item;
      void _orgId;
      void _orgName;
      void data;
      return {
        ...rest,
        name:
          (typeof rest.name === "string" && rest.name) ||
          (typeof rest.title === "string" && rest.title) ||
          metadata?.name ||
          "",
        full_data: buildFullDataForExport(item),
      };
    });

  return {
    filename: `passwall-vault-${timestamp}.json`,
    content: JSON.stringify(
      {
        encrypted: false,
        format: "passwall",
        version: 2,
        exported_at: new Date().toISOString(),
        items: exportedItems,
      },
      null,
      2
    ),
  };
}

function buildFullDataForExport(item: VaultItem): Record<string, unknown> {
  const fullData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (
      [
        "id",
        "item_type",
        "data",
        "metadata",
        "organization_id",
        "_orgId",
        "_orgName",
        "created_at",
        "updated_at",
        "folder_id",
        "is_favorite",
        "auto_fill",
        "auto_login",
        "reprompt",
      ].includes(key)
    ) {
      continue;
    }
    if (value !== undefined && value !== null) {
      fullData[key] = value;
    }
  }
  return fullData;
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

function sanitizeImportValue(val: string): string {
  let v = unescapeSpreadsheetFormula(val);
  if (v.length > MAX_FIELD_LENGTH) {
    v = v.substring(0, MAX_FIELD_LENGTH);
  }
  return v;
}

export function parseCSV(text: string): Record<string, string>[] {
  const records = parseCSVRecords(text);
  if (records.length < 2) return [];

  const headers = records[0].map((h) => h.trim());
  return records.slice(1).filter((values) => values.some((v) => v.trim())).map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = sanitizeImportValue(values[i] || "");
    });
    return row;
  });
}

function parseCSVRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      if (char === "\r" && text[i + 1] === "\n") i++;
      continue;
    }

    field += char;
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  return records;
}

export function parseImportFile(filename: string, text: string): ImportedVaultRow[] {
  if (filename.toLowerCase().endsWith(".json")) {
    return parsePasswallJSON(text);
  }

  const type = detectTypeFromFilename(filename);
  if (!type) {
    throw new Error("Could not determine item type from filename");
  }
  return parseCSV(text).map((form) => ({ type, form }));
}

function parsePasswallJSON(text: string): ImportedVaultRow[] {
  const parsed = JSON.parse(text) as {
    items?: Array<Record<string, unknown>>;
  } | Array<Record<string, unknown>>;
  const items = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(items)) return [];

  return items
    .map((item): ImportedVaultRow | null => {
      const type = readItemType(item.item_type ?? item.type);
      if (!type) return null;
      const fullData =
        item.full_data && typeof item.full_data === "object"
          ? (item.full_data as Record<string, unknown>)
          : {};
      const form: Record<string, unknown> = { ...fullData };
      for (const [key, value] of Object.entries({ ...item, ...fullData })) {
        if (value === null || value === undefined) {
          continue;
        }
        if (typeof value === "object") {
          form[key] = value;
          continue;
        }
        form[key] = sanitizeImportValue(String(value));
      }
      if (!form.title && typeof item.name === "string") form.title = item.name;
      if (!form.name && typeof item.name === "string") form.name = item.name;
      return { type, form };
    })
    .filter((row): row is ImportedVaultRow => row !== null);
}

function readItemType(value: unknown): ItemType | null {
  if (typeof value === "number" && Object.values(ItemType).includes(value)) {
    return value as ItemType;
  }
  if (typeof value === "number") return null;
  if (typeof value !== "string") return ItemType.Password;
  const normalized = value.toLowerCase();
  if (normalized.includes("password") || normalized.includes("login")) {
    return ItemType.Password;
  }
  if (normalized.includes("note")) return ItemType.Note;
  if (normalized.includes("card")) return ItemType.Card;
  if (normalized.includes("bank")) return ItemType.Bank;
  if (normalized.includes("address")) return ItemType.Address;
  return null;
}
