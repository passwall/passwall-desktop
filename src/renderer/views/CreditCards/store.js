import ItemsService from '@/api/services/Items'
import { ItemType, buildEncryptedPayload, decryptItemList } from '@/utils/item-mappers'

const EncryptedFields = [
  'name_on_card',
  'card_number',
  'security_code',
  'exp_month',
  'exp_year',
  'type',
  'number',
  'expiry_date',
  'cardholder_name',
  'verification_number'
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
    async FetchAll({ state, rootState }, query) {
      const { data } = await ItemsService.FetchAll({
        ...query,
        type: ItemType.Card
      })

      const itemList = await decryptItemList(data.items, EncryptedFields, rootState.userKey)
      state.ItemList = itemList
    },

    Delete(_, id) {
      return ItemsService.Delete(id)
    },

    async Create({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Card,
        data,
        EncryptedFields,
        rootState.userKey
      )
      return ItemsService.Create(payload)
    },

    async Update({ rootState }, data) {
      const payload = await buildEncryptedPayload(
        ItemType.Card,
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
