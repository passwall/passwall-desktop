import Vue from 'vue'
import Axios from 'axios'

import '@/styles/app.scss'
import '@/components'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VeeValidate from 'vee-validate'
Vue.use(VeeValidate, { events: 'input|blur' })

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

Vue.config.productionTip = false

const AuthCheck = async () => {
  const goToLogin = async () => {
    localStorage.removeItem('token')
    await router.push({ name: 'Login' })
  }

  try {
    const token = localStorage.getItem('token')
    if (token) {
      Axios.defaults.headers.common.Authorization = `Bearer ${token}`

      try {
        await Axios.post('auth/check')
      } catch (error) {
        try {
          const { data } = await Axios.post('auth/refresh')
          localStorage.setItem('token', data.token)
        } catch (error) {
          await goToLogin()
        }
      }
    }
  } catch (error) {
    await goToLogin()
  }
}

;(async () => {
  // await AuthCheck()
  // setInterval(AuthCheck, 30e3)

  /* eslint-disable no-new */
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')
})()
