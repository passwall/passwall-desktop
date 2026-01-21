import ItemsService from '@/api/services/Items'
import { ItemType, buildEncryptedPayload, decryptItemList } from '@/utils/item-mappers'

const EncryptedFields = ['username', 'password', 'notes', 'totp_secret', 'note']

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
        type: ItemType.Password
      })

      const itemList = await decryptItemList(data.items, EncryptedFields, rootState.userKey)
      state.ItemList = itemList
    },

    Delete(_, id) {
      return ItemsService.Delete(id)
    },

    async Create({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Password,
        data,
        EncryptedFields,
        rootState.userKey
      )
      return ItemsService.Create(payload)
    },

    async Update({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Password,
        data,
        EncryptedFields,
        rootState.userKey
      )
      return ItemsService.Update(data.id, {
        data: payload.data,
        metadata: payload.metadata,
        item_key_enc: payload.item_key_enc,
        folder_id: payload.folder_id,
        is_favorite: payload.is_favorite,
        auto_fill: payload.auto_fill,
        auto_login: payload.auto_login,
        reprompt: payload.reprompt
      })
    }
  }
}
