import LoginsService from '@/api/services/Logins'
import CryptoJS from 'crypto-js'

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

      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));
      console.log(dataObj.title)

      dataObj.username = this._vm.$helpers.decrypt(dataObj.username, rootState.master_hash)
      dataObj.password = this._vm.$helpers.decrypt(dataObj.password, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      
      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }
      await LoginsService.Create(payload)
    },

    async Update({ rootState }, data) {
      
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      await LoginsService.Update(data.id, data)
    }
  }
}
