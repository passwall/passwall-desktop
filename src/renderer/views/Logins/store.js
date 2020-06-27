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
    async FetchAll({ state, rootState }, query) {
      const { data } = await LoginsService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].username = this._vm.$helpers.decrypt(data[i].username, rootState.master_hash)
        data[i].password = this._vm.$helpers.decrypt(data[i].password, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await LoginsService.Get(id)

      data.username = this._vm.$helpers.decrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.decrypt(data.password, rootState.master_hash)

      state.Detail = data
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      
      // TODO: Encrypt payload with transmission key
      // const payload = {
      //   data: this._vm.$helpers.aesEncrypt(data, rootState.transmission_key)
      // }
      await LoginsService.Create(data)
    },

    async Update({ rootState }, data) {
      
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      await LoginsService.Update(data.id, data)
    }
  }
}
