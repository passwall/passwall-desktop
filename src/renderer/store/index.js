import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import AuthService from '@/api/services/Auth'
import HTTPClient from '@/api/HTTPClient'

import Logins from '@/views/Logins/store'

export default new Vuex.Store({
  state() {
    return {
      access_token: localStorage.access_token,
      refresh_token: localStorage.refresh_token,
      user: {}
    }
  },

  actions: {
    async Login({ state }, payload) {
      const { data } = await AuthService.Login(payload)
      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      localStorage.access_token = data.access_token
      localStorage.refresh_token = data.refresh_token
      state.user = data
      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)
    },

    Logout({ state }) {
      state.access_token = null
      state.refresh_token = null
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  },

  modules: {
    Logins
  }
})
