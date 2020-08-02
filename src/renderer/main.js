import Vue from 'vue'
import HTTPClient from '@/api/HTTPClient'
import AuthService from '@/api/services/Auth'

import '@/styles/app.scss'
import '@/config'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

const AuthCheck = async () => {
  const goToLogin = async () => {
    localStorage.clear()
    store.state.access_token = null
    store.state.refresh_token = null
    await router.push({ name: 'Login' })
  }

  try {
    if (store.state.access_token) {
      HTTPClient.setHeader('Authorization', `Bearer ${store.state.access_token}`)

      try {
        const { data } = await AuthService.Check()
        store.state.user = data
      } catch (error) {
        console.log('Auth Check error: ', error)

        try {
          const { data } = await AuthService.Refresh({
            refresh_token: store.state.refresh_token
          })
          store.state.user = data
          store.state.access_token = data.access_token
          store.state.refresh_token = data.refresh_token
        } catch (error) {
          console.log('Auth Refresh error: ', error)
          await goToLogin()
        }
      }
    }
  } catch (error) {
    await goToLogin()
  }
}

;(async () => {
  if (process.env.NODE_ENV === 'production') {
    localStorage.clear()
  } else {
    await AuthCheck()
  }

  setInterval(AuthCheck, 60e3)

  Vue.config.productionTip = false
  /* eslint-disable no-new */
  window.vm = new Vue({
    router,
    store,
    i18n,
    wait: window.wait,
    render: h => h(App)
  }).$mount('#app')
})()
