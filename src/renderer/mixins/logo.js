export default {
  data() {
    return {
      logoIsAvailable: true,
      url: ''
    }
  },
  methods: {
    getLogo(url) {
      this.url = url
      return `http://logo.clearbit.com/${this.domainFromURL(url)}`
    },
    domainFromURL(url) {
      // Regex is from: https://stackoverflow.com/a/33651369/10991790
      const matches = url.match(/^(?:https?:)?(?:\/\/)?([^\/\?]+)/i)
      return matches && matches[1]
    },
    companyLetter: function(url) {
      return this.domainFromURL(url)[0].toUpperCase()
    }
  },

  watch: {
    url: function (val){
      this.logoIsAvailable = true
    } 
  }
}
