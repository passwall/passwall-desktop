<template>
  <div class="generate-password-wrapper">
    <button
      type="button"
      @click="onClickGenerate"
      class="btn-generate-pass ml-1"
      v-tooltip="$t('Generate')"
    >
      <VIcon name="refresh" size="14px" />
    </button>

    <div v-if="showPopover" class="generate-password">
      <span v-text="password" />
      <hr />
      <VButton size="mini" @click="onClickUseThis">
        {{ $t('UseThis') }}
      </VButton>
    </div>
  </div>
</template>

<script>
import SystemService from '@/api/services/System'

export default {
  name: 'GeneratePassword',
  emits: ['input', 'update:modelValue'],

  props: {
    value: String,
    modelValue: String
  },

  data() {
    return {
      password: '',
      showPopover: false
    }
  },

  methods: {
    onClickUseThis() {
      this.$emit('input', this.password)
      this.$emit('update:modelValue', this.password)
      this.showPopover = false
    },

    async onClickGenerate() {
      try {
        const { data } = await SystemService.GeneratePassword()
        this.password = data.message
        this.showPopover = true
      } catch (err) {
        console.log(err)
      }
    }
  }
}
</script>

<style lang="scss">
.generate-password-wrapper {
  position: relative;
}

.btn-generate-pass {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: $color-gray-500;
  margin-left: $spacer-2;
  color: $color-gray-300;
  transition: all 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-generate-pass:hover {
  color: $color-secondary;
  background-color: rgba($color-secondary, 0.1);
}

.generate-password {
  position: absolute;
  right: 0;
  top: 36px;
  z-index: 30;
  min-width: 220px;
  text-align: center;
  border-radius: 8px;
  padding: $spacer-3;
  background-color: $color-gray-500;
  border: 1px solid rgba(#fff, 0.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

  span {
    color: #fff;
    font-size: 14px;
    line-height: 22px;
    font-family: monospace;
  }

  hr {
    margin: 12px #{-$spacer-3};
    border-bottom: 1px solid rgba(#fff, 0.06);
  }
}
</style>
