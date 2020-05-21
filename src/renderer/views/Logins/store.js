import LoginsService from '@/api/services/Logins'

export default {
  namespaced: true,

  state() {
    return {
      Query: {},
      ItemList: []
    }
  },

  actions: {
    async FetchAll({ state }) {
      const { data } = await LoginsService.FetchAll(state.query)
      state.ItemList = data
    },

    async Get({ state }, id) {
      const { data } = await LoginsService.Get(id)
    },

    async Delete({ state }, id) {
      const { data } = await LoginsService.Delete(id)
    },

    async Create({ state }, payload) {
      const { data } = await LoginsService.Create(payload)
    },

    async Update({ state }, payload) {
      const { data } = await LoginsService.Create(payload)
    }
  }
}
