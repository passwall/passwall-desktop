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
        data[i].cardholder_name     = this._vm.$helpers.decrypt(data[i].cardholder_name, rootState.master_hash)
        data[i].type                = this._vm.$helpers.decrypt(data[i].type, rootState.master_hash)
        data[i].number              = this._vm.$helpers.decrypt(data[i].number, rootState.master_hash)
        data[i].expiry_date         = this._vm.$helpers.decrypt(data[i].expiry_date, rootState.master_hash)
        data[i].verification_number = this._vm.$helpers.decrypt(data[i].verification_number, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await CreditCardsService.Get(id)

      data.cardholder_name      = this._vm.$helpers.decrypt(data.cardholder_name, rootState.master_hash)
      data.type                 = this._vm.$helpers.decrypt(data.type, rootState.master_hash)
      data.number               = this._vm.$helpers.decrypt(data.number, rootState.master_hash)
      data.expiry_date          = this._vm.$helpers.decrypt(data.expiry_date, rootState.master_hash)
      data.verification_number  = this._vm.$helpers.decrypt(data.verification_number, rootState.master_hash)

      state.Detail = data
    },

    async Delete(_, id) {
      await CreditCardsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.cardholder_name      = this._vm.$helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type                 = this._vm.$helpers.encrypt(data.type, rootState.master_hash)
      data.number               = this._vm.$helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date          = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number  = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)
      
      await CreditCardsService.Create(data)
    },

    async Update({ rootState }, data) {
      data.cardholder_name      = this._vm.$helpers.encrypt(data.cardholder_name, rootState.master_hash)
      data.type                 = this._vm.$helpers.encrypt(data.type, rootState.master_hash)
      data.number               = this._vm.$helpers.encrypt(data.number, rootState.master_hash)
      data.expiry_date          = this._vm.$helpers.encrypt(data.expiry_date, rootState.master_hash)
      data.verification_number  = this._vm.$helpers.encrypt(data.verification_number, rootState.master_hash)

      await CreditCardsService.Update(data.id, data)
    }
  }
}
