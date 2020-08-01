import BankAccountsService from '@/api/services/BankAccounts'
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
      const { data } = await BankAccountsService.FetchAll(query)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      // var dLen, i
      // dLen = dataObj.length
      // for (i = 0; i < dLen; i++) {
      //   dataObj[i].account_name = Helpers.decrypt(dataObj[i].account_name, rootState.master_hash)
      //   dataObj[i].account_number = Helpers.decrypt(dataObj[i].account_number, rootState.master_hash)
      //   dataObj[i].iban = Helpers.decrypt(dataObj[i].iban, rootState.master_hash)
      //   dataObj[i].currency = Helpers.decrypt(dataObj[i].currency, rootState.master_hash)
      //   dataObj[i].password = Helpers.decrypt(dataObj[i].password, rootState.master_hash)
      // }

      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await BankAccountsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(Helpers.aesDecrypt(data.data, rootState.transmission_key))

      dataObj.account_name = Helpers.decrypt(dataObj.account_name, rootState.master_hash)
      dataObj.account_number = Helpers.decrypt(dataObj.account_number, rootState.master_hash)
      dataObj.iban = Helpers.decrypt(dataObj.iban, rootState.master_hash)
      dataObj.currency = Helpers.decrypt(dataObj.currency, rootState.master_hash)
      dataObj.password = Helpers.decrypt(dataObj.password, rootState.master_hash)

      state.Detail = dataObj
    },

    async Delete(_, id) {
      await BankAccountsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.account_name = Helpers.encrypt(data.account_name, rootState.master_hash)
      data.account_number = Helpers.encrypt(data.account_number, rootState.master_hash)
      data.iban = Helpers.encrypt(data.iban, rootState.master_hash)
      data.currency = Helpers.encrypt(data.currency, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await BankAccountsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.account_name = Helpers.encrypt(data.account_name, rootState.master_hash)
      data.account_number = Helpers.encrypt(data.account_number, rootState.master_hash)
      data.iban = Helpers.encrypt(data.iban, rootState.master_hash)
      data.currency = Helpers.encrypt(data.currency, rootState.master_hash)
      data.password = Helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: Helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await BankAccountsService.Update(data.id, payload)
    }
  }
}
