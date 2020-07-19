<template>
  <img v-if="url && logoIsAvailable" @error="onLogoError" :src="companyLogo" class="company_logo" />
  <div v-else></div>
</template>

<script>
export default {
  name: 'CompanyLogoItem',

  props: {
    url: {
      type: String,
      default: () => ('')
    }
  },

  data() {
    return {
      logoIsAvailable: true
    }
  },

  computed: {
    companyLogo() {
      return `http://logo.clearbit.com/${this.domainFromURL}`
    },

    domainFromURL() {
      // Regex is from: https://stackoverflow.com/a/33651369/10991790
      const matches = this.url.match(/^(?:https?:)?(?:\/\/)?([^\/\?]+)/i)
      return matches && matches[1]
    }
  },

  methods: {
    onLogoError(e) {
      this.logoIsAvailable = false
    }
  }

}
</script>

<style scoped lang="scss">
  .company_logo {
    border-radius: 5px; 
  }
</style>