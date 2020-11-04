import NotesService from '@/api/services/Notes'
import CryptoUtils from '@/utils/crypto'

const EncryptedFields = ['note']

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
      const { data } = await NotesService.FetchAll(query)

      const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))

      itemList.forEach(element => {
        CryptoUtils.decryptFields(element, EncryptedFields)  
      });

      state.ItemList = itemList
    },

    async Get({ state }, id) {
      const { data } = await NotesService.Get(id)

      const detail = JSON.parse(CryptoUtils.aesDecrypt(data.data))
      CryptoUtils.decryptFields(detail, EncryptedFields)

      state.Detail = detail
    },

    async Delete(_, id) {
      await NotesService.Delete(id)
    },

    async Create(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await NotesService.Create(payload)
    },

    async Update(_, data) {
      const payload = CryptoUtils.encryptPayload(data, EncryptedFields)
      await NotesService.Update(data.id, payload)
    }
  }
}
