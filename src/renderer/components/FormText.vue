<template>
  <div class="form-text-wrapper">
    <input
      :type="$attrs.type || 'text'"
      :value="value"
      :class="[`--${size}`]"
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
      console.log(this.errors, this.name)
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

<style>
.form-text-wrapper .error {
  font-size: 12px;
  color: red;
}

.form-text {
  border: 1px solid #151c27;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.2);
  background-color: transparent;
  color: #fff;
}

.form-text:placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.form-text.--small {
  height: 32px;
  padding: 15px 16px;
}

.form-text.--medium {
  height: 48px;
  padding: 15px 16px;
  font-size: 12px;
  line-height: 18px;
}
</style>
