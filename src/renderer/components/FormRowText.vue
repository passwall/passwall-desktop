<template>
  <div class="form-row">
    <label v-text="title" />
    <VFormText
      v-if="editMode"
      :value="value"
      theme="no-border"
      @input="$emit('input', $event)"
      :placeholder="$t('ClickToFill')"
    />
    <!-- Text -->
    <div v-else class="d-flex flex-items-center px-3 py-2">
      <span v-text="value" class="mr-2" />
      <ClipboardButton :copy="value" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'FormRowText',

  props: {
    title: String,
    value: String,
    editMode: Boolean
  }
}
</script>
