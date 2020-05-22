import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import Auth from '@/views/Auth/store'
import Logins from '@/views/Logins/store'

export default new Vuex.Store({
  state() {
    return {
      access_token: localStorage.access_token,
      refresh_token: localStorage.refresh_token,
      user: {}
    }
  },

  modules: {
    Auth,
    Logins
  }
})
