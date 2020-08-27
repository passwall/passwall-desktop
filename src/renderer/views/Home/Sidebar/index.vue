<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <div class="account-avatar" v-text="firstLettersOfName" />
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="user.name" />
        <span class="account-info-plan" v-text="user.plan" />
      </div>
      <!-- Logout -->
      <button @click="onClickLogout" v-tooltip="$t('Logout')">
        <VIcon name="logout" size="14px" rotation="180" class="c-danger" />
      </button>
    </div>

    <!-- Logins -->
    <MenuItem
      :service="$C.Services.Logins"
      :name="$t('Logins')"
      icon="lock-closed"
      :plan="user.plan"
    />

    <!-- Credit Cards -->
    <MenuItem
      :service="$C.Services.CreditCards"
      :name="$t('CreditCards')"
      icon="credit-card"
      :plan="user.plan"
    />

    <!-- Bank Accounts -->
    <MenuItem
      :service="$C.Services.BankAccounts"
      :name="$t('BankAccounts')"
      icon="bank-account"
      :plan="user.plan"
    />

    <!-- Emails -->
    <MenuItem :service="$C.Services.Emails" :name="$t('Emails')" icon="email" :plan="user.plan" />

    <!-- Private Notes -->
    <MenuItem
      :service="$C.Services.Notes"
      :name="$t('Notes')"
      icon="private-note"
      :plan="user.plan"
    />

    <!-- Servers -->
    <MenuItem
      :service="$C.Services.Servers"
      :name="$t('Servers')"
      icon="server"
      :plan="user.plan"
    />

    <!-- Trash -->
    <MenuItem :service="$C.Services.Trash" :name="$t('Trash')" icon="trash" :plan="user.plan" />

    <!-- Update -->
    <button v-if="hasUpdate" @click="onClickUpdate" class="update-box flex-center">
      {{ $t('There is an update available.') }}
    </button>

    <!-- Feedback -->
    <button class="btn-feedback" @click="onClickFeedback">
      <VIcon name="right-corner" class="right-corner" size="15px" />
      <VIcon name="right-corner" class="left-corner rot-180" size="15px" />

      {{ $t('GiveFeedback') }}
      <div class="icon">
        <VIcon name="external-link" size="8px" />
      </div>
    </button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import HTTPClient from '@/api/HTTPClient'
import MenuItem from './MenuItem'

export default {
  components: {
    MenuItem
  },

  data() {
    return {
      hasUpdate: false,
      updateLink: null
    }
  },

  created() {
    this.checkUpdate()
  },

  computed: {
    ...mapState(['user']),

    firstLettersOfName() {
      const [firstName, lastName] = this.user.name.split(' ')
      return `${firstName[0]}${(lastName || ' ')[0]}`
    }
  },

  methods: {
    ...mapActions(['Logout']),

    onClickUpdate() {
      open(this.updateLink || 'https://passwall.io')
    },

    async checkUpdate() {
      const { version } = require('../../../../../package.json')
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
      background-color: $color-primary;
      font-weight: 700;
      color: #fff;
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

    &.--lock {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
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
    }

    &.router-link-active {
      color: #fff;

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
  pointer-events: all;

  svg {
    margin: 0;
  }
}
</style>
