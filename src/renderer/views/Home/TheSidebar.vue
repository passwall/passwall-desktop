<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <!-- <img src="" class="account-avatar rounded" /> -->
      <div class="account-avatar">
        <UserIcon size="22" />
      </div>
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="user.name" />
        <span class="account-info-plan" v-text="user.plan" />
      </div>
      <!-- Logout -->
      <button @click="onClickLogout" v-tooltip="$t('Logout')">
        <LogoutIcon size="14" class="c-danger rot-180" />
      </button>
    </div>

    <!-- All Items -->
    <!-- <router-link :to="{ name: 'AllItems' }" class="sidebar-menu-item mt-7">
      <StarIcon size="14" />
      {{ $t('AllItems') }}
    </router-link> -->

    <!-- Categories -->
    <!-- <span class="c-gray-300 pl-5 fs-big py-2 mt-7 mb-4">
      {{ $t('Categories') }}
    </span> -->

    <!-- Logins -->
    <router-link :to="{ name: 'Logins' }" class="sidebar-menu-item">
      <LockClosedIcon size="14" />
      {{ $t('Logins') }}
    </router-link>

    <!-- Credit Cards -->
    <router-link :to="{ name: 'CreditCards' }" class="sidebar-menu-item">
      <CreditCardIcon size="14" />
      {{ $t('Credit Cards') }}
      <!-- Premium -->
      <div class="premium-icon" v-tooltip=""><StarIcon size="11" class="c-secondary" /></div>
    </router-link>

    <!-- Bank Accounts -->
    <router-link :to="{ name: 'BankAccounts' }" class="sidebar-menu-item">
      <CreditCardIcon size="14" />
      {{ $t('Bank Accounts') }}
      <!-- Premium -->
      <div class="premium-icon" v-tooltip=""><StarIcon size="11" class="c-secondary" /></div>
    </router-link>

    <!-- Private Notes -->
    <router-link :to="{ name: 'PrivateNotes' }" event="" class="sidebar-menu-item" disabled>
      <ClipboardCheckIcon size="14" />
      {{ $t('PrivateNotes') }}
      <!-- Premium -->
      <div class="premium-icon" v-tooltip=""><StarIcon size="11" class="c-secondary" /></div>
    </router-link>

    <!-- Identities -->
    <router-link :to="{ name: 'Identities' }" event="" class="sidebar-menu-item" disabled>
      <UserIcon size="14" />
      {{ $t('Identities') }}
      <!-- Premium -->
      <div class="premium-icon" v-tooltip=""><StarIcon size="11" class="c-secondary" /></div>
    </router-link>

    <!-- Trash -->
    <router-link :to="{ name: 'Trash' }" event="" class="sidebar-menu-item" disabled>
      <TrashIcon size="14" />
      {{ $t('Trash') }}
      <!-- Premium -->
      <div class="premium-icon" v-tooltip=""><StarIcon size="11" class="c-secondary" /></div>
    </router-link>

    <!-- Update -->
    <button @click="onClickUpdate" href="" class="update-box flex-center" v-if="hasUpdate">
      {{ $t('There is an update available.') }}
    </button>

    <!-- Feedback -->
    <button class="btn-feedback" @click="onClickFeedback">
      <VIcon name="right-corner" class="right-corner" size="15" />
      <VIcon name="right-corner" class="left-corner rot-180" size="15" />

      {{ $t('GiveFeedback') }}
      <div class="icon"><ExternalLinkIcon size="8" /></div>
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import HTTPClient from '@/api/HTTPClient'

export default {
  data() {
    return {
      hasUpdate: false,
      updateLink: null
    }
  },

  async created() {
    await this.checkUpdate()
  },

  computed: {
    ...mapState(['user'])
  },

  methods: {
    ...mapActions(['Logout']),

    onClickUpdate() {
      open(this.updateLink || 'https://passwall.io')
    },

    async checkUpdate() {
      const { version } = require('../../../../package.json')
      try {
        const { data } = await HTTPClient.get('/web/check-update/1')

        this.hasUpdate = data.latest_version != version
        this.updateLink = data.download_url
      } catch (err) {
        console.log(err)
      }
    },

    onClickFeedback() {
      open('https://passwall.typeform.com/to/GAv1h2')
    },

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
    margin: 32px 0px;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 $spacer-3;

    &-avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: $color-gray-600;
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

  .update-box {
    height: 30px;
    color: #fff;
    background-color: $color-primary;
    margin-bottom: auto;

    &:hover {
      opacity: 0.9;
    }
  }

  .btn-feedback {
    position: relative;
    height: 40px;
    background-color: $color-gray-500;
    font-size: $font-size-normal;
    color: #fff;

    &,
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      width: 20px;
      height: 20px;
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
    font-size: $font-size-normal;
    border-bottom: 1px solid $color-gray-600;

    &:nth-last-child(3) {
      margin-bottom: auto;
    }

    &:last-of-type {
      border-bottom: 0;
      margin-bottom: 20px;
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

    // &[disabled] {
    //   pointer-events: none;
    // }
  }
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
</style>
