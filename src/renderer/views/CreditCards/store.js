import CreditCardsService from '@/api/services/CreditCards'

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
      const { data } = await CreditCardsService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      var dLen, i
      dLen = dataObj.length
      for (i = 0; i < dLen; i++) {
        dataObj[i].cardholder_name     = this._vm.$helpers.decrypt(dataObj[i].cardholder_name, rootState.master_hash)
        dataObj[i].type                = this._vm.$helpers.decrypt(dataObj[i].type, rootState.master_hash)
        dataObj[i].number              = this._vm.$helpers.decrypt(dataObj[i].number, rootState.master_hash)
        dataObj[i].expiry_date         = this._vm.$helpers.decrypt(dataObj[i].expiry_date, rootState.master_hash)
        dataObj[i].verification_number = this._vm.$helpers.decrypt(dataObj[i].verification_number, rootState.master_hash)
      }
      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await CreditCardsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      dataObj.cardholder_name      = this._vm.$helpers.decrypt(dataObj.cardholder_name, rootState.master_hash)
      dataObj.type                 = this._vm.$helpers.decrypt(dataObj.type, rootState.master_hash)
      dataObj.number               = this._vm.$helpers.decrypt(dataObj.number, rootState.master_hash)
      dataObj.expiry_date          = this._vm.$helpers.decrypt(dataObj.expiry_date, rootState.master_hash)
      dataObj.verification_number  = this._vm.$helpers.decrypt(dataObj.verification_number, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await CreditCardsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.cardholder_name      = this._vm.$helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type                 = this._vm.$helpers.encrypt(data.type, rootState.master_hash)
      data.number               = this._vm.$helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date          = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number  = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }
      
      await CreditCardsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.cardholder_name      = this._vm.$helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type                 = this._vm.$helpers.encrypt(data.type, rootState.master_hash)
      data.number               = this._vm.$helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date          = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number  = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await CreditCardsService.Update(data.id, payload)
    }
  }
}
