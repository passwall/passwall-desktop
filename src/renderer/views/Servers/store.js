import ServersService from '@/api/services/Servers'
import * as Helpers from '@/utils/helpers'

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
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      /* var dLen, i
      dLen = dataObj.length
      for (i = 0; i < dLen; i++) {
        dataObj[i].ip = Helpers.decrypt(dataObj[i].ip, rootState.master_hash)
        dataObj[i].username = Helpers.decrypt(dataObj[i].username, rootState.master_hash)
        dataObj[i].password = Helpers.decrypt(dataObj[i].password, rootState.master_hash)
        dataObj[i].hosting_username = Helpers.decrypt(dataObj[i].hosting_username, rootState.master_hash)
        dataObj[i].hosting_password = Helpers.decrypt(dataObj[i].hosting_password, rootState.master_hash)
        dataObj[i].admin_username = Helpers.decrypt(dataObj[i].admin_username, rootState.master_hash)
        dataObj[i].admin_password = Helpers.decrypt(dataObj[i].admin_password, rootState.master_hash)
      } */
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await ServersService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.ip               = Helpers.decrypt(dataObj.ip, rootState.master_hash)
      dataObj.username         = Helpers.decrypt(dataObj.username, rootState.master_hash)
      dataObj.password         = Helpers.decrypt(dataObj.password, rootState.master_hash)
      dataObj.hosting_username = Helpers.decrypt(dataObj.hosting_username, rootState.master_hash)
      dataObj.hosting_password = Helpers.decrypt(dataObj.hosting_password, rootState.master_hash)
      dataObj.admin_username   = Helpers.decrypt(dataObj.admin_username, rootState.master_hash)
      dataObj.admin_password   = Helpers.decrypt(dataObj.admin_password, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await ServersService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.ip               = Helpers.encrypt(data.ip, rootState.master_hash)
      data.username         = Helpers.encrypt(data.username, rootState.master_hash)
      data.password         = Helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_username = Helpers.encrypt(data.hosting_username, rootState.master_hash)
      data.hosting_password = Helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_username   = Helpers.encrypt(data.admin_username, rootState.master_hash)
      data.admin_password   = Helpers.encrypt(data.admin_password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await ServersService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.ip               = Helpers.encrypt(data.ip, rootState.master_hash)
      data.username         = Helpers.encrypt(data.username, rootState.master_hash)
      data.password         = Helpers.encrypt(data.password, rootState.master_hash)
      data.hosting_username = Helpers.encrypt(data.hosting_username, rootState.master_hash)
      data.hosting_password = Helpers.encrypt(data.hosting_password, rootState.master_hash)
      data.admin_username   = Helpers.encrypt(data.admin_username, rootState.master_hash)
      data.admin_password   = Helpers.encrypt(data.admin_password, rootState.master_hash)
      
      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await ServersService.Update(data.id, payload)
    }
  }
}
