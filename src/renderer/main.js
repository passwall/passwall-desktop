import Vue from 'vue'

import './styles/app.scss'
import './config'
import App from './App'
import router from './router'
import store from './store'
import i18n from './i18n'

localStorage.clear()
Vue.config.productionTip = false

/* eslint-disable no-new */
window.vm = new Vue({
  router,
  store,
  i18n,
  wait: window.wait,
  render: h => h(App)
}).$mount('#app')
