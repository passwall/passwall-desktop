/**
 * @typedef {Object} AddressAttachment
 * @property {string} name
 * @property {number} size
 * @property {string} type
 * @property {string} data
 */

/**
 * @typedef {Object} AddressData
 * @property {string} title
 * @property {string} first_name
 * @property {string} middle_name
 * @property {string} last_name
 * @property {string} company
 * @property {string} address1
 * @property {string} address2
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} country
 * @property {string} phone
 * @property {string} email
 * @property {string} notes
 * @property {AddressAttachment[]} attachments
 */

/**
 * @param {Record<string, unknown>} value
 * @param {string} [fallbackTitle]
 * @returns {AddressData}
 */
export function normalizeAddressData(value = {}, fallbackTitle = '') {
  return {
    title: typeof value.title === 'string' ? value.title : fallbackTitle,
    first_name: typeof value.first_name === 'string' ? value.first_name : '',
    middle_name:
      typeof value.middle_name === 'string' ? value.middle_name : '',
    last_name: typeof value.last_name === 'string' ? value.last_name : '',
    company: typeof value.company === 'string' ? value.company : '',
    address1: typeof value.address1 === 'string' ? value.address1 : '',
    address2: typeof value.address2 === 'string' ? value.address2 : '',
    city: typeof value.city === 'string' ? value.city : '',
    state: typeof value.state === 'string' ? value.state : '',
    zip: typeof value.zip === 'string' ? value.zip : '',
    country: typeof value.country === 'string' ? value.country : '',
    phone: typeof value.phone === 'string' ? value.phone : '',
    email: typeof value.email === 'string' ? value.email : '',
    notes: typeof value.notes === 'string' ? value.notes : '',
    attachments: Array.isArray(value.attachments) ? value.attachments : []
  }
}
