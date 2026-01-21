<template>
  <button
    type="button"
    class="showpass-btn ml-1"
    v-tooltip="$t(isShow ? 'Hide' : 'Show')"
    @click="onToggle"
  >
    <VIcon class="c-pointer" :name="isShow ? 'eye-off' : 'eye'" size="14px" />
  </button>
</template>

<script>
export default {
  name: 'ShowPassButton',
  data() {
    return { isShow: false }
  },
  methods: {
    onToggle() {
      this.isShow = !this.isShow
      this.$emit('click', this.isShow)
    }
  }
}
</script>

<style lang="scss">
.showpass-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: $color-gray-500;
  color: $color-gray-300;
}

.showpass-btn:hover {
  color: $color-secondary;
}
</style>
