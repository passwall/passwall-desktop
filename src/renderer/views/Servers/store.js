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

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      /* var dLen, i
      dLen = dataObj.length
      for (i = 0; i < dLen; i++) {
        dataObj[i].ip = this._vm.$helpers.decrypt(dataObj[i].ip, rootState.master_hash)
        dataObj[i].username = this._vm.$helpers.decrypt(dataObj[i].username, rootState.master_hash)
        dataObj[i].password = this._vm.$helpers.decrypt(dataObj[i].password, rootState.master_hash)
        dataObj[i].hosting_username = this._vm.$helpers.decrypt(dataObj[i].hosting_username, rootState.master_hash)
        dataObj[i].hosting_password = this._vm.$helpers.decrypt(dataObj[i].hosting_password, rootState.master_hash)
        dataObj[i].admin_username = this._vm.$helpers.decrypt(dataObj[i].admin_username, rootState.master_hash)
        dataObj[i].admin_password = this._vm.$helpers.decrypt(dataObj[i].admin_password, rootState.master_hash)
      } */
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await ServersService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.ip               = this._vm.$helpers.decrypt(dataObj.ip, rootState.master_hash)
      dataObj.username         = this._vm.$helpers.decrypt(dataObj.username, rootState.master_hash)
      dataObj.password         = this._vm.$helpers.decrypt(dataObj.password, rootState.master_hash)
      dataObj.hosting_username = this._vm.$helpers.decrypt(dataObj.hosting_username, rootState.master_hash)
      dataObj.hosting_password = this._vm.$helpers.decrypt(dataObj.hosting_password, rootState.master_hash)
      dataObj.admin_username   = this._vm.$helpers.decrypt(dataObj.admin_username, rootState.master_hash)
      dataObj.admin_password   = this._vm.$helpers.decrypt(dataObj.admin_password, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await ServersService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.ip               = this._vm.$helpers.encrypt(data.ip, rootState.master_hash)
      data.username         = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password         = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_username = this._vm.$helpers.encrypt(data.hosting_username, rootState.master_hash)
      data.hosting_password = this._vm.$helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_username   = this._vm.$helpers.encrypt(data.admin_username, rootState.master_hash)
      data.admin_password   = this._vm.$helpers.encrypt(data.admin_password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await ServersService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.ip               = this._vm.$helpers.encrypt(data.ip, rootState.master_hash)
      data.username         = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password         = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_username = this._vm.$helpers.encrypt(data.hosting_username, rootState.master_hash)
      data.hosting_password = this._vm.$helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_username   = this._vm.$helpers.encrypt(data.admin_username, rootState.master_hash)
      data.admin_password   = this._vm.$helpers.encrypt(data.admin_password, rootState.master_hash)
      
      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await ServersService.Update(data.id, payload)
    }
  }
}
