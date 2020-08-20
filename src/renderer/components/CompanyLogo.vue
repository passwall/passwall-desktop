<template>
  <div class="logo-wrapper">
    <img
      v-if="url && logoIsAvailable"
      @error="logoIsAvailable = false"
      :src="companyLogo"
      class="company-logo"
    />
    <div class="custom-logo" v-else>
      {{ companyFirstLetter }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompanyLogo',

  props: {
    url: String,
    companyName: String
  },

  data() {
    return {
      logoIsAvailable: false
    }
  },

  watch: {
    url: {
      handler(newVal) {
        if (newVal) {
          if (this.isImageBroken(newVal)) {
            this.logoIsAvailable = false
          } else {
            this.logoIsAvailable = true
          }
        }
      },
      immediate: true
    }
  },

  methods: {
    isImageBroken(url) {
      return /\.(jpeg|jpg|png|gif)\b/i.test(url)
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
    },

    companyFirstLetter() {
      if (this.companyName) {
        return this.companyName.charAt(0).toUpperCase()
      }
    }
  }
}
</script>

<style lang="scss">
.logo-wrapper {
  height: 100%;
}

.company-logo {
  border-radius: 5px;
}

.custom-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $color-secondary;
  font-size: 17px;
}
</style>
