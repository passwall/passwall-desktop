import Vue from 'vue'

import {
  LogoutIcon,
  StarIcon,
  LockClosedIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  UserIcon,
  TrashIcon,
  ExternalLinkIcon,
  CheveronRightIcon
} from '@vue-hero-icons/solid'
Vue.component(LogoutIcon.name, LogoutIcon)
Vue.component(StarIcon.name, StarIcon)
Vue.component(LockClosedIcon.name, LockClosedIcon)
Vue.component(ClipboardCheckIcon.name, ClipboardCheckIcon)
Vue.component(CreditCardIcon.name, CreditCardIcon)
Vue.component(UserIcon.name, UserIcon)
Vue.component(TrashIcon.name, TrashIcon)
Vue.component(ExternalLinkIcon.name, ExternalLinkIcon)
Vue.component(CheveronRightIcon.name, CheveronRightIcon)

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VuePerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
Vue.use(VuePerfectScrollbar)

import VeeValidate from 'vee-validate'
Vue.use(VeeValidate, { events: 'input|blur' })

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
