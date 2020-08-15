import BankAccountsService from '@/api/services/BankAccounts'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = ['account_name', 'account_number', 'iban', 'currency', 'password']

export default {
  namespaced: true,

  state() {
    return {
      ItemList: [],
      Detail: {}
    }
  },

  actions: {
    async FetchAll({ state }, query) {
      const { data } = await BankAccountsService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await BankAccountsService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail, EncryptedFields)

      state.Detail = detail
    },

    async Delete(_, id) {
      await BankAccountsService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await BankAccountsService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await BankAccountsService.Update(data.id, payload)
    }
  }
}
