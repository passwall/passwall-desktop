<template>
  <v-popover offset="16">
    <button 
      type="button" 
      @click="onClickGenerate" 
      class="btn-generate-pass ml-1"
      v-tooltip="$t('Generate')">
      <VIcon name="refresh" size="14px" />
    </button>

    <!-- Popover -->
    <template slot="popover">
      <div class="generate-password">
        <span v-text="password" />
        <hr />
        <VButton size="mini" v-close-popover @click="onClickUseThis">
          {{ $t('UseThis') }}
        </VButton>
      </div>
    </template>
  </v-popover>
</template>

<script>
import { mapActions } from 'vuex'
import SystemService from '@/api/services/System'
import CryptoUtils from '@/utils/crypto'

export default {
  name: 'GeneratePassword',

  props: {
    value: String
  },

  data() {
    return {
      password: ''
    }
  },

  methods: {
    onClickItem(name) {
      this.$router.push({ name })
      this.$emit('hide')
    },

    onClickUseThis() {
      this.$emit('input', this.password)
    },

    async onClickGenerate() {
      try {
        const { data } = await SystemService.GeneratePassword()
        this.password = data.message
      } catch (err) {
        console.log(err)
      }
    }
  }
}
</script>

<style lang="scss">
.btn-generate-pass {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: $color-gray-500;
  margin-left: $spacer-2;
  color: $color-gray-300;
}

.generate-password {
  text-align: center;
  border-radius: 4px;
  padding: $spacer-3;
  background-color: black;

  span {
    color: #fff;
    font-size: 14px;
    line-height: 22px;
  }

  hr {
    margin: 12px #{-$spacer-3};
    border-bottom: 1px solid $color-gray-500;
  }
}
</style>
