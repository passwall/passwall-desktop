import NotesService from '@/api/services/Notes'

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
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].note = this._vm.$helpers.decrypt(dataObj[i].note, rootState.master_hash)
      // }
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await NotesService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.note = this._vm.$helpers.decrypt(dataObj.note, rootState.master_hash)
      state.Detail = dataObj
    },

    async Delete(_, id) {
      await NotesService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.note = this._vm.$helpers.encrypt(data.note, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await NotesService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.note = this._vm.$helpers.encrypt(data.note, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await NotesService.Update(data.id, payload)
    }
  }
}
