<template>
  <button
    :type="$attrs.type || 'button'"
    :disabled="$attrs.disabled || loading"
    :class="clazz"
    class="btn"
    v-bind="$attrs"
  >
    <slot />
    <VIcon v-if="loading" name="refresh" size="14px" class="spin c-white ml-2" />
  </button>
</template>

<script>
export default {
  name: 'VButton',

  props: {
    size: {
      type: String,
      default: 'small'
    },
    theme: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'text'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    clazz() {
      return [`--${this.size}`, `--theme-${this.theme}`, { '--loading': this.loading }]
    }
  }
}
</script>

<style lang="scss">
.btn {
  border: 1px solid #151c27;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;

  &.--loading {
    opacity: 0.6;
    cursor: no-drop;
  }

  /* themes */
  &.--theme-primary {
    background-color: $color-primary;
  }

  &.--theme-text {
    border-color: transparent;
    background-color: transparent;
  }

  /* size */
  &.--mini {
    height: 24px;
    border-radius: 4px;
    padding: 2px 16px;
    font-size: 12px;
    line-height: 18px;
  }

  &.--small {
    height: 34px;
    padding: 4px 16px;
    font-size: 12px;
    line-height: 18px;
  }

  &.--medium {
    height: 48px;
    padding: 12px 16px;
    font-size: 14px;
    line-height: 24px;
  }
}
</style>
