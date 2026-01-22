/**
 * @typedef {Object} BankAccountData
 * @property {string} name
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} bank_name
 * @property {string} account_type
 * @property {string} routing_number
 * @property {string} account_number
 * @property {string} [swift_code]
 * @property {string} [iban_number]
 * @property {string} [pin]
 * @property {string} [branch_address]
 * @property {string} [branch_phone]
 * @property {string} [notes]
 */

/**
 * @param {Record<string, unknown>} value
 * @param {string} [fallbackName]
 * @returns {BankAccountData}
 */
export function normalizeBankAccountData(value = {}, fallbackName = '') {
  return {
    name: typeof value.name === 'string' ? value.name : fallbackName,
    first_name: typeof value.first_name === 'string' ? value.first_name : '',
    last_name: typeof value.last_name === 'string' ? value.last_name : '',
    bank_name: typeof value.bank_name === 'string' ? value.bank_name : '',
    account_type: typeof value.account_type === 'string' ? value.account_type : '',
    routing_number: typeof value.routing_number === 'string' ? value.routing_number : '',
    account_number: typeof value.account_number === 'string' ? value.account_number : '',
    swift_code: typeof value.swift_code === 'string' ? value.swift_code : undefined,
    iban_number: typeof value.iban_number === 'string' ? value.iban_number : undefined,
    pin: typeof value.pin === 'string' ? value.pin : undefined,
    branch_address: typeof value.branch_address === 'string' ? value.branch_address : undefined,
    branch_phone: typeof value.branch_phone === 'string' ? value.branch_phone : undefined,
    notes: typeof value.notes === 'string' ? value.notes : undefined
  }
}
