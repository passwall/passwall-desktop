import CreditCardsService from '@/api/services/CreditCards'

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
      const { data } = await CreditCardsService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].expiry_date         = this._vm.$helpers.decrypt(data[i].expiry_date, rootState.master_hash)
        data[i].verification_number = this._vm.$helpers.decrypt(data[i].verification_number, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await CreditCardsService.Get(id)

      data.expiry_date         = this._vm.$helpers.decrypt(data.expiry_date, rootState.master_hash)
      data.verification_number = this._vm.$helpers.decrypt(data.verification_number, rootState.master_hash)

      state.Detail = data
    },

    async Delete(_, id) {
      await CreditCardsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.expiry_date         = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)
      
      await CreditCardsService.Create(data)
    },

    async Update({ rootState }, data) {
      data.expiry_date         = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)

      await CreditCardsService.Update(data.id, data)
    }
  }
}
