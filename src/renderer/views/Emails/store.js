import EmailsService from '@/api/services/Emails'

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
      const { data } = await EmailsService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].email     = this._vm.$helpers.decrypt(data[i].email, rootState.master_hash)
        data[i].password  = this._vm.$helpers.decrypt(data[i].password, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await EmailsService.Get(id)
      data.email    = this._vm.$helpers.decrypt(data.email, rootState.master_hash)
      data.password = this._vm.$helpers.decrypt(data.password, rootState.master_hash)
      state.Detail  = data
    },

    async Delete(_, id) {
      await EmailsService.Delete(id)
    },

    async Create({ rootState }, data) {
      console.log(data)
      data.email    = this._vm.$helpers.encrypt(data.email, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      await EmailsService.Create(data)
    },

    async Update({ rootState }, data) {
      data.email    = this._vm.$helpers.encrypt(data.email, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      await EmailsService.Update(data.id, data)
    }
  }
}
