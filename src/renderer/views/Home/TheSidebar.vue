<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <img src="" class="account-avatar rounded" />
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="user.name" />
        <span class="account-info-plan" v-text="'Free'" />
      </div>
      <!-- Logout -->
      <button @click="onClickLogout" v-tooltip="$t('Logout')">
        <LogoutIcon size="14" class="c-danger rot-180" />
      </button>
    </div>

    <!-- All Items -->
    <router-link :to="{ name: 'AllItems' }" class="sidebar-menu-item mt-7">
      <StarIcon size="14" />
      {{ $t('AllItems') }}
    </router-link>

    <!-- Categories -->
    <span class="c-gray-300 pl-5 fs-big py-2 mt-3 mb-4">
      {{ $t('Categories') }}
    </span>

    <!-- Logins -->
    <router-link :to="{ name: 'Logins' }" class="sidebar-menu-item">
      <LockClosedIcon size="14" />
      {{ $t('Logins') }}
    </router-link>

    <!-- Private Notes -->
    <router-link :to="{ name: 'PrivateNotes' }" class="sidebar-menu-item" disabled>
      <ClipboardCheckIcon size="14" />
      {{ $t('PrivateNotes') }}
      <!-- Premium -->
      <div class="premium-icon"><StarIcon size="8" /></div>
    </router-link>

    <!-- Credit Cards -->
    <router-link :to="{ name: 'CreditCards' }" class="sidebar-menu-item" disabled>
      <CreditCardIcon size="14" />
      {{ $t('CreditCards') }}
      <!-- Premium -->
      <div class="premium-icon"><StarIcon size="8" /></div>
    </router-link>

    <!-- Identities -->
    <router-link :to="{ name: 'Identities' }" class="sidebar-menu-item" disabled>
      <UserIcon size="14" />
      {{ $t('Identities') }}
      <!-- Premium -->
      <div class="premium-icon"><StarIcon size="8" /></div>
    </router-link>

    <!-- Trash -->
    <router-link :to="{ name: 'Trash' }" class="sidebar-menu-item mt-7" disabled>
      <TrashIcon size="14" />
      {{ $t('Trash') }}
      <!-- Premium -->
      <div class="premium-icon"><StarIcon size="8" /></div>
    </router-link>

    <!-- Feedback -->
    <button class="btn-feedback">
      <VIcon name="right-corner" class="right-corner" size="15" />
      <VIcon name="right-corner" class="left-corner rot-180" size="15" />

      {{ $t('GiveFeedback') }}
      <div class="icon"><ExternalLinkIcon size="8" /></div>
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {}
  },

  computed: {
    ...mapState(['user'])
  },

  methods: {
    ...mapActions('Auth', ['Logout']),

    onClickLogout() {
      this.Logout()
      this.$router.push({ name: 'Login' })
    }
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

  .btn-feedback {
    position: relative;
    height: 40px;
    margin-top: auto;
    background-color: $color-gray-500;
    font-size: 11px;
    color: #fff;

    &,
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      margin-left: $spacer-2;
      background-color: $color-gray-400;
    }

    .left-corner,
    .right-corner {
      position: absolute;
      z-index: 10;
    }

    .right-corner {
      color: $color-primary;
      top: 0px;
      right: 0px;
    }

    .left-corner {
      left: 0px;
      bottom: 0px;
      color: $color-secondary;
    }
  }

  &-menu-item {
    display: flex;
    align-items: center;
    padding-left: $spacer-3;
    height: 40px;
    color: $color-gray-300;
    font-size: $font-size-small;
    border-bottom: 1px solid $color-gray-600;

    &:last-of-type {
      border-bottom: 0;
    }

    svg {
      color: $color-gray-300;
      margin-right: $spacer-2;
    }

    &.router-link-active {
      color: #fff;

      svg {
        color: $color-secondary;
      }
    }

    &:disabled {
      pointer-events: none;
    }

    .premium-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 4px;
      margin-left: $spacer-2;
      background-color: $color-gray-400;

      svg {
        margin: 0;
      }
    }
  }
}
</style>
