<template>
  <div class="form-row">
    <label v-text="title" />
    <VFormText
      v-if="editMode"
    :value="displayValue"
      theme="no-border"
    @input="onInput"
      :placeholder="$t('ClickToFill')"
    />
    <!-- Text -->
    <div v-else class="d-flex flex-items-center px-3 py-2">
      <span v-text="displayValue" class="mr-2" />
      <ClipboardButton v-if="displayValue" :copy="displayValue" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormRowText',

  props: {
    title: String,
    value: String,
    modelValue: String,
    editMode: Boolean
  },
  computed: {
    displayValue() {
      return this.modelValue ?? this.value ?? ''
    }
  },
  methods: {
    onInput(value) {
      this.$emit('input', value)
      this.$emit('update:modelValue', value)
    }
  },

  watch: {}
}
</script>
