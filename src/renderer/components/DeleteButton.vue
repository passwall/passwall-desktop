<template>
  <button class="delete-btn ml-1" v-tooltip="$t('Delete')" v-on:click="deleteItem">
    <VIcon name="trash" size="14px" />
  </button>
</template>

<script>
export default {
  name: 'DeleteButton',
  methods: {
    deleteItem() {
      this.$emit('click')
    }
  }
}
</script>

<style lang="scss">
.delete-btn {
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

.delete-btn:hover {
  color: $color-danger;
  background-color: rgba($color-danger, 0.1);
}
</style>
