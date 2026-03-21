import { createI18n } from 'vue-i18n'
import en from './langs/en'
import tr from './langs/tr'

const LOCALE_STORAGE_KEY = 'passwall_desktop_locale'
const SUPPORTED_LOCALES = ['en', 'tr']

function getInitialLocale() {
  const stored = String(localStorage.getItem(LOCALE_STORAGE_KEY) || 'en').toLowerCase()
  return SUPPORTED_LOCALES.includes(stored) ? stored : 'en'
}

export default createI18n({
  legacy: true,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    tr
  }
})
