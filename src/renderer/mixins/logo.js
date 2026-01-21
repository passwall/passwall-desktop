const CLEARBIT_LOGO_ENABLED = false

export default {
  data() {
    return {
      logoIsAvailable: CLEARBIT_LOGO_ENABLED
    }
  },

  methods: {
    getLogo(url) {
      if (!CLEARBIT_LOGO_ENABLED) {
        return ''
      }
      return `http://logo.clearbit.com/${this.domainFromURL(url)}`
    },

    domainFromURL(url) {
      if (url) {
        // Regex is from: https://stackoverflow.com/a/33651369/10991790
        const matches = url.match(/^(?:https?:)?(?:\/\/)?([^\/\?]+)/i)
        return matches && matches[1]
      }
      return 'N'
    },

    companyLetter(url) {
      return this.domainFromURL(url)[0].toUpperCase()
    }
  },

  watch: {
    url() {
      this.logoIsAvailable = CLEARBIT_LOGO_ENABLED
    }
  }
}
