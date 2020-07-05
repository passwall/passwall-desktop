<template>
  <div class="text-area-wrapper d-flex flex-column px-3 py-2 w-100">
    <textarea
      :value="value"
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

  props: {
    name: String,
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
.text-area-wrapper {
  textarea {
    background-color: $color-gray-500;
    color: white;
    border-radius: 5px;
    padding: $spacer-2;
    resize: none;
    min-height: 100px;
    border: solid 1px $color-primary;
    width: 100%;

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
