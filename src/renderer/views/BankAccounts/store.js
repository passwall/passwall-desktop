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

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));

      var dLen, i
      dLen = dataObj.length
      for (i = 0; i < dLen; i++) {
        dataObj[i].account_name = this._vm.$helpers.decrypt(dataObj[i].account_name, rootState.master_hash)
        dataObj[i].account_number = this._vm.$helpers.decrypt(dataObj[i].account_number, rootState.master_hash)
        dataObj[i].iban = this._vm.$helpers.decrypt(dataObj[i].iban, rootState.master_hash)
        dataObj[i].currency = this._vm.$helpers.decrypt(dataObj[i].currency, rootState.master_hash)
        dataObj[i].password = this._vm.$helpers.decrypt(dataObj[i].password, rootState.master_hash)
      }

      
      state.ItemList = dataObj
    },

    async Get({ state, rootState }, id) {
      const { data } = await BankAccountsService.Get(id)

      // Decrypt payload with transmission key
      const dataObj = JSON.parse(this._vm.$helpers.aesDecrypt(data.data, rootState.transmission_key));
      
      dataObj.account_name = this._vm.$helpers.decrypt(dataObj.account_name, rootState.master_hash) 
      dataObj.account_number = this._vm.$helpers.decrypt(dataObj.account_number, rootState.master_hash) 
      dataObj.iban = this._vm.$helpers.decrypt(dataObj.iban, rootState.master_hash) 
      dataObj.currency = this._vm.$helpers.decrypt(dataObj.currency, rootState.master_hash) 
      dataObj.password = this._vm.$helpers.decrypt(dataObj.password, rootState.master_hash) 

      state.Detail = dataObj
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

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }
      
      await BankAccountsService.Create(payload)
    },

    async Update({ rootState }, data) {
      data.account_name = this._vm.$helpers.encrypt(data.account_name, rootState.master_hash)
      data.account_number = this._vm.$helpers.encrypt(data.account_number, rootState.master_hash)
      data.iban = this._vm.$helpers.encrypt(data.iban, rootState.master_hash)
      data.currency = this._vm.$helpers.encrypt(data.currency, rootState.master_hash)
      data.password = this._vm.$helpers.encrypt(data.password, rootState.master_hash)

      // Encrypt payload with transmission key
      const payload = {
        data: this._vm.$helpers.aesEncrypt(JSON.stringify(data), rootState.transmission_key)
      }

      await BankAccountsService.Update(data.id, payload)
    }
  }
}
