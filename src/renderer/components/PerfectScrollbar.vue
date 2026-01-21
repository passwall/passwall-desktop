<template>
  <div class="perfect-scrollbar" v-bind="$attrs">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'PerfectScrollbar',
  mounted() {
    const el = this.$el
    const parent = el?.parentElement
    const firstChild = el?.firstElementChild
  },
  updated() {
    const el = this.$el
  }
}
</script>

<style lang="scss">
.perfect-scrollbar {
  height: 100%;
  width: 100%;
  overflow: auto;
  overscroll-behavior: contain;
}
</style>
