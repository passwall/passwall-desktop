import NotesService from '@/api/services/Notes'
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
      const { data } = await NotesService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].note = Helpers.decrypt(dataObj[i].note, rootState.master_hash)
      // }
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await NotesService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.note = Helpers.decrypt(dataObj.note, rootState.master_hash)
      state.Detail = dataObj
    },

    async Delete(_, id) {
      await NotesService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.note = Helpers.encrypt(data.note, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await NotesService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.note = Helpers.encrypt(data.note, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await NotesService.Update(data.id, payload)
    }
  }
}
