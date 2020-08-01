import EmailsService from '@/api/services/Emails'
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
      const { data } = await EmailsService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].email     = Helpers.decrypt(dataObj[i].email, rootState.master_hash)
      //   dataObj[i].password  = Helpers.decrypt(dataObj[i].password, rootState.master_hash)
      // }
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await EmailsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.email    = Helpers.decrypt(dataObj.email, rootState.master_hash)
      dataObj.password = Helpers.decrypt(dataObj.password, rootState.master_hash)
      
      state.Detail  = dataObj
    },

    async Delete(_, id) {
      await EmailsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.email    = Helpers.encrypt(data.email, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)
      
      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await EmailsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.email    = Helpers.encrypt(data.email, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await EmailsService.Update(data.id, payload)
    }
  }
}
