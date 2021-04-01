import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import CryptoUtils from '@/utils/crypto'

import AuthService from '@/api/services/Auth'
import SystemService from '@/api/services/System'
import HTTPClient from '@/api/HTTPClient'

import Logins from '@/views/Logins/store'
import CreditCards from '@/views/CreditCards/store'
import BankAccounts from '@/views/BankAccounts/store'
import Emails from '@/views/Emails/store'
import Notes from '@/views/Notes/store'
import Servers from '@/views/Servers/store'

export default new Vuex.Store({
  state() {
    CryptoUtils.encryptKey = localStorage.master_hash
    CryptoUtils.transmissionKey = localStorage.transmission_key

    return {
      access_token: localStorage.access_token,
      refresh_token: localStorage.refresh_token,
      transmission_key: localStorage.transmission_key,
      master_hash: localStorage.master_hash,
      searchQuery: '',
      user: {}
    }
  },

  getters: {
    hasProPlan(state) {
      return state.user.type == 'pro'
    }
  },

  actions: {
    async Login({ state }, payload) {
      payload.master_password = CryptoUtils.sha256Encrypt(payload.master_password)

      const { data } = await AuthService.Login(payload)
      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      state.transmission_key = data.transmission_key.substr(0, 32)
      state.master_hash = CryptoUtils.pbkdf2Encrypt(data.secret, payload.master_password)
      CryptoUtils.encryptKey = state.master_hash
      CryptoUtils.transmissionKey = state.transmission_key
      state.user = data

      localStorage.email = payload.email
      localStorage.server = payload.server
      localStorage.access_token = data.access_token
      localStorage.refresh_token = data.refresh_token
      if (process.env.NODE_ENV !== 'production') {
        localStorage.master_hash = state.master_hash
        localStorage.transmission_key = state.transmission_key
      }

      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)
    },

    Logout({ state }) {
      state.access_token = null
      state.refresh_token = null
      state.transmission_key = null
      state.master_hash = null
      state.user = null
      const lsKeys = Object.keys(localStorage).filter(key => ['email','server'].includes(key) === false)
      lsKeys.forEach(key => localStorage.removeItem(key))
    },

    async Import(_, data) {
      return SystemService.Import(data)
    },

    async Export() {
      const { data } = SystemService.Export()
      return data
    }
  },

  mutations: {
    onInputSearchQuery(state, event) {
      state.searchQuery = event.target.value
    }
  },

  modules: {
    Logins,
    CreditCards,
    BankAccounts,
    Emails,
    Notes,
    Servers
  }
})
