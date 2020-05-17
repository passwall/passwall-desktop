import AuthService from '@/api/services/Auth'

export default {
  namespaced: true,

  actions: {
    async Login({ state }, payload) {
      const { data } = await AuthService.Login(payload)

      state.access_token = data.access_token
      state.refresh_token = data.refresh_token
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
    }
  }
}
