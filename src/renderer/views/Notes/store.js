import NotesService from '@/api/services/Notes'

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
      const { data } = await NotesService.FetchAll(query)

      var dLen, i
      dLen = data.length
      for (i = 0; i < dLen; i++) {
        data[i].note = this._vm.$helpers.decrypt(data[i].note, rootState.master_hash)
      }
      
      state.ItemList = data
    },

    async Get({ state, rootState }, id) {
      const { data } = await NotesService.Get(id)
      data.note = this._vm.$helpers.decrypt(data.note, rootState.master_hash)
      state.Detail = data
    },

    async Delete(_, id) {
      await NotesService.Delete(id)
    },

    async Create({ rootState }, data) {
      data.note = this._vm.$helpers.encrypt(data.note, rootState.master_hash)
      await NotesService.Create(data)
    },

    async Update({ rootState }, data) {
      data.note = this._vm.$helpers.encrypt(data.note, rootState.master_hash)
      await NotesService.Update(data.id, data)
    }
  }
}
