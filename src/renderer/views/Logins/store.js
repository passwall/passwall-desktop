import LoginsService from '@/api/services/Logins'
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
      const { data } = await LoginsService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      // We don't need to decrypt encrypted fields in FetchAll
      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].username = Helpers.decrypt(dataObj[i].username, rootState.master_hash)
      //   dataObj[i].password = Helpers.decrypt(dataObj[i].password, rootState.master_hash)
      // }

      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await LoginsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      dataObj.username = Helpers.decrypt(dataObj.username, rootState.master_hash)
      dataObj.password = Helpers.decrypt(dataObj.password, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.username = Helpers.encrypt(data.username, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await LoginsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.username = Helpers.encrypt(data.username, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await LoginsService.Update(data.id, payload)
    }
  }
}
