<template>
  <button v-if="!isEditMode" class="edit-btn ml-1" v-tooltip="$t('Edit')" @click="onToggle">
    <VIcon name="pencil" size="14px" />
  </button>
</template>

<script>
export default {
  name: 'EditButton',
  emits: ['click'],
  data() {
    return { isEditMode: false }
  },
  methods: {
    onToggle() {
      this.isEditMode = !this.isEditMode
      this.$emit('click', this.isEditMode)
    }
  }
}
</script>

<style lang="scss">
.edit-btn {
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

.edit-btn:hover {
  color: $color-secondary;
  background-color: rgba($color-secondary, 0.1);
}
</style>
