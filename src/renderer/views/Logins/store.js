import LoginsService from '@/api/services/Logins'
import store from '@/store'

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
        data[i].url      = this._vm.$helpers.decrypt(data[i].url,      rootState.master_hash)
        data[i].username = this._vm.$helpers.decrypt(data[i].username, rootState.master_hash)
        data[i].password = this._vm.$helpers.decrypt(data[i].password, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await LoginsService.Get(id)

      data.url      = this._vm.$helpers.decrypt(data.url,      rootState.master_hash)
      data.username = this._vm.$helpers.decrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.decrypt(data.password, rootState.master_hash)

      // state.Detail = this._vm.$helpers.aesDecrypt(data)
      state.Detail = data
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create({ rootState }, data) {
      // console.log("Raw: "+ data.url)
      // console.log("MasterHash: "+ rootState.master_hash)
      // data.url      = this._vm.$helpers.encrypt(data.url, rootState.master_hash)
      // console.log("Encrypted: "+ data.url)
      // var sonuc = this._vm.$helpers.decrypt(data.url, rootState.master_hash)
      // console.log("Decrypted: "+ this._vm.$helpers.encToString(sonuc))
      
      data.url      = this._vm.$helpers.encrypt(data.url,      rootState.master_hash)
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      
      // const payload = {
      //   data: this._vm.$helpers.aesEncrypt(data, rootState.transmission_key)
      // }
      await LoginsService.Create(data)
    },

    async Update({ rootState }, data) {
      // payload.password = this._vm.$helpers.aesEncrypt(payload.password)

      data.url      = this._vm.$helpers.encrypt(data.url,      rootState.master_hash)
      data.username = this._vm.$helpers.encrypt(data.username, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      // const payload = {
      //   data: this._vm.$helpers.aesEncrypt(data, rootState.transmission_key)
      // }
      await LoginsService.Update(data.id, data)
    }
  }
}
