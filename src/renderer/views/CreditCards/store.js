import CreditCardsService from '@/api/services/CreditCards'
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
      const { data } = await CreditCardsService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].cardholder_name     = Helpers.decrypt(dataObj[i].cardholder_name, rootState.master_hash)
      //   dataObj[i].type                = Helpers.decrypt(dataObj[i].type, rootState.master_hash)
      //   dataObj[i].number              = Helpers.decrypt(dataObj[i].number, rootState.master_hash)
      //   dataObj[i].expiry_date         = Helpers.decrypt(dataObj[i].expiry_date, rootState.master_hash)
      //   dataObj[i].verification_number = Helpers.decrypt(dataObj[i].verification_number, rootState.master_hash)
      // }

      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await CreditCardsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      dataObj.cardholder_name = Helpers.decrypt(dataObj.cardholder_name, rootState.master_hash)
      dataObj.type = Helpers.decrypt(dataObj.type, rootState.master_hash)
      dataObj.number = Helpers.decrypt(dataObj.number, rootState.master_hash)
      dataObj.expiry_date = Helpers.decrypt(dataObj.expiry_date, rootState.master_hash)
      dataObj.verification_number = Helpers.decrypt(
        dataObj.verification_number,
        rootState.master_hash
      )

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await CreditCardsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.cardholder_name = Helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type = Helpers.encrypt(data.type, rootState.master_hash)
      data.number = Helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date = Helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number = Helpers.encrypt(data.verification_number, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await CreditCardsService.Create(payload)
    },

    async Update({ rootState }, data) {
      // Helpers.encryptFields(data, rootState.master_hash)
      data.cardholder_name = Helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type = Helpers.encrypt(data.type, rootState.master_hash)
      data.number = Helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date = Helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number = Helpers.encrypt(data.verification_number, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await CreditCardsService.Update(data.id, payload)
    }
  }
}
