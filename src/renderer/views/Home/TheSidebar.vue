<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <img src="" class="account-avatar" />
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="'Ali Kemal'" />
        <span class="account-info-plan" v-text="'Free'" />
      </div>
      <!-- Logout -->
      <button>
        <VIcon name="logout" class="c-danger" size="14" v-tooltip="$t('Logout')" />
      </button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data() {
    return {}
  }
}
</script>

<style lang="scss">
.sidebar {
  width: 200px;
  min-width: 200px;
  height: 100vh;
  display: flex;
  flex-direction: column;

  .account {
    margin-top: 32px;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 $spacer-3;

    &-avatar {
      width: 40px;
      height: 40px;
    }

    &-info {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0 auto 0 $spacer-2;

      &-name {
        font-size: 14px;
        line-height: 22px;
        color: #fff;
      }

      &-plan {
        font-size: 12px;
        line-height: 18px;
        color: $color-secondary;
      }
    }
  }
}
</style>
