<template>
  <div class="logoWrapper">
    <img
      v-if="url && logoIsAvailable"
      @error="logoIsAvailable = false"
      @load="logoIsAvailable = true"
      :src="getLogo(url)"
      class="company-logo"
    />
    <h6 v-else>{{ companyLetter(url) }}</h6>
  </div>
</template>

<script>
import LogoMixin from '@/mixins/logo'

export default {
  name: 'CompanyLogo',
  mixins: [LogoMixin],

  props: {
    url: String
  }
}
</script>

<style lang="scss">
.logoWrapper {
  height: 32px;
  width: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  h6 {
    color: $color-secondary;
    font-weight: $font-weight-semibold;
  }

}
.company-logo {
  border-radius: 5px;
  height: 100%;
  width: 100%;
}
</style>
