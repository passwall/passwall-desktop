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
      });

      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await EmailsService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail, EncryptedFields)

      state.Detail = detail
    },

    async Delete(_, id) {
      await EmailsService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await EmailsService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await EmailsService.Update(data.id, payload)
    }
  }
}
