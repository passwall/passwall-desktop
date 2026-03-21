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
          <button @click="navigateTo('PasswordGenerator')">
            <VIcon name="refresh" size="14px" class="mr-2" />
            {{ $t('Password Generator') }}
          </button>
          <button @click="navigateTo('ConnectedBrowsers')">
            <VIcon name="monitor" size="14px" class="mr-2" />
            {{ $t('Connected Browsers') }}
          </button>
          <button @click="navigateTo('DesktopSettings')">
            <VIcon name="cog" size="14px" class="mr-2" />
            {{ $t('Settings') }}
          </button>
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
      {{ updateLabel }}
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
      latestVersion: null,
      updateLastResult: 'idle',
      updateDownloadPercent: 0,
      updateAutoDownloadEnabled: true,
      updateInstallReady: false,
      updatePollTimer: null,
      showAccountMenu: false
    }
  },

  async created() {
    await this.checkUpdate()
    this.startUpdatePolling()
  },

  beforeUnmount() {
    if (this.updatePollTimer) {
      clearInterval(this.updatePollTimer)
      this.updatePollTimer = null
    }
  },

  computed: {
    ...mapState(['user']),
    ...mapGetters(['hasProPlan']),

    accountMenuClass() {
      return [{ '--open': this.showAccountMenu }]
    },
    updateLabel() {
      if (this.updateLastResult === 'downloading') {
        return `Downloading update: ${Math.floor(this.updateDownloadPercent)}%`
      }
      if (this.updateLastResult === 'downloaded') {
        if (this.updateInstallReady) {
          return 'Update ready. Click to restart and install.'
        }
        return 'Update ready. Click to download.'
      }
      if (!this.latestVersion) {
        return this.$t('There is an update available.')
      }
      return this.$t('There is an update available: {version}', {
        version: `v${this.latestVersion}`
      })
    },
    appVersion() {
      return import.meta.env.VITE_APP_VERSION || ''
    }
  },

  methods: {
    async onClickUpdateApp() {
      if (window.electronAPI?.settings) {
        const status = await window.electronAPI.settings.checkForUpdatesNow()
        this.applyUpdateStatus(status)
        if (!status?.active) {
          this.$notifyError('Automatic updates are not active.')
          return
        }
        if (status?.lastResult === 'downloaded') {
          const installResult = await window.electronAPI.settings.installUpdateNow()
          if (installResult?.ok && installResult?.method === 'native') {
            this.$notifySuccess('Installing update, app will restart...')
            return
          }
          if (installResult?.ok && installResult?.method === 'manual') {
            this.$notifySuccess('Opening download page. Please install the new version manually.')
            return
          }
          this.$notifyError('Could not start update installation.')
          return
        }
        if (!status?.autoDownloadEnabled) {
          this.$notifyWarn('Auto download is disabled in settings.')
          return
        }
        this.$notifySuccess('Update check started.')
        return
      }
      if (window.electronAPI?.shell) {
        window.electronAPI.shell.openExternal('https://passwall.io')
      }
    },

    async checkUpdate() {
      if (!window.electronAPI?.settings) {
        return
      }

      try {
        let status = await window.electronAPI.settings.getUpdateSettings()
        if (status?.active && !status?.lastCheckedAt) {
          status = await window.electronAPI.settings.checkForUpdatesNow()
        }
        this.applyUpdateStatus(status)
      } catch (err) {
        console.log(err)
        this.hasUpdate = false
        this.updateLink = null
        this.latestVersion = null
        this.updateLastResult = 'error'
        this.updateDownloadPercent = 0
      }
    },

    applyUpdateStatus(status) {
      this.hasUpdate = Boolean(status?.hasUpdate)
      this.updateLink = status?.feedUrl || null
      this.latestVersion = status?.latestVersion || null
      this.updateLastResult = status?.lastResult || 'idle'
      this.updateDownloadPercent = Number(status?.downloadPercent || 0)
      this.updateAutoDownloadEnabled = Boolean(status?.autoDownloadEnabled)
      this.updateInstallReady = Boolean(status?.installReady)
    },

    startUpdatePolling() {
      if (!window.electronAPI?.settings || this.updatePollTimer) {
        return
      }
      this.updatePollTimer = setInterval(() => {
        this.checkUpdate()
      }, 3000)
    },

    onClickFeedback() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal('https://passwall.typeform.com/to/GAv1h2')
      }
    },

    navigateTo(routeName) {
      this.showAccountMenu = false
      this.$router.push({ name: routeName })
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
        height: 142px;
      }

      hr {
        width: 174px;
        border-bottom: 2px solid black;
        margin-bottom: 10px;
        margin-left: -16px;
      }

      button {
        color: white;
        font-size: $font-size-normal;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
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
