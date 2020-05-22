import AuthService from '@/api/services/Auth'
import HTTPClient from '@/api/HTTPClient'

export default {
  namespaced: true,

  actions: {
    async Login({ state }, payload) {
      const { data } = await AuthService.Login(payload)
      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      state.user = data || {}
      localStorage.access_token = data.access_token
      localStorage.refresh_token = data.refresh_token
      HTTPClient.setHeader('Authorization', `Bearer ${state.access_token}`)
    },

    Logout({ state }) {
      state.access_token = null
      state.refresh_token = null
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
}
