import type { BankAccountData } from "@/types";

export function normalizeBankAccountData(
  value: Record<string, unknown> = {},
  fallbackName: string = ""
): BankAccountData {
  return {
    name: typeof value.name === "string" ? value.name : fallbackName,
    first_name: typeof value.first_name === "string" ? value.first_name : "",
    last_name: typeof value.last_name === "string" ? value.last_name : "",
    bank_name: typeof value.bank_name === "string" ? value.bank_name : "",
    account_type:
      typeof value.account_type === "string" ? value.account_type : "",
    routing_number:
      typeof value.routing_number === "string" ? value.routing_number : "",
    account_number:
      typeof value.account_number === "string" ? value.account_number : "",
    swift_code:
      typeof value.swift_code === "string" ? value.swift_code : undefined,
    iban_number:
      typeof value.iban_number === "string" ? value.iban_number : undefined,
    pin: typeof value.pin === "string" ? value.pin : undefined,
    branch_address:
      typeof value.branch_address === "string"
        ? value.branch_address
        : undefined,
    branch_phone:
      typeof value.branch_phone === "string" ? value.branch_phone : undefined,
    notes: typeof value.notes === "string" ? value.notes : undefined,
  };
}
