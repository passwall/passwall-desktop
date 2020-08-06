import LoginsService from '@/api/services/Logins'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = ['username', 'password', 'extra']

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
      const { data } = await LoginsService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await LoginsService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail, EncryptedFields)

      state.Detail = detail
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await LoginsService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await LoginsService.Update(data.id, payload)
    }
  }
}
