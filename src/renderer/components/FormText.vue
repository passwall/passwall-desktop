<template>
  <div class="form-text-wrapper">
    <input
      :type="$attrs.type || 'text'"
      :value="value"
      :class="[`--${size}`, { '--error': getError }]"
      class="form-text"
      autocorrect="off"
      autocomplete="off"
      spellcheck="false"
      v-bind="$attrs"
      v-on="inputListeners"
    />
    <!-- Error -->
    <p class="error" v-text="getError" />
  </div>
</template>

<script>
export default {
  name: 'FormText',

  props: {
    name: String,
    value: String,
    size: {
      type: String,
      default: 'small'
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
.form-text-wrapper {
  .error {
    font-size: 10px;
    color: $color-danger;
    margin-top: $spacer-1;
  }
}

.form-text {
  border: 1px solid #151c27;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.2);
  background-color: transparent;
  color: #fff;
  caret-color: #5707ff;

  &:placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    border: 1px solid #5707ff;
  }

  &.--error {
    border: 1px solid #ff0000;
  }

  // sizes
  &.--small {
    height: 32px;
    padding: 15px 16px;
  }

  &.--medium {
    height: 48px;
    padding: 15px 16px;
    font-size: 12px;
    line-height: 18px;
  }
}
</style>
