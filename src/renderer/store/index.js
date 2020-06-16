import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import AuthService from '@/api/services/Auth'
import HTTPClient from '@/api/HTTPClient'

import Logins from '@/views/Logins/store'
import CreditCards from '@/views/CreditCards/store'
import BankAccounts from '@/views/BankAccounts/store'

export default new Vuex.Store({
  state() {
    return {
      access_token: localStorage.access_token,
      refresh_token: localStorage.refresh_token,
      transmission_key: '',
      master_hash: '',
      user: {}
    }
  },

  actions: {
    async Login({ state }, payload) {
      console.log(this._vm.$helpers.hmac("erhan", "R7T6LABSNX8AYk7pNsP7123456789012"))
      

      var master_password = payload.master_password
      
      payload.master_password = this._vm.$helpers.sha256Encrypt(payload.master_password)
    
      const { data } = await AuthService.Login(payload)

      state.master_hash      = this._vm.$helpers.pbkdf2Encrypt(master_password, data.secret)
      state.access_token     = data.access_token
      state.refresh_token    = data.refresh_token
      state.transmission_key = data.transmission_key.substr(0, 32)
      state.user             = data

      localStorage.access_token  = data.access_token
      localStorage.refresh_token = data.refresh_token
    
      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)
    },

    Logout({ state }) {
      state.access_token = null
      state.refresh_token = null
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('transmission_key')
    }
  },

  modules: {
    Logins,
    CreditCards,
    BankAccounts
  }
})
