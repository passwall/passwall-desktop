import LoginsService from '@/api/services/Logins'

export default {
  namespaced: true,

  state() {
    return {
      ItemList: [],
      Detail: {}
    }
  },

  actions: {
    async FetchAll({ state }, query) {
      const { data } = await LoginsService.FetchAll(query)
      state.ItemList = data
    },

    async Get({ state }, id) {
      const { data } = await LoginsService.Get(id)
      state.Detail = data
    },

    async Delete({ state }, id) {
      await LoginsService.Delete(id)
    },

    async Create({ state }, payload) {
      await LoginsService.Create(payload)
    },

    async Update({ state }, payload) {
      await LoginsService.Update(payload.id, payload)
    }
  }
}
