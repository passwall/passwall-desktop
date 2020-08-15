<template>
  <div>
    <img
      v-if="url && logoIsAvailable"
      @error="logoIsAvailable = false"
      :src="companyLogo"
      class="company-logo"
    />
  </div>
</template>

<script>
export default {
  name: 'CompanyLogo',

  props: {
    url: String
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
  }
}
</script>

<style lang="scss">
.company-logo {
  border-radius: 5px;
}
</style>
