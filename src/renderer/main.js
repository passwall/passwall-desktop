import Vue from 'vue'
import AuthService from '@/api/services/Auth'
import HTTPClient from '@/api/HTTPClient'

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
        await AuthService.Check()
      } catch (error) {
        try {
          const { data } = await AuthService.Refresh({
            refresh_token: store.state.refresh_token
          })

          store.state.access_token = data.access_token
          store.state.refresh_token = data.refresh_token
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
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
  await AuthCheck()
  setInterval(AuthCheck, 30e3)

  /* eslint-disable no-new */
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')
})()
