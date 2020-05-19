import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import Auth from '@/views/Auth/store'

export default new Vuex.Store({
  state() {
    return {
      access_token: localStorage.getItem('access_token'),
      refresh_token: localStorage.getItem('refresh_token'),
      user: {}
    }
  },

  actions: {},

  modules: {
    Auth
  }
})
