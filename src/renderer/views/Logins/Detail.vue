<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="data.src" :src="data.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="data.website" class="website" />
        <span v-text="data.email" class="email" />
      </div>
      <!-- Share -->
      <button class="detail-page-header-icon ml-auto">
        <ShareIcon size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon">
        <TrashIcon size="14" />
      </button>
      <!-- Copy -->
      <button class="detail-page-header-icon">
        <ClipboardCopyIcon size="14" />
      </button>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    data() {
      return this.$route.params.data
    }
  }
}
</script>

<style lang="scss">
.detail-page {
  width: 100%;
  height: 100vh;
  border-left: 1px solid black;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    background-color: $color-gray-600;
    border-bottom: 1px solid black;
    padding: 0 $spacer-5;

    &-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: $color-gray-400;
    }

    &-summary {
      color: #fff;
      margin: 0 auto 0 $spacer-3;
      display: flex;
      flex-direction: column;

      .website {
        font-weight: bold;
        font-size: 12px;
        line-height: 16px;
      }

      .email {
        font-weight: normal;
        font-size: 10px;
        line-height: 16px;
      }
    }

    &-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background-color: $color-gray-500;
      margin-left: $spacer-3;
      color: $color-gray-300;
    }
  }
}
</style>
