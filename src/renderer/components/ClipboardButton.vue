<template>
  <button type="button" class="clipboard-btn ml-1" v-clipboard:copy="copy" v-tooltip="$t('Copy')">
    <VIcon name="duplicate" size="14px" />
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
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: $color-gray-500;
  color: $color-gray-300;
  transition: all 150ms ease;
}

.clipboard-btn:hover {
  color: $color-secondary;
  background-color: rgba($color-secondary, 0.1);
}
</style>
