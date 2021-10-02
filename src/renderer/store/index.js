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
      transmission_key: localStorage.transmission_key,
      master_hash: localStorage.master_hash,
      searchQuery: '',
      authenticated: false,
      pro: false,
      user: {}
    }
  },

  getters: {
    hasProPlan(state) {
      return state.pro
    },

    isAuthenticated(state)  {
      return state.authenticated
    }
  },

  actions: {
    async Login({ state }, payload) {
      payload.master_password = CryptoUtils.sha256Encrypt(payload.master_password)

      const { data } = await AuthService.Login(payload)
      state.transmission_key = data.transmission_key
      state.master_hash = CryptoUtils.pbkdf2Encrypt(data.secret, payload.master_password)
      CryptoUtils.encryptKey = state.master_hash
      CryptoUtils.transmissionKey = state.transmission_key
      state.user = data
      state.pro = state.user.type == 'pro'
      state.authenticated = true

      localStorage.email = payload.email
      localStorage.server = payload.server
      if (process.env.NODE_ENV !== 'production') {
        localStorage.master_hash = state.master_hash
        localStorage.transmission_key = state.transmission_key
      }

    },

    Logout({ state }, payload) {
      const { data } = AuthService.Logout(payload)
      state.transmission_key = null
      state.master_hash = null
      state.user = null
      state.authenticated = false
      state.pro = false
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
