import Vue from 'vue'
import AuthService from '@/api/services/Auth'
import HTTPClient from '@/api/HTTPClient'

import '@/styles/app.scss'
import '@/components'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

import {
  LogoutIcon,
  StarIcon,
  LockClosedIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  UserIcon,
  TrashIcon,
  ExternalLinkIcon
} from '@vue-hero-icons/solid'
Vue.component(LogoutIcon.name, LogoutIcon)
Vue.component(StarIcon.name, StarIcon)
Vue.component(LockClosedIcon.name, LockClosedIcon)
Vue.component(ClipboardCheckIcon.name, ClipboardCheckIcon)
Vue.component(CreditCardIcon.name, CreditCardIcon)
Vue.component(UserIcon.name, UserIcon)
Vue.component(TrashIcon.name, TrashIcon)
Vue.component(ExternalLinkIcon.name, ExternalLinkIcon)

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VeeValidate from 'vee-validate'
Vue.use(VeeValidate, { events: 'input|blur' })

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

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
