import ServersService from '@/api/services/Servers'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = [
  'ip',
  'username',
  'password',
  'hosting_username',
  'hosting_password',
  'admin_username',
  'admin_password',
  'extra'
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

      itemList.forEach(element => {
        CryptoUtils.decryptFields(element, EncryptedFields)
      })

      state.ItemList = itemList
    },

    Delete(_, id) {
      return ServersService.Delete(id)
    },

    Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return ServersService.Create(payload)
    },

    Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      return ServersService.Update(data.id, payload)
    }
  }
}
