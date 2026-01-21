import { createApp } from 'vue'
import { Buffer } from 'buffer'

import './styles/app.scss'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import { setupApp } from './config'

// Avoid calling logout on startup; it triggers server call before UI loads.

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

const app = createApp(App)
setupApp(app)
app.use(store)
app.use(router)
app.use(i18n)
app.mount('#app')

window.vm = app
