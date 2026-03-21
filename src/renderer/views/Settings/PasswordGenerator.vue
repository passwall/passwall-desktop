<template>
  <div class="password-generator-page">
    <div class="pg-header">
      <div class="pg-header-info">
        <VIcon name="refresh" size="20px" class="c-secondary" />
        <div class="pg-header-text">
          <span class="pg-title">{{ $t('Password Generator') }}</span>
          <span class="pg-subtitle">{{ $t('Create strong and unique passwords instantly') }}</span>
        </div>
      </div>
    </div>

    <PerfectScrollbar class="pg-content">
      <div class="pg-card">
        <div class="pg-password-row">
          <input class="pg-password-input" :value="password" readonly />
          <button class="pg-icon-btn" @click="generatePassword" :title="$t('Generate')">
            <VIcon name="refresh" size="15px" />
          </button>
          <button class="pg-icon-btn" @click="copyPassword" :title="$t('Copy')">
            <VIcon name="clipboard-copy" size="15px" />
          </button>
        </div>

        <div class="pg-quick-lengths">
          <button
            v-for="size in quickLengths"
            :key="size"
            class="pg-chip"
            :class="{ '--active': length === size }"
            @click="setLength(size)"
          >
            {{ size }}
          </button>
        </div>

        <div class="pg-length-row">
          <div class="pg-label-group">
            <span class="pg-label">{{ $t('Length') }}</span>
            <span class="pg-value">{{ length }}</span>
          </div>
          <input
            type="range"
            class="pg-range"
            min="8"
            max="64"
            v-model.number="length"
            @input="generatePassword"
          />
        </div>

        <div class="pg-options">
          <label class="pg-option">
            <input type="checkbox" v-model="options.uppercase" @change="onOptionsChanged" />
            <span>{{ $t('Uppercase letters') }}</span>
          </label>
          <label class="pg-option">
            <input type="checkbox" v-model="options.lowercase" @change="onOptionsChanged" />
            <span>{{ $t('Lowercase letters') }}</span>
          </label>
          <label class="pg-option">
            <input type="checkbox" v-model="options.numbers" @change="onOptionsChanged" />
            <span>{{ $t('Numbers') }}</span>
          </label>
          <label class="pg-option">
            <input type="checkbox" v-model="options.symbols" @change="onOptionsChanged" />
            <span>{{ $t('Symbols') }}</span>
          </label>
          <label class="pg-option">
            <input type="checkbox" v-model="options.excludeAmbiguous" @change="generatePassword" />
            <span>{{ $t('Exclude ambiguous characters') }}</span>
          </label>
        </div>

        <div class="pg-strength">
          <div class="pg-label-group">
            <span class="pg-label">{{ $t('Strength') }}</span>
            <span class="pg-strength-text" :class="strength.className">{{ strength.label }}</span>
          </div>
          <div class="pg-strength-track">
            <div
              class="pg-strength-fill"
              :class="strength.className"
              :style="{ width: `${strength.percent}%` }"
            />
          </div>
          <span class="pg-strength-hint"
            >{{ $t('Estimated entropy') }}: {{ strength.entropy }} bits</span
          >
        </div>
      </div>
    </PerfectScrollbar>
  </div>
</template>

<script>
const CHARSETS = Object.freeze({
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  numbers: '23456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?'
})

const AMBIGUOUS_CHARS = new Set(['l', 'I', '1', 'O', '0', '|'])

export default {
  name: 'PasswordGenerator',

  data() {
    return {
      password: '',
      length: 20,
      quickLengths: [16, 20, 24, 32],
      options: {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
        excludeAmbiguous: true
      }
    }
  },

  computed: {
    activeSetsCount() {
      return ['uppercase', 'lowercase', 'numbers', 'symbols'].filter((k) => this.options[k]).length
    },
    availableLength() {
      return Math.max(this.length, this.activeSetsCount || 1)
    },
    strength() {
      const poolSize = this.getPool().length
      const entropy = poolSize > 0 ? Math.round(this.availableLength * Math.log2(poolSize)) : 0
      const percent = Math.max(6, Math.min(100, Math.round((entropy / 128) * 100)))

      if (entropy < 50) return { label: this.$t('Weak'), className: '--weak', percent, entropy }
      if (entropy < 70) return { label: this.$t('Fair'), className: '--fair', percent, entropy }
      if (entropy < 90) return { label: this.$t('Good'), className: '--good', percent, entropy }
      if (entropy < 110)
        return { label: this.$t('Strong'), className: '--strong', percent, entropy }
      return { label: this.$t('Very Strong'), className: '--very-strong', percent, entropy }
    }
  },

  created() {
    this.generatePassword()
  },

  methods: {
    setLength(size) {
      this.length = size
      this.generatePassword()
    },
    onOptionsChanged() {
      if (!this.activeSetsCount) {
        this.options.lowercase = true
      }
      this.generatePassword()
    },
    getSet(key) {
      const raw = CHARSETS[key] || ''
      if (!this.options.excludeAmbiguous) return raw
      return Array.from(raw)
        .filter((ch) => !AMBIGUOUS_CHARS.has(ch))
        .join('')
    },
    getPool() {
      const parts = ['uppercase', 'lowercase', 'numbers', 'symbols']
        .filter((key) => this.options[key])
        .map((key) => this.getSet(key))
        .filter(Boolean)
      return parts.join('')
    },
    randomFrom(str) {
      if (!str) return ''
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return str[arr[0] % str.length]
    },
    shuffle(chars) {
      const output = [...chars]
      for (let i = output.length - 1; i > 0; i--) {
        const arr = new Uint32Array(1)
        crypto.getRandomValues(arr)
        const j = arr[0] % (i + 1)
        const temp = output[i]
        output[i] = output[j]
        output[j] = temp
      }
      return output
    },
    generatePassword() {
      const selectedKeys = ['uppercase', 'lowercase', 'numbers', 'symbols'].filter(
        (key) => this.options[key]
      )
      if (!selectedKeys.length) {
        this.password = ''
        return
      }

      const effectiveLength = this.availableLength
      const required = selectedKeys.map((key) => this.randomFrom(this.getSet(key))).filter(Boolean)
      const pool = this.getPool()
      const chars = [...required]

      while (chars.length < effectiveLength) {
        chars.push(this.randomFrom(pool))
      }

      this.password = this.shuffle(chars).join('')
    },
    async copyPassword() {
      if (!this.password) return
      try {
        await navigator.clipboard.writeText(this.password)
        this.$notifySuccess(this.$t('Password copied to clipboard'))
      } catch {
        this.$notifyError(this.$t('Failed to copy password'))
      }
    }
  }
}
</script>

<style lang="scss">
.password-generator-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .pg-header {
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

  .pg-title {
    color: #fff;
    font-size: $font-size-normal;
    font-weight: 600;
    line-height: 20px;
  }

  .pg-subtitle {
    color: $color-gray-300;
    font-size: 11px;
    line-height: 16px;
  }

  .pg-content {
    flex: 1;
    overflow-y: auto;
    padding: $spacer-3;
  }

  .pg-card {
    border-radius: 12px;
    border: 1px solid rgba(#fff, 0.08);
    background: rgba(#fff, 0.02);
    padding: $spacer-3;
  }

  .pg-password-row {
    display: flex;
    align-items: center;
    gap: $spacer-2;
  }

  .pg-password-input {
    flex: 1;
    height: 44px;
    border: 1px solid rgba(#fff, 0.1);
    border-radius: 10px;
    background: #0d141e;
    color: #fff;
    font-family: Menlo, Monaco, Consolas, monospace;
    font-size: 14px;
    padding: 0 12px;
  }

  .pg-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid rgba(#fff, 0.1);
    color: #fff;
    background: rgba(#fff, 0.03);
    transition: all 150ms ease;

    &:hover {
      color: $color-secondary;
      border-color: rgba($color-secondary, 0.45);
      background: rgba($color-secondary, 0.1);
    }
  }

  .pg-quick-lengths {
    margin-top: $spacer-2;
    display: flex;
    gap: 8px;
  }

  .pg-chip {
    min-width: 44px;
    height: 28px;
    border-radius: 14px;
    border: 1px solid rgba(#fff, 0.14);
    color: #fff;
    background: transparent;
    font-size: 12px;

    &.--active {
      border-color: rgba($color-secondary, 0.5);
      background: rgba($color-secondary, 0.16);
      color: $color-secondary;
      font-weight: 600;
    }
  }

  .pg-length-row {
    margin-top: $spacer-3;
  }

  .pg-label-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .pg-label {
    font-size: 12px;
    color: $color-gray-300;
  }

  .pg-value {
    font-size: 12px;
    color: #fff;
    font-weight: 600;
  }

  .pg-range {
    width: 100%;
    accent-color: $color-secondary;
  }

  .pg-options {
    margin-top: $spacer-3;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .pg-option {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border: 1px solid rgba(#fff, 0.08);
    border-radius: 8px;
    padding: 8px 10px;
    color: #fff;
    font-size: 12px;
    background: rgba(#fff, 0.02);
    cursor: pointer;
  }

  .pg-option input[type='checkbox'] {
    accent-color: $color-secondary;
  }

  .pg-strength {
    margin-top: $spacer-3;
    border-top: 1px solid rgba(#fff, 0.08);
    padding-top: $spacer-3;
  }

  .pg-strength-text {
    font-size: 12px;
    font-weight: 600;

    &.--weak {
      color: #ff7676;
    }
    &.--fair {
      color: #ffb168;
    }
    &.--good {
      color: #f4dd76;
    }
    &.--strong {
      color: #7de695;
    }
    &.--very-strong {
      color: #4ff0c6;
    }
  }

  .pg-strength-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(#fff, 0.08);
    overflow: hidden;
  }

  .pg-strength-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 180ms ease;

    &.--weak {
      background: #ff7676;
    }
    &.--fair {
      background: #ffb168;
    }
    &.--good {
      background: #f4dd76;
    }
    &.--strong {
      background: #7de695;
    }
    &.--very-strong {
      background: #4ff0c6;
    }
  }

  .pg-strength-hint {
    margin-top: 8px;
    display: block;
    color: $color-gray-300;
    font-size: 11px;
  }
}
</style>
