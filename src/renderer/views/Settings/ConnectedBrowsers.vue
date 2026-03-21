<template>
  <div class="connected-browsers">
    <div class="cb-header">
      <div class="cb-header-info">
        <VIcon name="monitor" size="20px" class="c-secondary" />
        <div class="cb-header-text">
          <span class="cb-title">{{ $t('Connected Browsers') }}</span>
          <span class="cb-subtitle">{{
            $t('Browser extensions connected to this desktop app')
          }}</span>
        </div>
      </div>
    </div>

    <PerfectScrollbar class="cb-content">
      <!-- Browser List -->
      <div v-if="browsers.length > 0" class="cb-section">
        <div class="cb-section-title">{{ $t('Active Connections') }}</div>
        <div v-for="b in browsers" :key="b.origin" class="browser-item">
          <div class="browser-item-info">
            <VIcon name="monitor" size="16px" class="browser-item-icon" />
            <div class="browser-item-details">
              <span class="browser-item-name">{{ formatOrigin(b.origin) }}</span>
            </div>
            <span v-if="b.connected" class="browser-item-status --connected">{{
              $t('Connected')
            }}</span>
            <span v-else class="browser-item-status --offline">{{ $t('Offline') }}</span>
          </div>
          <button
            class="browser-item-remove"
            @click="removeBrowser(b.origin)"
            :title="$t('Remove')"
          >
            <VIcon name="trash" size="14px" />
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="cb-empty">
        <VIcon name="monitor" size="48px" class="cb-empty-icon" />
        <span class="cb-empty-title">{{ $t('No Browsers Connected') }}</span>
        <span class="cb-empty-text">
          {{
            $t(
              'Open the Passwall browser extension while this app is running. They will connect automatically.'
            )
          }}
        </span>
      </div>

      <!-- How It Works -->
      <div class="cb-section cb-how-it-works">
        <div class="cb-section-title">{{ $t('How It Works') }}</div>
        <div class="cb-step">
          <span class="cb-step-number">1</span>
          <span>{{ $t('Install the Passwall browser extension') }}</span>
        </div>
        <div class="cb-step">
          <span class="cb-step-number">2</span>
          <span>{{ $t('Keep this desktop app running and logged in') }}</span>
        </div>
        <div class="cb-step">
          <span class="cb-step-number">3</span>
          <span>{{
            $t('The extension connects automatically and stores keys securely in the OS keychain')
          }}</span>
        </div>
      </div>
    </PerfectScrollbar>
  </div>
</template>

<script>
export default {
  name: 'ConnectedBrowsers',

  data() {
    return {
      browsers: []
    }
  },

  async created() {
    await this.loadBrowsers()
  },

  methods: {
    async loadBrowsers() {
      if (!window.electronAPI?.pairing) return
      try {
        this.browsers = await window.electronAPI.pairing.getConnectedBrowsers()
      } catch {
        this.browsers = []
      }
    },

    async removeBrowser(origin) {
      if (!window.electronAPI?.pairing) return
      try {
        await window.electronAPI.pairing.removeBrowser(origin)
        this.browsers = this.browsers.filter((b) => b.origin !== origin)
      } catch {
        // ignore
      }
    },

    formatOrigin(origin) {
      if (!origin) return 'Unknown Browser'
      return origin.replace('chrome-extension://', 'Chrome Extension: ').replace(/\/$/, '')
    }
  }
}
</script>

<style lang="scss">
.connected-browsers {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .cb-header {
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

  .cb-title {
    color: #fff;
    font-size: $font-size-medium;
    font-weight: 600;
    line-height: 20px;
  }

  .cb-subtitle {
    color: $color-gray-300;
    font-size: 12px;
    line-height: 16px;
  }

  .cb-content {
    flex: 1;
    overflow-y: auto;
    padding: $spacer-3;
  }

  .cb-section {
    margin-bottom: $spacer-3;

    &-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: $color-gray-300;
      margin-bottom: $spacer-2;
    }
  }

  .browser-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacer-2;
    border-radius: $radius;
    background: rgba(#fff, 0.03);
    margin-bottom: $spacer-1;
    transition: background 150ms ease;

    &:hover {
      background: rgba(#fff, 0.06);
    }

    &-info {
      display: flex;
      align-items: center;
      gap: $spacer-2;
      flex: 1;
      min-width: 0;
    }

    &-icon {
      color: $color-gray-300;
      flex-shrink: 0;
    }

    &-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    &-name {
      color: #fff;
      font-size: $font-size-normal;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-status {
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: $spacer-2;

      &.--connected {
        color: $color-secondary;
        background: rgba($color-secondary, 0.12);
      }

      &.--offline {
        color: $color-gray-300;
        background: rgba(#fff, 0.06);
      }
    }

    &-remove {
      color: $color-gray-300;
      padding: $spacer-1;
      border-radius: $radius-2;
      transition:
        color 150ms ease,
        background 150ms ease;
      flex-shrink: 0;
      margin-left: $spacer-2;

      &:hover {
        color: #ff5555;
        background: rgba(#ff5555, 0.1);
      }
    }
  }

  .cb-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: $spacer-8 $spacer-3;

    &-icon {
      color: $color-gray-400;
      margin-bottom: $spacer-3;
    }

    &-title {
      color: #fff;
      font-size: $font-size-medium;
      font-weight: 600;
      margin-bottom: $spacer-1;
    }

    &-text {
      color: $color-gray-300;
      font-size: $font-size-normal;
      max-width: 280px;
      line-height: 1.5;
    }
  }

  .cb-how-it-works {
    margin-top: $spacer-3;
    padding-top: $spacer-3;
    border-top: 1px solid rgba(#fff, 0.06);
  }

  .cb-step {
    display: flex;
    align-items: flex-start;
    gap: $spacer-2;
    padding: $spacer-1 0;
    color: $color-gray-300;
    font-size: $font-size-normal;
    line-height: 1.4;

    &-number {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba($color-primary, 0.2);
      color: $color-primary;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
    }
  }
}
</style>
