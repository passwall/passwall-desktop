<template>
    <button
    v-if="!isEditMode"
    class="edit-btn ml-1"
    v-tooltip="$t('Edit')"
    @click="onToggle"
    >
    <VIcon name="pencil" size="14px" />
    </button>
</template>

<script>
export default {
  name: 'EditButton',
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
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: $color-gray-500;
  color: $color-gray-300;
}

.edit-btn:hover {
  color: $color-secondary;
}
</style>
