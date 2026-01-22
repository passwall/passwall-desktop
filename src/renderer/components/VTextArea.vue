<template>
  <div class="text-area-wrapper">
    <textarea
      :value="sensitive ? '*********' : (modelValue ?? value ?? '')"
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
  name: 'VTextArea',
  inheritAttrs: false,
  emits: ['update:modelValue', 'input'],

  props: {
    name: String,
    modelValue: String,
    value: String,
    sensitive: Boolean
  },

  computed: {
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
.text-area-wrapper {
  display: flex;
  flex-direction: column;
  padding: $spacer-2 $spacer-3;
  width: 100%;

  textarea {
    width: 100%;
    resize: none;
    color: white;
    border-radius: 5px;
    padding: $spacer-2;
    min-height: 100px;
    background-color: $color-gray-500;
    border: solid 1px $color-gray-700;

    &::placeholder {
      font-weight: normal;
      font-size: $font-size-medium;
      color: $color-gray-300;
    }

    &:disabled {
      border: 0;
    }

    &:not(:placeholder-shown) {
      resize: vertical;
    }
  }

  .error {
    font-size: 10px;
    color: $color-danger;
    margin-top: $spacer-1;
  }
}
</style>
