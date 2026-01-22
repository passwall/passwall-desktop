import {
  generateItemKey,
  wrapItemKeyWithUserKey,
  unwrapItemKeyWithUserKey,
  encryptWithItemKey,
  decryptWithItemKey,
  isEncString
} from '@/utils/crypto'
import {
  buildPasswordItemDataFromForm,
  normalizePasswordItemData,
  normalizeCardData,
  normalizeBankAccountData,
  normalizeSecureNoteData
} from '@/utils/schema'

export const ItemType = {
  Password: 1,
  Note: 2,
  Card: 3,
  Bank: 4,
  Email: 5,
  Server: 6,
  Identity: 7,
  SSHKey: 8,
  Address: 9,
  Custom: 99
}

export const safeHostName = (url) => {
  if (!url) return ''
  try {
    const parsed = url.includes('://') ? new URL(url) : new URL(`https://${url}`)
    return parsed.hostname || ''
  } catch {
    return ''
  }
}

export const buildMetadata = (type, form) => {
  const name = form.name || form.title || 'Untitled'

  switch (type) {
    case ItemType.Password:
      return {
        name,
        uri_hint: safeHostName(form.url || '')
      }
    case ItemType.Card:
      return {
        name,
        brand: form.type || ''
      }
    default:
      return { name }
  }
}

const parseExpiryDate = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return { exp_month: '', exp_year: '' }
  }

  const match = raw.match(/(\d{1,2})\D?(\d{2,4})/)
  if (!match) {
    return { exp_month: '', exp_year: '' }
  }

  const month = match[1].padStart(2, '0')
  const yearRaw = match[2]
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw

  return { exp_month: month, exp_year: year }
}

const formatExpiryDate = (month, year) => {
  if (!month || !year) {
    return ''
  }
  const yearSuffix = year.length === 4 ? year.slice(2) : year
  return `${month}/${yearSuffix}`
}

const buildItemData = (type, form) => {
  switch (type) {
    case ItemType.Password:
      return buildPasswordItemDataFromForm(form, form.url || '')
    case ItemType.Note:
      return normalizeSecureNoteData({
        name: form.title || '',
        notes: form.note || ''
      })
    case ItemType.Card: {
      const { exp_month, exp_year } = parseExpiryDate(form.expiry_date)
      return normalizeCardData(
        {
          name: form.title || '',
          name_on_card: form.cardholder_name || '',
          card_type: form.type || '',
          card_number: form.number || '',
          security_code: form.verification_number || '',
          exp_month,
          exp_year
        },
        form.title || ''
      )
    }
    case ItemType.Bank:
      return normalizeBankAccountData(
        {
          name: form.account_name || '',
          bank_name: form.title || '',
          account_type: form.currency || '',
          routing_number: form.bank_code || '',
          account_number: form.account_number || '',
          iban_number: form.iban || '',
          pin: form.password || ''
        },
        form.account_name || form.title || ''
      )
    default:
      return { ...form }
  }
}

const mapItemToUi = (item, payload) => {
  switch (item.item_type) {
    case ItemType.Password: {
      const data = normalizePasswordItemData(payload || {})
      const noteFallback = typeof payload.note === 'string' ? payload.note : ''
      return {
        name: data.name || item.metadata?.name || '',
        title: data.name || item.metadata?.name || '',
        url: data.uris?.[0]?.uri || item.metadata?.uri_hint || '',
        username: data.username || '',
        password: data.password || '',
        note: data.notes || noteFallback || '',
        notes: data.notes || noteFallback || '',
        totp_secret: data.totp_secret || '',
        folder_id: item.folder_id ?? null,
        is_favorite: item.is_favorite,
        auto_fill: item.auto_fill,
        auto_login: item.auto_login,
        reprompt: item.reprompt
      }
    }
    case ItemType.Note: {
      const data = normalizeSecureNoteData(payload || {})
      const noteFallback = typeof payload.note === 'string' ? payload.note : ''
      return {
        title: data.name || item.metadata?.name || '',
        note: data.notes || noteFallback || ''
      }
    }
    case ItemType.Card: {
      const data = normalizeCardData(payload || {}, item.metadata?.name || '')
      const cardNumberFallback = typeof payload.number === 'string' ? payload.number : ''
      const cardHolderFallback =
        typeof payload.cardholder_name === 'string' ? payload.cardholder_name : ''
      const cardTypeFallback = typeof payload.type === 'string' ? payload.type : ''
      const securityCodeFallback =
        typeof payload.verification_number === 'string' ? payload.verification_number : ''
      const expiryFallback = typeof payload.expiry_date === 'string' ? payload.expiry_date : ''
      return {
        title: data.name || item.metadata?.name || '',
        cardholder_name: data.name_on_card || cardHolderFallback || '',
        type: data.card_type || cardTypeFallback || '',
        number: data.card_number || cardNumberFallback || '',
        verification_number: data.security_code || securityCodeFallback || '',
        expiry_date: formatExpiryDate(data.exp_month, data.exp_year) || expiryFallback || ''
      }
    }
    case ItemType.Bank: {
      const data = normalizeBankAccountData(payload || {}, item.metadata?.name || '')
      const bankCodeFallback = typeof payload.bank_code === 'string' ? payload.bank_code : ''
      const accountNameFallback =
        typeof payload.account_name === 'string' ? payload.account_name : ''
      const ibanFallback = typeof payload.iban === 'string' ? payload.iban : ''
      const currencyFallback = typeof payload.currency === 'string' ? payload.currency : ''
      const pinFallback = typeof payload.password === 'string' ? payload.password : ''
      return {
        title: data.bank_name || item.metadata?.name || '',
        bank_code: data.routing_number || bankCodeFallback || '',
        account_name: data.name || accountNameFallback || '',
        account_number: data.account_number || '',
        iban: data.iban_number || ibanFallback || '',
        currency: data.account_type || currencyFallback || '',
        password: data.pin || pinFallback || ''
      }
    }
    default:
      return {
        title: payload?.title || payload?.name || item.metadata?.name || '',
        url: payload?.url || item.metadata?.uri_hint || ''
      }
  }
}

export const decryptItemList = async (items, keyList, userKey) => {
  if (!Array.isArray(items)) {
    return []
  }

  return Promise.all(
    items.map(async (item) => {
      let payload = {}

      if (isEncString(item.data)) {
        try {
          if (item.item_key_enc) {
            const itemKey = await unwrapItemKeyWithUserKey(item.item_key_enc, userKey)
            payload = (await decryptWithItemKey(item.data, itemKey)) || {}
          } else {
            payload = (await decryptWithItemKey(item.data, userKey)) || {}
          }
        } catch (_error) {
          payload = {}
        }
      }

      const uiData = mapItemToUi(item, payload)
      const title = uiData.title || payload.title || payload.name || item.metadata?.name || ''
      const url =
        uiData.url ||
        payload.url ||
        payload.uri ||
        item.metadata?.uri_hint ||
        (Array.isArray(payload.uris) ? payload.uris[0]?.uri : '')

      return {
        ...item,
        ...payload,
        ...uiData,
        title,
        url
      }
    })
  )
}

export const buildEncryptedPayload = async (type, form, keyList, userKey) => {
  const metadata = buildMetadata(type, form)
  const data = buildItemData(type, form)
  let payload = {}
  let itemKeyEnc = form.item_key_enc

  if (itemKeyEnc && isEncString(itemKeyEnc)) {
    const itemKey = await unwrapItemKeyWithUserKey(itemKeyEnc, userKey)
    payload = { data: await encryptWithItemKey(data, itemKey) }
  } else {
    const itemKey = await generateItemKey()
    payload = { data: await encryptWithItemKey(data, itemKey) }
    itemKeyEnc = await wrapItemKeyWithUserKey(itemKey, userKey)
  }

  return {
    item_type: type,
    data: payload.data,
    metadata,
    item_key_enc: itemKeyEnc,
    folder_id: form.folder_id || undefined,
    is_favorite: form.is_favorite,
    auto_fill: form.auto_fill,
    auto_login: form.auto_login,
    reprompt: form.reprompt
  }
}
