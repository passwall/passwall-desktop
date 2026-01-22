/**
 * @typedef {Object} PasswordItemUri
 * @property {string} uri
 * @property {number|null} match
 */

/**
 * @typedef {Object} PasswordItemField
 * @property {number} type
 * @property {string} name
 * @property {string} value
 */

/**
 * @typedef {Object} PasswordItemData
 * @property {string} name
 * @property {string} username
 * @property {string} password
 * @property {string} [totp_secret]
 * @property {string} [notes]
 * @property {PasswordItemUri[]} [uris]
 * @property {PasswordItemField[]} [fields]
 */

/**
 * Normalize decrypted password data into the canonical schema.
 * @param {Record<string, unknown>} value
 * @returns {PasswordItemData}
 */
export function normalizePasswordItemData(value = {}) {
  const totpSecret =
    typeof value.totp_secret === 'string' && value.totp_secret.trim() ? value.totp_secret : ''

  return {
    name: typeof value.name === 'string' ? value.name : '',
    username: typeof value.username === 'string' ? value.username : '',
    password: typeof value.password === 'string' ? value.password : '',
    totp_secret: totpSecret || undefined,
    notes: typeof value.notes === 'string' ? value.notes : undefined,
    uris: Array.isArray(value.uris) ? value.uris : undefined,
    fields: Array.isArray(value.fields) ? value.fields : undefined
  }
}

/**
 * Build canonical password data from form.
 * @param {Record<string, unknown>} form
 * @param {string} url
 * @returns {PasswordItemData}
 */
export function buildPasswordItemDataFromForm(form = {}, url = '') {
  return normalizePasswordItemData({
    name:
      typeof form.name === 'string'
        ? form.name
        : typeof form.title === 'string'
          ? form.title
          : form.name || '',
    username: form.username || '',
    password: form.password || '',
    uris: url ? [{ uri: url, match: null }] : [],
    notes: form.notes || form.note || form.extra || '',
    totp_secret: form.totp_secret || ''
  })
}
