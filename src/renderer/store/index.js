import { createStore } from 'vuex'

import { cryptoService, PBKDF2_MIN_ITERATIONS, SymmetricKey } from '@/utils/crypto'

import AuthService from '@/api/services/Auth'
import SystemService from '@/api/services/System'
import HTTPClient from '@/api/HTTPClient'

import Passwords from '@/views/Passwords/store'
import CreditCards from '@/views/CreditCards/store'
import BankAccounts from '@/views/BankAccounts/store'
import Emails from '@/views/Emails/store'
import Notes from '@/views/Notes/store'
import Servers from '@/views/Servers/store'

export default createStore({
  state() {
    const userKeyBase64 = sessionStorage.getItem('userKey')
    const masterKeyBase64 = sessionStorage.getItem('masterKey')
    const userKey = userKeyBase64
      ? SymmetricKey.fromBytes(cryptoService.base64ToArray(userKeyBase64))
      : null
    const masterKey = masterKeyBase64 ? cryptoService.base64ToArray(masterKeyBase64) : null
    const accessToken = localStorage.access_token || ''
    const user = localStorage.user ? JSON.parse(localStorage.user) : {}
    const pro = !!user

    return {
      searchQuery: '',
      authenticated: !!accessToken && !!userKey,
      pro,
      user,
      access_token: accessToken,
      refresh_token: localStorage.refresh_token || '',
      userKey,
      masterKey
    }
  },

  getters: {
    hasProPlan(state) {
      return state.pro
    },

    isAuthenticated(state)  {
      return state.authenticated && !!state.userKey && !!state.access_token
    }
  },

  actions: {
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

      state.masterKey = await cryptoService.makeMasterKey(
        master_password,
        kdfConfig.kdf_salt,
        kdfConfig
      )

      const authKey = await cryptoService.hashMasterKey(state.masterKey)
      const authKeyBase64 = cryptoService.arrayToBase64(authKey)

      const { data } = await AuthService.SignIn({
        email,
        master_password_hash: authKeyBase64,
        app: 'desktop'
      })

      const stretchedMasterKey = await cryptoService.stretchMasterKey(state.masterKey)
      state.userKey = await cryptoService.unwrapUserKey(data.protected_user_key, stretchedMasterKey)

      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      state.user = data.user || data
      state.pro = !!state.user
      state.authenticated = true

      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)

      await dispatch('persistSessionKeys', { userKey: state.userKey, masterKey: state.masterKey })

      localStorage.email = email
      localStorage.server = server
      localStorage.access_token = data.access_token
      localStorage.refresh_token = data.refresh_token
      localStorage.user = JSON.stringify(state.user || {})
    },

    async Logout({ state }, payload) {
      try {
        await AuthService.Logout(payload)
      } catch (_error) {
        // Ignore server-side logout errors; proceed to clear local session.
      }

      state.userKey = null
      state.masterKey = null
      state.user = {}
      state.authenticated = false
      state.pro = false
      state.access_token = ''
      state.refresh_token = ''

      HTTPClient.setHeader('Authorization', '')

      sessionStorage.removeItem('userKey')
      sessionStorage.removeItem('masterKey')

      const lsKeys = Object.keys(localStorage).filter(
        (key) => ['email', 'server'].includes(key) === false
      )
      lsKeys.forEach(key => localStorage.removeItem(key))
    },

    async Import(_, data) {
      return SystemService.Import(data)
    },

    async Export() {
      const { data } = SystemService.Export()
      return data
    },

    async persistSessionKeys(_, { userKey, masterKey }) {
      const userKeyB64 = userKey ? cryptoService.arrayToBase64(userKey.toBytes()) : null
      const masterKeyB64 = masterKey ? cryptoService.arrayToBase64(masterKey) : null

      if (userKeyB64) {
        sessionStorage.setItem('userKey', userKeyB64)
      }
      if (masterKeyB64) {
        sessionStorage.setItem('masterKey', masterKeyB64)
      }
    }
  },

  mutations: {
    onInputSearchQuery(state, event) {
      state.searchQuery = event.target.value
    }
  },

  modules: {
    Passwords,
    CreditCards,
    BankAccounts,
    Emails,
    Notes,
    Servers
  }
})
