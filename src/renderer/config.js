import { reactive } from 'vue'
import i18n from '@/i18n'
import store from '@/store'
import router from '@/router'
import * as Waiters from '@/utils/waiters'
import * as Contant from '@/utils/constant'
import { createValidator } from '@/plugins/validator'
import { notificationState, notify } from '@/plugins/notifications'

const waitState = reactive({})

const wait = {
  start(key) {
    waitState[key] = true
  },
  end(key) {
    waitState[key] = false
  },
  is(key) {
    return !!waitState[key]
  }
}

export function setupApp(app) {
  app.config.globalProperties.$waiters = Waiters
  app.config.globalProperties.$C = Contant
  app.config.globalProperties.$wait = wait
  window.wait = wait

  const validator = createValidator()
  app.config.globalProperties.errors = validator.errors
  app.config.globalProperties.$validator = {
    validate: async () => validator.validateAll()
  }

  app.directive('validate', {
    mounted(el, binding, vnode) {
      const target = el.querySelector('input, textarea, select') || el
      const name =
        vnode?.component?.props?.name ||
        target.getAttribute('name') ||
        target.getAttribute('data-name') ||
        'Field'

      const field = validator.registerField(target, name, binding.value || '')

      const handler = () => validator.validateField(field)
      target.addEventListener('blur', handler)
      target.addEventListener('input', handler)
      target._pwValidateCleanup = () => {
        target.removeEventListener('blur', handler)
        target.removeEventListener('input', handler)
      }
    },
    updated(el, binding, vnode) {
      const target = el.querySelector('input, textarea, select') || el
      const name =
        vnode?.component?.props?.name ||
        target.getAttribute('name') ||
        target.getAttribute('data-name') ||
        'Field'

      validator.registerField(target, name, binding.value || '')
    },
    unmounted(el) {
      const target = el.querySelector('input, textarea, select') || el
      validator.unregisterField(target)
      if (target._pwValidateCleanup) {
        target._pwValidateCleanup()
      }
    }
  })

  app.directive('tooltip', {
    mounted(el, binding) {
      if (binding.value) {
        el.setAttribute('title', binding.value)
      }
    },
    updated(el, binding) {
      if (binding.value) {
        el.setAttribute('title', binding.value)
      } else {
        el.removeAttribute('title')
      }
    }
  })

  app.directive('clipboard', {
    mounted(el, binding) {
      if (binding.arg !== 'copy') {
        return
      }

      const handler = async () => {
        if (!binding.value) {
          return
        }

        try {
          await navigator.clipboard.writeText(String(binding.value))
        } catch (error) {
          console.log(error)
        }
      }

      el.addEventListener('click', handler)
      el._pwClipboardCleanup = () => el.removeEventListener('click', handler)
    },
    updated(el, binding) {
      if (binding.arg !== 'copy') {
        return
      }
    },
    unmounted(el) {
      if (el._pwClipboardCleanup) {
        el._pwClipboardCleanup()
      }
    }
  })

  // Auto register all components
  const componentModules = import.meta.glob('./components/**/*.vue', { eager: true })
  Object.values(componentModules).forEach(componentModule => {
    const component = componentModule.default || componentModule
    if (component && component.name) {
      app.component(component.name, component)
    }
  })

  app.config.globalProperties.$notify = notify
  app.config.globalProperties.$notifyError = text => notify({ type: 'error', text })
  app.config.globalProperties.$notifyWarn = text => notify({ type: 'warn', text })
  app.config.globalProperties.$notifySuccess = text => notify({ type: 'success', text })
  app.config.globalProperties.$notificationState = notificationState

  app.config.globalProperties.$request = async (callback, waitKey, errorCallback = null) => {
    try {
      wait.start(waitKey)
      await callback()
    } catch (error) {
      console.log(error)

      if (error.response) {
        if (error.response.status === 401 && !router.currentRoute.value.meta?.auth) {
          store.dispatch('Logout')
          return router.push({ name: 'Login' })
        }

        if (errorCallback) {
          errorCallback(error)
        } else if (error.response.status >= 500) {
          notify({ type: 'error', text: i18n.t('API500ErrorMessage') })
        } else if (error.response.data.Message && error.response.status != 401) {
          notify({ type: 'error', text: error.response.data.Message })
        }
      } else {
        notify({ type: 'error', text: 'Network Error !' })
      }
    } finally {
      wait.end(waitKey)
    }
  }
}
