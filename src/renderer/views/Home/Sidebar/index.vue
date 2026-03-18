<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <VAvatar :pro="hasProPlan" :name="user?.name || ''" />
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="user?.name || ''" />
        <span class="account-info-plan" v-text="hasProPlan ? 'PRO' : 'FREE'" />
      </div>
      <!-- Menu Button -->
      <button @click="showAccountMenu = !showAccountMenu">
        <VIcon :name="showAccountMenu ? 'x' : 'menu'" size="15px" class="c-white" />
      </button>

      <!-- Menu -->
      <div class="account-menu" :class="accountMenuClass">
        <div class="d-flex flex-column flex-items-start p-3">
          <span v-text="$t('Subscription Settings')" class="c-gray-300 mb-3" />
          <!-- Upgrade -->
          <button @click="onClickUpgrade" v-if="!hasProPlan">
            <VIcon name="arrow-up" size="14px" class="mr-2 c-secondary" />
            {{ $t('Upgrade') }}
          </button>
          <template v-else>
            <!-- Update -->
            <button @click="onClickUpdate">
              <VIcon name="refresh" size="15px" class="mr-2" />
              {{ $t('Update') }}
            </button>
            <!-- Cancel -->
            <button @click="onClickCancel">
              <VIcon name="x" size="10px" class="mr-2" />
              {{ $t('Cancel') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Passwords -->
    <MenuItem :service="$C.Services.Passwords" :name="$t('Passwords')" icon="lock-closed" />

    <!-- Secure Notes -->
    <MenuItem :service="$C.Services.Notes" :name="$t('Private Notes')" icon="private-note" />

    <!-- Addresses -->
    <MenuItem :service="$C.Services.Addresses" :name="$t('Addresses')" icon="location-marker" />

    <!-- Payment Cards -->
    <MenuItem :service="$C.Services.CreditCards" :name="$t('Credit Cards')" icon="credit-card" />

    <!-- Bank Accounts -->
    <MenuItem :service="$C.Services.BankAccounts" :name="$t('Bank Accounts')" icon="bank-account" />

    <button class="btn-empty-fix"></button>

    <!-- Update -->
    <button v-if="hasUpdate" @click="onClickUpdateApp" class="update-box flex-center">
      {{ $t('There is an update available.') }}
    </button>

    <div class="app-version" v-if="appVersion">v{{ appVersion }}</div>

    <!-- Feedback -->
    <button class="btn-feedback" @click="onClickFeedback">
      <VIcon name="right-corner" class="right-corner" size="15px" v-if="!hasUpdate" />
      <VIcon name="right-corner" class="left-corner rot-180" size="15px" />

      {{ $t('GiveFeedback') }}
      <div class="icon">
        <VIcon name="external-link" size="14px" />
      </div>
    </button>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import MenuItem from './MenuItem.vue'

export default {
  components: {
    MenuItem
  },

  data() {
    return {
      hasUpdate: false,
      updateLink: null,
      showAccountMenu: false
    }
  },

  async created() {
    await this.checkUpdate()
  },

  computed: {
    ...mapState(['user']),
    ...mapGetters(['hasProPlan']),

    accountMenuClass() {
      return [this.hasProPlan ? '--pro-plan' : '--free-plan', { '--open': this.showAccountMenu }]
    },
    appVersion() {
      return import.meta.env.VITE_APP_VERSION || ''
    }
  },

  methods: {
    onClickUpdateApp() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal(this.updateLink || 'https://passwall.io')
      }
    },

    async checkUpdate() {
      if (!window.electronAPI) {
        return
      }

      const version = await window.electronAPI.app.getVersion()
      try {
        const { data } = await window.electronAPI.api.request({
          method: 'GET',
          url: 'https://api.github.com/repos/passwall/passwall-desktop/releases/latest',
          headers: { Accept: 'application/json' }
        })
        this.hasUpdate = data.tag_name != version
        this.updateLink = data.html_url
      } catch (err) {
        console.log(err)
      }
    },

    onClickFeedback() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal('https://passwall.typeform.com/to/GAv1h2')
      }
    },

    onClickUpgrade() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal('https://signup.passwall.io/upgrade')
      }
    },

    onClickUpdate() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal(this.user.update_url)
      }
    },

    onClickCancel() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal(this.user.cancel_url)
      }
    }
  }
}
</script>

<style lang="scss">
.sidebar {
  position: relative;
  width: 200px;
  min-width: 200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  user-select: none;
  background-color: $color-gray-600;
  border-right: 1px solid rgba(#fff, 0.04);

  .account {
    position: relative;
    margin: 24px 0px;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 $spacer-3;

    & > button {
      transition: color 150ms ease;
      &:hover {
        color: $color-secondary;
      }
    }

    &-menu {
      position: absolute;
      background-color: $color-gray-500;
      border-radius: 12px;
      height: 0px;
      color: white;
      top: 55px;
      left: 12px;
      right: 12px;
      z-index: 2;
      transition: all 0.15s ease;
      overflow: hidden;

      &.--open {
        border: 1px solid $color-gray-400;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

        &.--free-plan {
          height: 85px;
        }

        &.--pro-plan {
          height: 120px;
        }
      }

      hr {
        width: 174px;
        border-bottom: 2px solid black;
        margin-bottom: 10px;
        margin-left: -16px;
      }

      button {
        color: white;
        font-size: $font-size-medium;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        transition: color 150ms ease;

        &:hover {
          color: $color-secondary;
        }

        &:last-child {
          margin-bottom: 0px;
        }
      }
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
        font-weight: 500;
      }

      &-plan {
        font-size: 11px;
        line-height: 16px;
        color: $color-secondary;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
    }
  }

  .btn-empty-fix {
    margin-top: auto;
  }

  .app-version {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: rgba(#fff, 0.72);
    background: transparent;
    border: 0;
  }

  .update-box {
    height: 30px;
    color: #fff;
    background-color: $color-primary;
    margin-top: auto;
    transition: opacity 150ms ease;

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
    transition: background-color 150ms ease;

    &:hover {
      background-color: #121a24;
    }

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
    border-bottom: 1px solid rgba(#fff, 0.03);
    transition:
      color 150ms ease,
      background-color 150ms ease,
      padding-left 150ms ease;

    &:hover:not(.router-link-active) {
      color: #fff;
      background-color: rgba(#fff, 0.03);
      padding-left: 20px;
    }

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
      transition: color 150ms ease;
    }

    &:hover:not(.router-link-active) svg {
      color: rgba($color-secondary, 0.6);
    }

    &.router-link-active {
      color: #fff;
      background-color: rgba($color-primary, 0.08);
      border-left: 2px solid $color-secondary;

      svg {
        color: $color-secondary;
      }
    }
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
