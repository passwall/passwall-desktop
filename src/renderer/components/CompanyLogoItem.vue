<template>
  <img v-if="url && logoIsAvailable" @error="onLogoError" :src="companyLogo" />
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
      return `http://logo.clearbit.com/${this.url}`
    }
  },

  methods: {
    onLogoError(e) {
      this.logoIsAvailable = false
      console.log('herre', e)
    }
  }

}
</script>

<style scoped lang="scss">

</style>