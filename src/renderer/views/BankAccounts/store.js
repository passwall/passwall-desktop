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

      itemList.forEach(element => {
        CryptoUtils.decryptFields(element, EncryptedFields)
      })

      state.ItemList = itemList
    },

    Delete(_, id) {
      return BankAccountsService.Delete(id)
    },

    Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return BankAccountsService.Create(payload)
    },

    Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return BankAccountsService.Update(data.id, payload)
    }
  }
}
