import Vue from 'vue'

import '@/styles/app.scss'
import '@/components'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

import VeeValidate from 'vee-validate'
Vue.use(VeeValidate, {
  events: 'input|blur'
})

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
