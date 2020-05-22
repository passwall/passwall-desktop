import Vue from 'vue'
import HTTPClient from '@/api/HTTPClient'
import AuthService from '@/api/services/Auth'

import '@/styles/app.scss'
import '@/components'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

Vue.config.productionTip = false

const AuthCheck = async () => {
  const goToLogin = async () => {
    localStorage.removeItem('access_token')
    store.state.access_token = null
    store.state.refresh_token = null
    await router.push({ name: 'Login' })
  }

  try {
    if (store.state.access_token) {
      HTTPClient.setHeader('Authorization', `Bearer ${store.state.access_token}`)

      try {
        const { data } = await AuthService.Check()
        store.state.user =  {}
        store.state.access_token = data.access_token
        store.state.refresh_token = data.refresh_token
      } catch (error) {
        console.log(error)
        await goToLogin()
      }

      localStorage.setItem('access_token', store.state.access_token)
      localStorage.setItem('refresh_token', store.state.refresh_token)
    }
  } catch (error) {
    await goToLogin()
  }
}

;(async () => {
  await AuthCheck()
  setInterval(AuthCheck, 60e3)

  /* eslint-disable no-new */
  window.vm = new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')
})()
