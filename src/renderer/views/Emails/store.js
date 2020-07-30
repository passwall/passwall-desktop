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

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].email     = this._vm.$helpers.decrypt(dataObj[i].email, rootState.master_hash)
      //   dataObj[i].password  = this._vm.$helpers.decrypt(dataObj[i].password, rootState.master_hash)
      // }
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await EmailsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.email    = this._vm.$helpers.decrypt(dataObj.email, rootState.master_hash)
      dataObj.password = this._vm.$helpers.decrypt(dataObj.password, rootState.master_hash)
      
      state.Detail  = dataObj
    },

    async Delete(_, id) {
      await EmailsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.email    = this._vm.$helpers.encrypt(data.email, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      
      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await EmailsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.email    = this._vm.$helpers.encrypt(data.email, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await EmailsService.Update(data.id, payload)
    }
  }
}
