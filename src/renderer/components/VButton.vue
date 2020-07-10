<template>
  <button
    :type="$attrs.type || 'button'"
    :class="[`--${size}`, `--${theme}`, { '--loading': loading }]"
    class="btn"
    v-bind="$attrs"
    v-on="inputListeners"
    :disabled="loading"
  >
    <slot />
    <VIcon v-if="loading" name="refresh" size="14" class="spin c-white ml-2" />
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
      default: 'primary'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    getError() {
      const error = this.errors.items.find(e => e.field == this.name)
      return error ? error.msg : ''
    },

    inputListeners() {
      const vm = this
      return Object.assign({}, this.$listeners, {
        input: function(event) {
          vm.$emit('input', event.target.value)
        }
      })
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

  &.--primary {
    background-color: $color-primary;
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
