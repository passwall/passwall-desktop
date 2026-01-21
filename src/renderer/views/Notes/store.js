import ItemsService from '@/api/services/Items'
import { ItemType, buildEncryptedPayload, decryptItemList } from '@/utils/item-mappers'

const EncryptedFields = ['notes', 'note']

export default {
  namespaced: true,

  state() {
    return {
      ItemList: [],
      Detail: {}
    }
  },

  actions: {
    async FetchAll({ state, rootState }, query) {
      const { data } = await ItemsService.FetchAll({
        ...query,
        type: ItemType.Note
      })

      const itemList = await decryptItemList(data.items, EncryptedFields, rootState.userKey)
      state.ItemList = itemList
    },

    Delete(_, id) {
      return ItemsService.Delete(id)
    },

    async Create({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Note,
        data,
        EncryptedFields,
        rootState.userKey
      )
      return ItemsService.Create(payload)
    },

    async Update({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Note,
        data,
        EncryptedFields,
        rootState.userKey
      )
      return ItemsService.Update(data.id, {
        data: payload.data,
        metadata: payload.metadata,
        item_key_enc: payload.item_key_enc
      })
    }
  }
}
