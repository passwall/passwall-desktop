import EmailsService from '@/api/services/Emails'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = ['email', 'password']

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
      const { data } = await EmailsService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))

      itemList.forEach(element => {
        CryptoUtils.decryptFields(element, EncryptedFields)
      })

      state.ItemList = itemList
    },

    Delete(_, id) {
      return EmailsService.Delete(id)
    },

    Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return EmailsService.Create(payload)
    },

    Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return EmailsService.Update(data.id, payload)
    }
  }
}
