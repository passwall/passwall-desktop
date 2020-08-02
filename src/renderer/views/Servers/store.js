import ServersService from '@/api/services/Servers'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = [
  'ip',
  'username',
  'password',
  'hosting_username',
  'hosting_password',
  'admin_username',
  'admin_password'
]

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
      const { data } = await ServersService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await ServersService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail)

      state.Detail = detail
    },

    async Delete(_, id) {
      await ServersService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await ServersService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await ServersService.Update(data.id, payload)
    }
  }
}
