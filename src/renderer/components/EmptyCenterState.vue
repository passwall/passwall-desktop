<template>
  <div class="empty-center-state">
  </div>
</template>

<script>
export default {
  name: 'EmptyCenterState',

  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    active: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss">
.login-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background-color: $color-gray-600;
  cursor: pointer;
  border-bottom: 1px solid black;

  &.--active {
    background: black;
  }

  &-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: $color-gray-400;
    margin-left: $spacer-3;
  }

  &-summary {
    color: #fff;
    margin: 0 auto 0 $spacer-3;
    display: flex;
    flex-direction: column;

    .url {
      font-weight: bold;
      font-size: 12px;
      line-height: 16px;
    }

    .username {
      font-weight: normal;
      font-size: 10px;
      line-height: 16px;
    }
  }

  &-detail {
    margin: 0 $spacer-3 0 auto;
    color: $color-gray-300;
  }
}
</style>
