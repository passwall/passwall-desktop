import { createStore } from 'vuex'

import {
  cryptoService,
  PBKDF2_MIN_ITERATIONS,
  SymmetricKey,
  unwrapOrgKeyWithUserKey,
  encryptWithOrgKey,
  decryptWithOrgKey
} from '@/utils/crypto'

import AuthService from '@/api/services/Auth'
import OrganizationsService from '@/api/services/Organizations'
import HTTPClient from '@/api/HTTPClient'
import { resolveDefaultOrganizationId } from '@/utils/default-organization'
import {
  buildPasswordItemDataFromForm,
  normalizePasswordItemData,
  normalizeCardData,
  normalizeBankAccountData,
  normalizeSecureNoteData,
  normalizeAddressData
} from '@/utils/schema'

// ============================================================
// ItemType Constants
// ============================================================

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

// ============================================================
// Helpers
// ============================================================

function safeHostName(url) {
  if (!url) return ''
  try {
    const parsed = url.includes('://') ? new URL(url) : new URL(`https://${url}`)
    return parsed.hostname || ''
  } catch {
    return ''
  }
}

function formatExpiryDate(month, year) {
  if (!month || !year) return ''
  const yearSuffix = year.length === 4 ? year.slice(2) : year
  return `${month}/${yearSuffix}`
}

function mergeDecryptedItem(item, decryptedData) {
  let normalizedData = decryptedData

  switch (item.item_type) {
    case ItemType.Password: {
      normalizedData = normalizePasswordItemData(decryptedData || {})
      const noteFallback = typeof decryptedData?.note === 'string' ? decryptedData.note : ''
      return {
        ...item,
        ...normalizedData,
        title: item.metadata?.name || normalizedData?.name || '',
        url: item.metadata?.uri_hint || normalizedData?.uris?.[0]?.uri || '',
        note: normalizedData.notes || noteFallback || '',
        notes: normalizedData.notes || noteFallback || ''
      }
    }
    case ItemType.Card: {
      normalizedData = normalizeCardData(decryptedData || {}, item.metadata?.name || '')
      return {
        ...item,
        title: item.metadata?.name || normalizedData?.name || '',
        cardholder_name: normalizedData.name_on_card || decryptedData?.cardholder_name || '',
        type: normalizedData.card_type || decryptedData?.type || '',
        number: normalizedData.card_number || decryptedData?.number || '',
        verification_number:
          normalizedData.security_code || decryptedData?.verification_number || '',
        expiry_date:
          formatExpiryDate(normalizedData.exp_month, normalizedData.exp_year) ||
          decryptedData?.expiry_date ||
          ''
      }
    }
    case ItemType.Bank: {
      normalizedData = normalizeBankAccountData(decryptedData || {}, item.metadata?.name || '')
      return {
        ...item,
        title: normalizedData.bank_name || item.metadata?.name || '',
        bank_code: normalizedData.routing_number || decryptedData?.bank_code || '',
        account_name: normalizedData.name || decryptedData?.account_name || '',
        account_number: normalizedData.account_number || '',
        iban: normalizedData.iban_number || decryptedData?.iban || '',
        currency: normalizedData.account_type || decryptedData?.currency || '',
        password: normalizedData.pin || decryptedData?.password || ''
      }
    }
    case ItemType.Note: {
      normalizedData = normalizeSecureNoteData(decryptedData || {}, item.metadata?.name || '')
      const noteFallback = typeof decryptedData?.note === 'string' ? decryptedData.note : ''
      return {
        ...item,
        title: normalizedData.name || item.metadata?.name || '',
        note: normalizedData.notes || noteFallback || '',
        notes: normalizedData.notes || noteFallback || ''
      }
    }
    case ItemType.Address: {
      normalizedData = normalizeAddressData(decryptedData || {}, item.metadata?.name || '')
      const addressParts = [
        normalizedData.address1,
        normalizedData.address2,
        normalizedData.city,
        normalizedData.state,
        normalizedData.zip,
        normalizedData.country
      ].filter(Boolean)
      const fullAddress = addressParts.join(', ')
      return {
        ...item,
        title: normalizedData.title || item.metadata?.name || '',
        first_name: normalizedData.first_name || '',
        middle_name: normalizedData.middle_name || '',
        last_name: normalizedData.last_name || '',
        company: normalizedData.company || '',
        address1: normalizedData.address1 || '',
        address2: normalizedData.address2 || '',
        city: normalizedData.city || '',
        state: normalizedData.state || '',
        zip: normalizedData.zip || '',
        country: normalizedData.country || '',
        phone: normalizedData.phone || '',
        email: normalizedData.email || '',
        notes: normalizedData.notes || '',
        attachments: normalizedData.attachments || [],
        // Helper field for list preview/search in desktop UI.
        address: fullAddress
      }
    }
    case ItemType.Email:
      return {
        ...item,
        title: decryptedData?.title || item.metadata?.name || '',
        email: decryptedData?.email || '',
        password: decryptedData?.password || ''
      }
    case ItemType.Server:
      return {
        ...item,
        title: decryptedData?.title || item.metadata?.name || '',
        ip: decryptedData?.ip || '',
        username: decryptedData?.username || '',
        password: decryptedData?.password || '',
        hosting_username: decryptedData?.hosting_username || '',
        hosting_password: decryptedData?.hosting_password || '',
        admin_username: decryptedData?.admin_username || '',
        admin_password: decryptedData?.admin_password || '',
        extra: decryptedData?.extra || ''
      }
    default:
      return {
        ...item,
        ...decryptedData,
        title: item.metadata?.name || decryptedData?.name || '',
        url: item.metadata?.uri_hint || ''
      }
  }
}

function buildItemData(type, form) {
  switch (type) {
    case ItemType.Password:
      return buildPasswordItemDataFromForm(form, form.url || '')
    case ItemType.Note:
      return normalizeSecureNoteData({
        name: form.title || '',
        notes: form.note || form.notes || ''
      })
    case ItemType.Card: {
      const raw = String(form.expiry_date || '').trim()
      let exp_month = ''
      let exp_year = ''
      if (raw) {
        const match = raw.match(/(\d{1,2})\D?(\d{2,4})/)
        if (match) {
          exp_month = match[1].padStart(2, '0')
          exp_year = match[2].length === 2 ? `20${match[2]}` : match[2]
        }
      }
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
    case ItemType.Address:
      return normalizeAddressData(
        {
          title: form.title || '',
          first_name: form.first_name || '',
          middle_name: form.middle_name || '',
          last_name: form.last_name || '',
          company: form.company || '',
          address1: form.address1 || '',
          address2: form.address2 || '',
          city: form.city || '',
          state: form.state || '',
          zip: form.zip || '',
          country: form.country || '',
          phone: form.phone || '',
          email: form.email || '',
          notes: form.notes || '',
          attachments: Array.isArray(form.attachments) ? form.attachments : []
        },
        form.title || ''
      )
    case ItemType.Email:
      return {
        title: form.title || '',
        email: form.email || '',
        password: form.password || ''
      }
    case ItemType.Server:
      return {
        title: form.title || '',
        ip: form.ip || '',
        username: form.username || '',
        password: form.password || '',
        hosting_username: form.hosting_username || '',
        hosting_password: form.hosting_password || '',
        admin_username: form.admin_username || '',
        admin_password: form.admin_password || '',
        extra: form.extra || ''
      }
    default:
      return { ...form }
  }
}

function getOrgPublicId(numericOrgId, organizations) {
  const org = organizations.find((o) => o.id === numericOrgId)
  if (!org?.public_id) throw new Error(`No public_id for org ${numericOrgId}`)
  return org.public_id
}

function buildMetadata(type, form) {
  const name = form.name || form.title || 'Untitled'
  switch (type) {
    case ItemType.Password:
      return { name, uri_hint: safeHostName(form.url || '') }
    case ItemType.Card:
      return { name, brand: form.type || '' }
    default:
      return { name }
  }
}

// ============================================================
// Store
// ============================================================

export default createStore({
  state() {
    const userKeyBase64 = sessionStorage.getItem('userKey')
    const userKey = userKeyBase64
      ? SymmetricKey.fromBytes(cryptoService.base64ToArray(userKeyBase64))
      : null
    const accessToken = localStorage.access_token || ''
    const user = localStorage.user ? JSON.parse(localStorage.user) : null

    // Clean up legacy masterKey from sessionStorage (never persist masterKey)
    sessionStorage.removeItem('masterKey')

    // Restore organizations from localStorage
    let organizations = []
    try {
      const orgsJson = localStorage.getItem('organizations')
      if (orgsJson) organizations = JSON.parse(orgsJson)
    } catch {
      organizations = []
    }

    return {
      searchQuery: '',
      authenticated: !!accessToken && !!userKey,
      pro: !!user,
      user,
      access_token: accessToken,
      refresh_token: localStorage.refresh_token || '',
      userKey,
      // Organization support
      organizations,
      defaultOrgId: resolveDefaultOrganizationId({ user, organizations }),
      orgKeys: {}, // { [orgId]: SymmetricKey }
      // Two-factor authentication
      two_factor_token: null,
      two_factor_required: false,
      // Unified items list
      items: [],
      itemsLoading: false
    }
  },

  getters: {
    hasProPlan(state) {
      if (!state.user) return false
      const org =
        state.organizations.find((o) => o.id === state.defaultOrgId) ||
        state.organizations.find((o) => o.is_personal) ||
        state.organizations[0]
      if (!org) return state.pro
      const status = org.subscription_status
      if (status === 'expired' || status === 'canceled') return false
      const plan = (org.plan || 'free').split('-')[0].toLowerCase()
      return plan !== 'free'
    },

    isAuthenticated(state) {
      return state.authenticated && !!state.userKey && !!state.access_token
    },

    defaultOrganization(state) {
      return (
        state.organizations.find((o) => o.id === state.defaultOrgId) ||
        state.organizations[0] ||
        null
      )
    },

    getItemsByType: (state) => (type) => {
      return state.items.filter((item) => item.item_type === type)
    },

    getItemById: (state) => (id) => {
      return state.items.find((item) => item.id === id)
    }
  },

  actions: {
    // ============================================================
    // Auth Actions
    // ============================================================

    async Login({ state, dispatch }, payload) {
      const { email, master_password, server } = payload

      HTTPClient.setBaseURL(server)

      const { data: kdfConfig } = await AuthService.PreLogin(email)

      if (kdfConfig.kdf_type === 0 && kdfConfig.kdf_iterations < PBKDF2_MIN_ITERATIONS) {
        throw new Error(
          `KDF iterations too low (${kdfConfig.kdf_iterations}). ` +
            `Minimum required: ${PBKDF2_MIN_ITERATIONS}.`
        )
      }

      const masterKey = await cryptoService.makeMasterKey(
        master_password,
        kdfConfig.kdf_salt,
        kdfConfig
      )

      const authKey = await cryptoService.hashMasterKey(masterKey)
      const authKeyBase64 = cryptoService.arrayToBase64(authKey)

      let data
      try {
        const response = await AuthService.SignIn({
          email,
          master_password_hash: authKeyBase64,
          app: 'desktop'
        })
        data = response.data
      } catch (error) {
        if (
          error?.response?.status === 403 &&
          error?.response?.data?.error === 'two_factor_setup_required'
        ) {
          throw Object.assign(
            new Error(
              'Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app.'
            ),
            { type: 'REQUIRE_2FA_SETUP', requirement: error.response.data.require_two_factor_setup }
          )
        }
        throw error
      }

      if (data.two_factor_required) {
        state.two_factor_required = true
        state.two_factor_token = data.two_factor_token
        state._pendingMasterKey = masterKey
        localStorage.email = email
        localStorage.server = server
        return { two_factor_required: true }
      }

      if (data.require_two_factor_setup?.is_mandatory) {
        throw Object.assign(
          new Error(
            'Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app.'
          ),
          { type: 'REQUIRE_2FA_SETUP', requirement: data.require_two_factor_setup }
        )
      }

      await dispatch('completeLogin', { data, email, server, masterKey })
    },

    async VerifyTwoFactor({ state, dispatch }, code) {
      const { data } = await AuthService.Verify2FA({
        two_factor_token: state.two_factor_token,
        totp_code: code
      })

      if (data.require_two_factor_setup?.is_mandatory) {
        state.two_factor_required = false
        state.two_factor_token = null
        state._pendingMasterKey = null
        throw Object.assign(
          new Error(
            'Two-factor authentication setup is required by your organization. Please set it up in the Passwall Vault web app.'
          ),
          { type: 'REQUIRE_2FA_SETUP', requirement: data.require_two_factor_setup }
        )
      }

      const masterKey = state._pendingMasterKey
      state.two_factor_required = false
      state.two_factor_token = null
      state._pendingMasterKey = null

      const email = localStorage.email || ''
      const server = localStorage.server || ''
      await dispatch('completeLogin', { data, email, server, masterKey })
    },

    async completeLogin({ state, dispatch }, { data, email, server, masterKey }) {
      const stretchedMasterKey = await cryptoService.stretchMasterKey(masterKey)
      state.userKey = await cryptoService.unwrapUserKey(data.protected_user_key, stretchedMasterKey)
      // masterKey is not persisted — only held for the duration of key unwrap

      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      state.user = data.user || data
      state.pro = !!state.user
      state.authenticated = true

      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)

      await dispatch('persistSessionKeys', { userKey: state.userKey })

      // Store userKey in OS keychain via safeStorage (survives app restarts)
      await dispatch('storeUserKeyInKeychain', { email })

      localStorage.email = email
      localStorage.server = server
      localStorage.access_token = data.access_token
      localStorage.refresh_token = data.refresh_token
      localStorage.user = JSON.stringify(state.user || {})

      await dispatch('fetchOrganizations')
    },

    async Logout({ state, dispatch }) {
      try {
        await AuthService.Logout()
      } catch (_error) {
        // Ignore server-side logout errors
      }

      // Clear userKey from OS keychain
      const email = localStorage.email || ''
      await dispatch('removeUserKeyFromKeychain', { email })

      state.userKey = null
      state.user = null
      state.authenticated = false
      state.pro = false
      state.access_token = ''
      state.refresh_token = ''
      state.two_factor_token = null
      state.two_factor_required = false
      state._pendingMasterKey = null
      state.organizations = []
      state.defaultOrgId = null
      state.orgKeys = {}
      state.items = []

      HTTPClient.setHeader('Authorization', '')

      sessionStorage.removeItem('userKey')

      const lsKeys = Object.keys(localStorage).filter(
        (key) => ['email', 'server'].includes(key) === false
      )
      lsKeys.forEach((key) => localStorage.removeItem(key))
    },

    // ============================================================
    // Organization Actions
    // ============================================================

    async fetchOrganizations({ state }) {
      try {
        const { data } = await OrganizationsService.GetAll()
        const orgs = Array.isArray(data) ? data : []
        state.organizations = orgs
        state.defaultOrgId = resolveDefaultOrganizationId({
          user: state.user,
          organizations: orgs
        })
        localStorage.setItem('organizations', JSON.stringify(orgs))

        // Unwrap org keys
        if (state.userKey) {
          for (const org of orgs) {
            if (org.encrypted_org_key && !state.orgKeys[org.id]) {
              try {
                const orgKey = await unwrapOrgKeyWithUserKey(org.encrypted_org_key, state.userKey)
                state.orgKeys[org.id] = orgKey
              } catch (error) {
                console.error(`Failed to unwrap org key for org ${org.id}:`, error.message)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error.message)
      }
    },

    // ============================================================
    // Unified Item Actions (Organization-Based)
    // ============================================================

    async FetchItems({ state }, filter = {}) {
      state.itemsLoading = true

      try {
        const organizations = state.organizations
        if (!organizations || organizations.length === 0) {
          state.items = []
          state.itemsLoading = false
          return
        }

        const params = {}
        if (filter.type) params.type = filter.type
        if (filter.search) params.search = filter.search
        if (filter.is_favorite !== undefined) params.is_favorite = filter.is_favorite
        if (filter.folder_id) params.folder_id = filter.folder_id
        params.per_page = filter.per_page || 5000

        const orgFetchPromises = organizations.map(async (org) => {
          try {
            const { data } = await OrganizationsService.ListItems(org.public_id, params)
            const items = data.items || data || []

            let orgKey = state.orgKeys[org.id]
            if (!orgKey && org.encrypted_org_key && state.userKey) {
              try {
                orgKey = await unwrapOrgKeyWithUserKey(org.encrypted_org_key, state.userKey)
                state.orgKeys[org.id] = orgKey
              } catch {
                // Key unwrap failed
              }
            }

            if (!orgKey) {
              return items.map((item) => ({
                ...item,
                _orgId: org.id,
                _orgName: org.name,
                title: item.metadata?.name || '[Encrypted]',
                url: item.metadata?.uri_hint || ''
              }))
            }

            return await Promise.all(
              items.map(async (item) => {
                try {
                  const decryptedData = await decryptWithOrgKey(item.data, orgKey)
                  const normalized = mergeDecryptedItem(item, decryptedData)
                  return { ...normalized, _orgId: org.id, _orgName: org.name }
                } catch {
                  return {
                    ...item,
                    _orgId: org.id,
                    _orgName: org.name,
                    title: item.metadata?.name || '[Decryption Failed]',
                    url: item.metadata?.uri_hint || ''
                  }
                }
              })
            )
          } catch (error) {
            console.error(`Failed to fetch items from org ${org.id}:`, error.message)
            return []
          }
        })

        const allResults = await Promise.all(orgFetchPromises)
        const decryptedItems = allResults.flat()

        if (filter.type) {
          const otherTypeItems = state.items.filter((item) => item.item_type !== filter.type)
          state.items = [...otherTypeItems, ...decryptedItems]
        } else {
          state.items = decryptedItems
        }

        state.itemsLoading = false
      } catch (error) {
        console.error('Failed to fetch items:', error.message)
        state.itemsLoading = false
        throw error
      }
    },

    async CreateItem({ state, dispatch }, { type, form, orgId }) {
      const targetOrgId = orgId || state.defaultOrgId || state.organizations[0]?.id
      if (!targetOrgId) throw new Error('No organization available')

      const orgKey = state.orgKeys[targetOrgId]
      if (!orgKey) throw new Error('Organization key not available')

      const metadata = buildMetadata(type, form)
      const data = buildItemData(type, form)
      const encryptedData = await encryptWithOrgKey(JSON.stringify(data), orgKey)

      const targetOrgPublicId = getOrgPublicId(targetOrgId, state.organizations)
      const { data: createdResponse } = await OrganizationsService.CreateItem(targetOrgPublicId, {
        item_type: type,
        data: encryptedData,
        metadata,
        folder_id: form.folder_id || undefined,
        is_favorite: form.is_favorite || false,
        auto_fill: form.auto_fill ?? false,
        auto_login: form.auto_login ?? false,
        reprompt: form.reprompt ?? false
      })

      const createdItem = createdResponse?.item || createdResponse
      if (!createdItem || !createdItem.id) {
        await dispatch('FetchItems', { type })
        return null
      }

      let normalized
      try {
        const decryptedData = await decryptWithOrgKey(createdItem.data, orgKey)
        normalized = mergeDecryptedItem(createdItem, decryptedData)
        normalized._orgId = targetOrgId
      } catch {
        normalized = {
          ...createdItem,
          _orgId: targetOrgId,
          title: createdItem.metadata?.name || '[Encrypted]',
          url: createdItem.metadata?.uri_hint || ''
        }
      }

      state.items = [normalized, ...state.items]
      return normalized
    },

    async UpdateItem({ state, dispatch }, { id, form, type }) {
      const existingItem = state.items.find((item) => item.id === id)
      if (!existingItem) throw new Error('Item not found')

      const itemOrgId = existingItem._orgId || existingItem.organization_id
      const orgKey = state.orgKeys[itemOrgId]
      if (!orgKey) throw new Error('Organization key not available')

      const itemType = type || existingItem.item_type
      const metadata = buildMetadata(itemType, form)
      const data = buildItemData(itemType, form)
      const encryptedData = await encryptWithOrgKey(JSON.stringify(data), orgKey)

      const { data: updatedResponse } = await OrganizationsService.UpdateItem(id, {
        data: encryptedData,
        metadata,
        folder_id: form.folder_id,
        is_favorite: form.is_favorite,
        auto_fill: form.auto_fill,
        auto_login: form.auto_login,
        reprompt: form.reprompt
      })

      const updatedItem = updatedResponse?.item || updatedResponse
      if (!updatedItem || !updatedItem.id) {
        await dispatch('FetchItems', { type: itemType })
        return state.items.find((item) => item.id === id) || null
      }

      let normalized
      try {
        const decryptedData = await decryptWithOrgKey(updatedItem.data, orgKey)
        normalized = mergeDecryptedItem(updatedItem, decryptedData)
        normalized._orgId = itemOrgId
      } catch {
        normalized = {
          ...updatedItem,
          _orgId: itemOrgId,
          title: updatedItem.metadata?.name || '[Encrypted]',
          url: updatedItem.metadata?.uri_hint || ''
        }
      }

      state.items = state.items.map((item) => (item.id === id ? normalized : item))
      return normalized
    },

    async DeleteItem({ state }, id) {
      await OrganizationsService.DeleteItem(id)
      state.items = state.items.filter((item) => item.id !== id)
    },

    // ============================================================
    // Import / Export
    // ============================================================

    async ExportItems({ state }) {
      const result = {}

      for (const item of state.items) {
        const typeName =
          {
            [ItemType.Password]: 'Passwords',
            [ItemType.Note]: 'Notes',
            [ItemType.Address]: 'Addresses',
            [ItemType.Card]: 'CreditCards',
            [ItemType.Bank]: 'BankAccounts'
          }[item.item_type] || 'Other'

        if (!result[typeName]) result[typeName] = []

        // Items are already decrypted in state
        const cleaned = { ...item }
        delete cleaned._orgId
        delete cleaned._orgName
        delete cleaned.data
        delete cleaned.item_key_enc
        result[typeName].push(cleaned)
      }

      return result
    },

    async ImportItems({ state, dispatch }, { items, type }) {
      const targetOrgId = state.defaultOrgId || state.organizations[0]?.id
      if (!targetOrgId) throw new Error('No organization available')

      const orgKey = state.orgKeys[targetOrgId]
      if (!orgKey) throw new Error('Organization key not available')

      const targetOrgPublicId = getOrgPublicId(targetOrgId, state.organizations)
      for (const item of items) {
        const data = buildItemData(type, item)
        const metadata = buildMetadata(type, item)
        const encryptedData = await encryptWithOrgKey(JSON.stringify(data), orgKey)

        await OrganizationsService.CreateItem(targetOrgPublicId, {
          item_type: type,
          data: encryptedData,
          metadata,
          auto_fill: false,
          auto_login: false
        })
      }

      // Refresh items after import
      await dispatch('FetchItems', { type })
    },

    // ============================================================
    // Session Management
    // ============================================================

    async persistSessionKeys(_, { userKey }) {
      const userKeyB64 = userKey ? cryptoService.arrayToBase64(userKey.toBytes()) : null
      if (userKeyB64) {
        sessionStorage.setItem('userKey', userKeyB64)
      }
    },

    /**
     * Store userKey in OS keychain via Electron safeStorage.
     * Survives app restarts — enables extension unlock without re-entering master password.
     */
    async storeUserKeyInKeychain(_, { email }) {
      if (!window.electronAPI?.keyStore) return
      try {
        const userKeyB64 = sessionStorage.getItem('userKey')
        if (!userKeyB64 || !email) return
        await window.electronAPI.keyStore.store(email, userKeyB64)
      } catch {
        // safeStorage may not be available (Linux without secret store)
      }
    },

    /**
     * Restore userKey from OS keychain.
     * Called on app startup when sessionStorage is empty but keychain has persisted key.
     */
    async restoreUserKeyFromKeychain({ state }) {
      if (!window.electronAPI?.keyStore) return false
      try {
        const email = localStorage.email || ''
        if (!email) return false
        const available = await window.electronAPI.keyStore.isAvailable()
        if (!available) return false
        const userKeyB64 = await window.electronAPI.keyStore.retrieve(email)
        if (!userKeyB64) return false
        const userKeyBytes = cryptoService.base64ToArray(userKeyB64)
        state.userKey = SymmetricKey.fromBytes(userKeyBytes)
        sessionStorage.setItem('userKey', userKeyB64)
        state.authenticated = !!state.access_token && !!state.userKey
        return true
      } catch {
        return false
      }
    },

    async removeUserKeyFromKeychain(_, { email }) {
      if (!window.electronAPI?.keyStore) return
      try {
        if (!email) return
        await window.electronAPI.keyStore.remove(email)
      } catch {
        // ignore
      }
    }
  },

  mutations: {
    onInputSearchQuery(state, event) {
      state.searchQuery = event.target.value
    }
  }
})
