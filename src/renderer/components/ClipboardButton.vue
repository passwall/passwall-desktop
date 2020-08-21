<template>
  <button
    type="button"
    class="clipboard-btn"
    v-clipboard:copy="copy"
    v-tooltip="$t('Copy')"
  >
    <VIcon name="duplicate" size="13px" />
  </button>
</template>

<script>
export default {
  name: 'ClipboardButton',

  props: {
    copy: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
.clipboard-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: $color-gray-500;
  color: $color-gray-300;
}
</style>
