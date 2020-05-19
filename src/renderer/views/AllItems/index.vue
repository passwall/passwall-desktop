<template>
  <div class="items-container">
    <!-- Search -->
    <div class="search-wrapper">
      <VFormText :placeholder="$t('Search passwords, websites, notes')" theme="black" class="w-100" />
    </div>
    <!-- Items -->
    <perfect-scrollbar class="all-items"> </perfect-scrollbar>
  </div>
</template>

<script>
export default {
  data() {
    return {}
  }
}
</script>

<style lang="scss">
.items-container {
  display: flex;
  flex-direction: column;
  min-width: 295px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background-color: $color-gray-600;
  padding: 0 $spacer-3;
  height: 64px;
  border-bottom: 1px solid black;
}
</style>
