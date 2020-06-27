import BankAccountsService from '@/api/services/BankAccounts'

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
      const { data } = await BankAccountsService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].account_name = this._vm.$helpers.decrypt(data[i].account_name, rootState.master_hash)
        data[i].account_number = this._vm.$helpers.decrypt(data[i].account_number, rootState.master_hash)
        data[i].iban = this._vm.$helpers.decrypt(data[i].iban, rootState.master_hash)
        data[i].currency = this._vm.$helpers.decrypt(data[i].currency, rootState.master_hash)
        data[i].password = this._vm.$helpers.decrypt(data[i].password, rootState.master_hash)
      }

      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await BankAccountsService.Get(id)
      
      data.account_name = this._vm.$helpers.decrypt(data.account_name, rootState.master_hash) 
      data.account_number = this._vm.$helpers.decrypt(data.account_number, rootState.master_hash) 
      data.iban = this._vm.$helpers.decrypt(data.iban, rootState.master_hash) 
      data.currency = this._vm.$helpers.decrypt(data.currency, rootState.master_hash) 
      data.password = this._vm.$helpers.decrypt(data.password, rootState.master_hash) 

      state.Detail = data
    },

    async Delete(_, id) {
      await BankAccountsService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.account_name = this._vm.$helpers.encrypt(data.account_name, rootState.master_hash)
      data.account_number = this._vm.$helpers.encrypt(data.account_number, rootState.master_hash)
      data.iban = this._vm.$helpers.encrypt(data.iban, rootState.master_hash)
      data.currency = this._vm.$helpers.encrypt(data.currency, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)
      
      await BankAccountsService.Create(data)
    },

    async Update({ rootState }, data) {
      data.account_name = this._vm.$helpers.encrypt(data.account_name, rootState.master_hash)
      data.account_number = this._vm.$helpers.encrypt(data.account_number, rootState.master_hash)
      data.iban = this._vm.$helpers.encrypt(data.iban, rootState.master_hash)
      data.currency = this._vm.$helpers.encrypt(data.currency, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      await BankAccountsService.Update(data.id, data)
    }
  }
}
