import LoginsService from '@/api/services/Logins'
import store from '@/store'

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
      const { data } = await LoginsService.FetchAll(query)
      state.ItemList = data
    },

    async Get({ state }, id) {
      const { data } = await LoginsService.Get(id)
      // data.password = this._vm.$helpers.aesDecrypt(data.password)
      state.Detail = this._vm.$helpers.aesDecrypt(data)
    },

    async Delete(_, id) {
      await LoginsService.Delete(id)
    },

    async Create({ rootState }, data) {
      // her modulün kendi statei var abi store/index.js dosyasında en altta modules var orada şuan
      // Logins var mesela ona ulaşmak için Logins/key şeklinde kullanıyorsun yada o modluün içinden direk
      // burda rootstate diyerek ana storedaki bilgilere ulaşabilirsin
      // yada component içinden ulaşmak için mapState kullanabilirsin onun örneğni koyucam logins create syfasına
      // ama onu kullanmıyoruz burda yapman daha doğru burası logic ilerin yeri aslında 
      // ben örnek koyucam inceleyip silersin.
      // burda loginde aldığımız key değeri ile tüm payloadı şfreleyip göndeiroyruz
      // password alaının ayrıca yapmadım eğer yapıcaksan önce onu yapyıp sonra hepsinide yapabilirsin
      //  data.password = this._vm.$helpers.aesDecrypt(data.password)
      const payload = {
        data: this._vm.$helpers.aesEncrypt(data, rootState.secure_key)
      }
      await LoginsService.Create(payload)
    },

    async Update(_, data) {
      // payload.password = this._vm.$helpers.aesEncrypt(payload.password)
      const payload = {
        data: this._vm.$helpers.aesEncrypt(data, rootState.secure_key)
      }
      await LoginsService.Update(data.id, payload)
    }
  }
}
