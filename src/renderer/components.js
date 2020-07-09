import Vue from 'vue'

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VuePerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
Vue.use(VuePerfectScrollbar)

import VeeValidate from 'vee-validate'
Vue.use(VeeValidate, { events: 'input|blur' })

import VueDebounce from 'vue-debounce'
Vue.use(VueDebounce, { defaultTime: '700ms' })

import VTooltip from 'v-tooltip'
Vue.use(VTooltip)

// Auto register all components
const requireComponent = require.context('./components', true, /\.(vue)$/)
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  Vue.component(componentConfig.default.name, () =>
    import(`@/components/${fileName.replace('./', '')}`)
  )
})

import Notifications from 'vue-notification'
Vue.use(Notifications)
