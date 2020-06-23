import ServersService from '@/api/services/Servers'

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
      const { data } = await ServersService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].password = this._vm.$helpers.decrypt(data[i].password, rootState.master_hash)
        data[i].hosting_password = this._vm.$helpers.decrypt(data[i].hosting_password, rootState.master_hash)
        data[i].admin_password = this._vm.$helpers.decrypt(data[i].admin_password, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await ServersService.Get(id)
      data.password = this._vm.$helpers.decrypt(data.password, rootState.master_hash)
      data.hosting_password = this._vm.$helpers.decrypt(data.hosting_password, rootState.master_hash)
      data.admin_password = this._vm.$helpers.decrypt(data.admin_password, rootState.master_hash)
      state.Detail = data
    },

    async Delete(_, id) {
      await ServersService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_password = this._vm.$helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_password = this._vm.$helpers.encrypt(data.admin_password, rootState.master_hash)
      await ServersService.Create(data)
    },

    async Update({ rootState }, data) {
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_password = this._vm.$helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_password = this._vm.$helpers.encrypt(data.admin_password, rootState.master_hash)
      await ServersService.Update(data.id, data)
    }
  }
}
