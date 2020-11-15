import CreditCardsService from '@/api/services/CreditCards'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = ['type', 'number', 'expiry_date', 'cardholder_name', 'verification_number']

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
      const { data } = await CreditCardsService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))

      itemList.forEach(element => {
        CryptoUtils.decryptFields(element, EncryptedFields)
      })

      state.ItemList = itemList
    },

    Delete(_, id) {
      return CreditCardsService.Delete(id)
    },

    Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return CreditCardsService.Create(payload)
    },

    Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return CreditCardsService.Update(data.id, payload)
    }
  }
}
