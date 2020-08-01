import Vue from 'vue'
import * as Waiters from '@/utils/waiters'
Vue.prototype.$waiters = Waiters

import * as Helpers from '@/utils/helpers'
Vue.prototype.$helpers = Helpers

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

import VueWait from 'vue-wait'
Vue.use(VueWait)

window.wait = new VueWait({
  registerComponent: false,
  registerDirective: false
})

// Auto register all components
const requireComponent = require.context('./components', true, /\.(vue)$/)
requireComponent.keys().forEach(fileName => {
  const componentConfig = requireComponent(fileName)
  Vue.component(componentConfig.default.name, () =>
    import(`@/components/${fileName.replace('./', '')}`)
  )
})

import Notifications from 'vue-notification'
Vue.use(Notifications, { duration: 4000 })

import i18n from '@/i18n'

Vue.prototype.$request = async (callback, waitKey, errorCallback = null) => {
  try {
    window.wait.start(waitKey)
    await callback()
  } catch (error) {
    console.log(error)
    if (error.response) {
      if (errorCallback) {
        errorCallback(error)
      } else {
        if (error.response.status >= 500) {
          Vue.prototype.$notify({
            type: 'error',
            text: i18n.t('API500ErrorMessage')
          })
        } else if (error.response.data.Message && error.response.status != 401) {
          Vue.prototype.$notify({
            type: 'error',
            text: error.response.data.Message
          })
        }
      }
    } else {
      Vue.prototype.$notify({ type: 'error', text: 'Network Error !' })
    }
  } finally {
    window.wait.end(waitKey)
  }
}
