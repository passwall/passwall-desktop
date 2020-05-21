<template>
  <button class="clipboard-btn" v-show="copy" v-clipboard:copy="copy" v-tooltip="$t('Copy')">
    <DuplicateIcon size="13" />
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
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background-color: $color-gray-500;
  color: $color-gray-300;
}
</style>
