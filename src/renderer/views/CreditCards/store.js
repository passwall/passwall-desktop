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
      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await CreditCardsService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail, EncryptedFields)

      state.Detail = detail
    },

    async Delete(_, id) {
      await CreditCardsService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await CreditCardsService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await CreditCardsService.Update(data.id, payload)
    }
  }
}
