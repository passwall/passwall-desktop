/**
 * @typedef {Object} NoteAttachment
 * @property {string} name
 * @property {number} size
 * @property {string} type
 * @property {string} data
 */

/**
 * @typedef {Object} SecureNoteData
 * @property {string} name
 * @property {string} notes
 * @property {NoteAttachment[]} attachments
 */

/**
 * @param {Record<string, unknown>} value
 * @param {string} [fallbackName]
 * @returns {SecureNoteData}
 */
export function normalizeSecureNoteData(value = {}, fallbackName = '') {
  return {
    name: typeof value.name === 'string' ? value.name : fallbackName,
    notes: typeof value.notes === 'string' ? value.notes : '',
    attachments: Array.isArray(value.attachments) ? value.attachments : []
  }
}
