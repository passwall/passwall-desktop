import type { CardData } from "@/types";

export function normalizeCardData(
  value: Record<string, unknown> = {},
  fallbackName: string = ""
): CardData {
  return {
    name: typeof value.name === "string" ? value.name : fallbackName,
    name_on_card:
      typeof value.name_on_card === "string" ? value.name_on_card : "",
    card_type: typeof value.card_type === "string" ? value.card_type : "",
    card_number:
      typeof value.card_number === "string" ? value.card_number : "",
    security_code:
      typeof value.security_code === "string" ? value.security_code : "",
    exp_month: typeof value.exp_month === "string" ? value.exp_month : "",
    exp_year: typeof value.exp_year === "string" ? value.exp_year : "",
    notes: typeof value.notes === "string" ? value.notes : undefined,
  };
}
