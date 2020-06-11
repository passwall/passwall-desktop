import LoginsService from '@/api/services/Logins'
import store from '@/store'

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
      data.password = this._vm.$helpers.aesDecrypt(data.password)
      state.Detail = data
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create(_, payload) {
      payload.password = this._vm.$helpers.aesEncrypt(payload.password, state.user.secure_key)
      await LoginsService.Create(payload)
    },

    async Update(_, payload) {
      payload.password = this._vm.$helpers.aesEncrypt(payload.password)
      await LoginsService.Update(payload.id, payload)
    }
  }
}
