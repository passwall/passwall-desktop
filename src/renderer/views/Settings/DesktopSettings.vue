<template>
  <div class="desktop-settings-page">
    <div class="ds-header">
      <div class="ds-header-info">
        <VIcon name="cog" size="20px" class="c-secondary" />
        <div class="ds-header-text">
          <span class="ds-title">{{ $t('Settings') }}</span>
          <span class="ds-subtitle">{{ $t('Application preferences and configuration') }}</span>
        </div>
      </div>
    </div>

    <PerfectScrollbar class="ds-content">
      <!-- General Section -->
      <div class="ds-section">
        <div class="ds-section-title">{{ $t('General') }}</div>

        <div class="ds-setting-row">
          <div class="ds-setting-info">
            <span class="ds-setting-label">{{ $t('Launch at login') }}</span>
            <span class="ds-setting-desc">{{
              $t('Automatically start Passwall when you log in to your computer')
            }}</span>
          </div>
          <button
            class="ds-toggle"
            :class="{ '--on': autoLaunch }"
            @click="toggleAutoLaunch"
            :disabled="autoLaunchLoading"
          >
            <span class="ds-toggle-knob" />
          </button>
        </div>

        <div class="ds-setting-row">
          <div class="ds-setting-info">
            <span class="ds-setting-label">{{ $t('Language') }}</span>
            <span class="ds-setting-desc">{{ $t('Choose the application language') }}</span>
          </div>
          <div class="ds-segmented">
            <button
              class="ds-segmented-btn"
              :class="{ '--active': selectedLanguage === 'en' }"
              @click="setLanguage('en')"
            >
              {{ $t('English') }}
            </button>
            <button
              class="ds-segmented-btn"
              :class="{ '--active': selectedLanguage === 'tr' }"
              @click="setLanguage('tr')"
            >
              {{ $t('Turkish') }}
            </button>
          </div>
        </div>
      </div>

      <div class="ds-section">
        <div class="ds-section-title">{{ $t('Updates') }}</div>

        <div class="ds-setting-row">
          <div class="ds-setting-info">
            <span class="ds-setting-label">{{ $t('Automatic update checks') }}</span>
            <span class="ds-setting-desc">{{
              $t('Automatically check for updates in the background')
            }}</span>
            <span v-if="updateStatusText" class="ds-setting-meta">{{ updateStatusText }}</span>
          </div>
          <button
            class="ds-toggle"
            :class="{ '--on': autoUpdateEnabled }"
            @click="toggleAutoUpdate"
            :disabled="autoUpdateLoading || !updateSupported"
          >
            <span class="ds-toggle-knob" />
          </button>
        </div>

        <div class="ds-setting-row">
          <div class="ds-setting-info">
            <span class="ds-setting-label">{{ $t('Automatic download') }}</span>
            <span class="ds-setting-desc">{{
              $t('Automatically download updates when available')
            }}</span>
          </div>
          <button
            class="ds-toggle"
            :class="{ '--on': autoDownloadEnabled }"
            @click="toggleAutoDownload"
            :disabled="autoUpdateLoading || !updateSupported || !updateFeedConfigured"
          >
            <span class="ds-toggle-knob" />
          </button>
        </div>

        <div class="ds-setting-row">
          <div class="ds-setting-info">
            <span class="ds-setting-label">{{ $t('Automatic update install') }}</span>
            <span class="ds-setting-desc">{{
              $t('Install downloaded updates automatically when the app is closed')
            }}</span>
          </div>
          <button
            class="ds-toggle"
            :class="{ '--on': autoInstallOnQuitEnabled }"
            @click="toggleAutoInstallOnQuit"
            :disabled="autoUpdateLoading || !updateSupported || !updateFeedConfigured"
          >
            <span class="ds-toggle-knob" />
          </button>
        </div>

        <div class="ds-actions-row">
          <button
            class="ds-btn-secondary"
            @click="checkUpdatesNow"
            :disabled="checkUpdatesLoading || !canCheckNow"
          >
            {{ checkUpdatesLoading ? $t('Checking...') : $t('Check for updates now') }}
          </button>
        </div>
      </div>
    </PerfectScrollbar>
  </div>
</template>

<script>
export default {
  name: 'DesktopSettings',

  data() {
    return {
      autoLaunch: false,
      autoLaunchLoading: true,
      autoUpdateEnabled: true,
      autoDownloadEnabled: true,
      autoInstallOnQuitEnabled: true,
      autoUpdateLoading: true,
      checkUpdatesLoading: false,
      updateSupported: false,
      updateFeedConfigured: false,
      updateActive: false,
      updateReason: null,
      updateLastCheckedAt: null,
      updateLastError: null,
      selectedLanguage: 'en'
    }
  },

  async created() {
    await this.loadSettings()
  },

  methods: {
    async loadSettings() {
      this.selectedLanguage = this.normalizeLocale(this.$i18n.locale)
      if (!window.electronAPI?.settings) return
      await Promise.all([this.loadAutoLaunchSettings(), this.loadUpdateSettings()])
    },
    normalizeLocale(locale) {
      return locale === 'tr' ? 'tr' : 'en'
    },

    async loadAutoLaunchSettings() {
      try {
        this.autoLaunch = await window.electronAPI.settings.getAutoLaunch()
      } catch {
        this.autoLaunch = false
      } finally {
        this.autoLaunchLoading = false
      }
    },

    async loadUpdateSettings() {
      this.autoUpdateLoading = true
      try {
        const result = await window.electronAPI.settings.getUpdateSettings()
        this.applyUpdateSettings(result)
      } finally {
        this.autoUpdateLoading = false
      }
    },

    applyUpdateSettings(result = {}) {
      this.autoUpdateEnabled = !!result.enabled
      this.autoDownloadEnabled =
        result.autoDownloadEnabled !== undefined ? !!result.autoDownloadEnabled : true
      this.autoInstallOnQuitEnabled =
        result.autoInstallOnQuitEnabled !== undefined ? !!result.autoInstallOnQuitEnabled : true
      this.updateSupported = !!result.supported
      this.updateFeedConfigured = !!result.feedConfigured
      this.updateActive = !!result.active
      this.updateReason = result.reason || null
      this.updateLastCheckedAt = result.lastCheckedAt || null
      this.updateLastError = result.lastError || null
    },

    async toggleAutoLaunch() {
      if (!window.electronAPI?.settings) return
      this.autoLaunchLoading = true
      try {
        const newValue = !this.autoLaunch
        this.autoLaunch = await window.electronAPI.settings.setAutoLaunch(newValue)
      } catch {
        // revert on failure
      } finally {
        this.autoLaunchLoading = false
      }
    },

    async toggleAutoUpdate() {
      if (!window.electronAPI?.settings || !this.updateSupported) return
      this.autoUpdateLoading = true
      try {
        const result = await window.electronAPI.settings.setAutoUpdateEnabled(
          !this.autoUpdateEnabled
        )
        this.applyUpdateSettings(result)
      } finally {
        this.autoUpdateLoading = false
      }
    },

    async toggleAutoDownload() {
      if (!window.electronAPI?.settings || !this.updateSupported || !this.updateFeedConfigured)
        return
      this.autoUpdateLoading = true
      try {
        const result = await window.electronAPI.settings.setAutoDownloadEnabled(
          !this.autoDownloadEnabled
        )
        this.applyUpdateSettings(result)
      } finally {
        this.autoUpdateLoading = false
      }
    },

    async toggleAutoInstallOnQuit() {
      if (!window.electronAPI?.settings || !this.updateSupported || !this.updateFeedConfigured)
        return
      this.autoUpdateLoading = true
      try {
        const result = await window.electronAPI.settings.setAutoInstallOnQuitEnabled(
          !this.autoInstallOnQuitEnabled
        )
        this.applyUpdateSettings(result)
      } finally {
        this.autoUpdateLoading = false
      }
    },

    async checkUpdatesNow() {
      if (!window.electronAPI?.settings || !this.canCheckNow) return
      this.checkUpdatesLoading = true
      try {
        const result = await window.electronAPI.settings.checkForUpdatesNow()
        this.applyUpdateSettings(result)
      } finally {
        this.checkUpdatesLoading = false
      }
    },
    setLanguage(locale) {
      const normalized = this.normalizeLocale(locale)
      if (normalized === this.selectedLanguage) return
      this.selectedLanguage = normalized
      this.$i18n.locale = normalized
      localStorage.setItem('passwall_desktop_locale', normalized)
    }
  },

  computed: {
    canCheckNow() {
      return this.updateSupported && this.updateFeedConfigured
    },
    updateStatusText() {
      if (!this.updateSupported) {
        return this.$t('Auto update is available only in packaged macOS builds')
      }
      if (!this.updateFeedConfigured) {
        return this.$t('Update feed is not configured')
      }
      if (!this.autoUpdateEnabled) {
        return this.$t('Automatic updates are disabled')
      }
      if (this.updateLastError) {
        return `${this.$t('Last update error')}: ${this.updateLastError}`
      }
      if (this.updateLastCheckedAt) {
        const date = new Date(this.updateLastCheckedAt)
        return `${this.$t('Last checked')}: ${date.toLocaleString()}`
      }
      return this.$t('Automatic update checks are enabled')
    }
  }
}
</script>

<style lang="scss">
.desktop-settings-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .ds-header {
    padding: $spacer-3;
    border-bottom: 1px solid rgba(#fff, 0.06);
    height: 64px;
    display: flex;
    align-items: center;

    &-info {
      display: flex;
      align-items: center;
      gap: $spacer-2;
    }

    &-text {
      display: flex;
      flex-direction: column;
    }
  }

  .ds-title {
    color: #fff;
    font-size: $font-size-normal;
    font-weight: 600;
    line-height: 20px;
  }

  .ds-subtitle {
    color: $color-gray-300;
    font-size: 11px;
    line-height: 16px;
  }

  .ds-content {
    flex: 1;
    overflow-y: auto;
    padding: $spacer-3;
  }

  .ds-section {
    margin-bottom: $spacer-4;

    &-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: $color-gray-300;
      margin-bottom: $spacer-2;
    }
  }

  .ds-setting-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacer-3;
    padding: $spacer-2 $spacer-3;
    border-radius: $radius;
    background: rgba(#fff, 0.03);
    transition: background 150ms ease;

    &:hover {
      background: rgba(#fff, 0.05);
    }
  }

  .ds-setting-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    text-align: left;
  }

  .ds-setting-label {
    color: #fff;
    font-size: 13px;
    font-weight: 500;
  }

  .ds-setting-desc {
    color: $color-gray-300;
    font-size: 11px;
    line-height: 1.4;
    margin-top: 2px;
  }

  .ds-setting-meta {
    color: $color-gray-300;
    font-size: 11px;
    line-height: 1.4;
    margin-top: 6px;
  }

  .ds-actions-row {
    margin-top: $spacer-2;
    display: flex;
    justify-content: flex-start;
  }

  .ds-btn-secondary {
    border: 1px solid rgba(#fff, 0.16);
    background: rgba(#fff, 0.03);
    color: #fff;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    transition: all 150ms ease;

    &:hover:not(:disabled) {
      background: rgba(#fff, 0.06);
      border-color: rgba(#fff, 0.24);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .ds-segmented {
    display: flex;
    border: 1px solid rgba(#fff, 0.16);
    border-radius: 8px;
    overflow: hidden;
    margin-left: auto;
  }

  .ds-segmented-btn {
    min-width: 74px;
    padding: 7px 10px;
    font-size: 12px;
    color: rgba(#fff, 0.8);
    background: transparent;
    border-right: 1px solid rgba(#fff, 0.16);
    transition: all 150ms ease;

    &:last-child {
      border-right: none;
    }

    &:hover {
      color: #fff;
      background: rgba(#fff, 0.06);
    }

    &.--active {
      color: #fff;
      background: rgba($color-secondary, 0.22);
    }
  }

  .ds-toggle {
    flex-shrink: 0;
    margin-left: auto;
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: rgba(#fff, 0.12);
    position: relative;
    cursor: pointer;
    border: none;
    transition: background 200ms ease;
    padding: 0;

    &.--on {
      background: $color-secondary;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &-knob {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: transform 200ms ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    &.--on .ds-toggle-knob {
      transform: translateX(18px);
    }
  }
}
</style>
