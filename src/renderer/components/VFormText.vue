<template>
  <div class="form-text-wrapper">
    <input
      :type="$attrs.type || 'text'"
      :value="modelValue ?? value ?? ''"
      :class="clazz"
      class="form-text"
      autocorrect="off"
      autocomplete="off"
      spellcheck="false"
      v-on="inputListeners"
      v-bind="$attrs"
    />
    <!-- Error -->
    <p class="error" v-if="getError" v-text="getError" />
  </div>
</template>

<script>
export default {
  name: 'VFormText',
  inheritAttrs: false,
  emits: ['update:modelValue', 'input'],

  props: {
    name: String,
    modelValue: String,
    value: String,
    theme: {
      type: String,
      default: 'default'
    },
    size: {
      type: String,
      default: 'small'
    }
  },

  computed: {
    clazz() {
      return [`--${this.size}`, `--${this.theme}`, { '--error': this.getError }]
    },

    getError() {
      const error = this.errors.items.find((e) => e.field == this.name)
      return error ? error.msg : ''
    },

    inputListeners() {
      return {
        input: (event) => {
          this.$emit('update:modelValue', event.target.value)
          this.$emit('input', event.target.value)
        }
      }
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

  .form-text {
    width: 100%;
    color: #fff;
    border: 0;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease;

    &::placeholder {
      font-weight: normal;
      font-size: $font-size-small;
      color: $color-gray-300;
    }

    &.--default {
      color: #fff;
      border: 1px solid $color-gray-400;
      background-color: transparent;
      caret-color: $color-primary;

      &.--error {
        border-color: $color-danger;
        box-shadow: 0 0 0 2px rgba($color-danger, 0.15);
      }

      &:focus {
        border-color: $color-primary;
        box-shadow: 0 0 0 2px rgba($color-primary, 0.2);
      }
    }

    &.--black {
      color: $color-gray-300;
      background-color: black;
      border: 1px solid black;
      caret-color: $color-primary;

      &.--error {
        border-color: $color-danger;
      }

      &:focus {
        border-color: $color-primary;
        box-shadow: 0 0 0 2px rgba($color-primary, 0.2);
      }
    }

    &.--no-border {
      caret-color: $color-primary;
      background-color: transparent;

      & + .error {
        margin: 0 0 $spacer-1 $spacer-3;
      }
    }

    &.--small {
      height: 32px;
      border-radius: 4px;
      padding: 0 16px;
    }

    &.--medium {
      border-radius: 8px;
      height: 48px;
      padding: 0 16px;
      font-size: 12px;
      line-height: 18px;
    }
  }
}
</style>
