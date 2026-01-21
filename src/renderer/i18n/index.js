import { createI18n } from 'vue-i18n'
import en from './langs/en'

export default createI18n({
  legacy: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en
  }
})
