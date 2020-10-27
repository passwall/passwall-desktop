<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <div class="account-avatar" v-text="firstLettersOfName" />
      <!-- Info -->
      <div class="account-info">
        <span class="account-info-name" v-text="user.name" />
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

          <hr />
          <!-- Logout -->
          <button @click="onClickLogout">
            <VIcon name="logout" size="14px" rotation="180" class="c-danger mr-2" />
            {{ $t('Logout') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Logins -->
    <MenuItem :service="$C.Services.Logins" :name="$t('Logins')" icon="lock-closed" />

    <!-- Credit Cards -->
    <MenuItem
      :service="$C.Services.CreditCards"
      :name="$t('CreditCards')"
      icon="credit-card"
      :lock="!hasProPlan"
    />

    <!-- Bank Accounts -->
    <MenuItem
      :service="$C.Services.BankAccounts"
      :name="$t('BankAccounts')"
      icon="bank-account"
      :lock="!hasProPlan"
    />

    <!-- Emails -->
    <MenuItem :service="$C.Services.Emails" :name="$t('Emails')" icon="email" :lock="!hasProPlan" />

    <!-- Private Notes -->
    <MenuItem
      :service="$C.Services.Notes"
      :name="$t('Private Notes')"
      icon="private-note"
      :lock="!hasProPlan"
    />

    <!-- Servers -->
    <MenuItem
      :service="$C.Services.Servers"
      :name="$t('Servers')"
      icon="server"
      :lock="!hasProPlan"
    />

    <!-- Update -->
    <button v-if="hasUpdate" @click="onClickUpdateApp" class="update-box flex-center">
      {{ $t('There is an update available.') }}
    </button>

    <!-- Feedback -->
    <button class="btn-feedback" @click="onClickFeedback">
      <VIcon name="right-corner" class="right-corner" size="15px" v-if="!hasUpdate" />
      <VIcon name="right-corner" class="left-corner rot-180" size="15px" />

      {{ $t('GiveFeedback') }}
      <div class="icon">
        <VIcon name="external-link" size="8px" />
      </div>
    </button>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import HTTPClient from '@/api/HTTPClient'
import MenuItem from './MenuItem'
import { shell } from 'electron'

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

  created() {
    this.checkUpdate()
  },

  computed: {
    ...mapState(['user']),
    ...mapGetters(['hasProPlan']),

    firstLettersOfName() {
      const [firstName, lastName] = this.user.name.split(' ')
      return `${firstName[0]}${(lastName || ' ')[0]}`
    },

    accountMenuClass() {
      return [this.hasProPlan ? '--pro-plan' : '--free-plan', { '--open': this.showAccountMenu }]
    }
  },

  methods: {
    ...mapActions(['Logout']),

    onClickUpdateApp() {
      shell.openExternalSync(this.updateLink || 'https://passwall.io')
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
      shell.openExternalSync('https://passwall.typeform.com/to/GAv1h2')
    },

    onClickUpgrade() {
      window.Paddle.Checkout.open({
        product: 630862,
        email: this.user.email
      })
    },

    onClickUpdate() {
      shell.openExternalSync(this.user.update_url)
    },

    onClickCancel() {
      shell.openExternalSync(this.user.cancel_url)
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
  user-select: none;

  .account {
    position: relative;
    margin: 32px 0px;
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 $spacer-3;

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
      transition: all 0.1s ease;
      overflow: hidden;

      &.--open {
        border: 1px solid $color-gray-400;

        &.--free-plan {
          height: 130px;
        }

        &.--pro-plan {
          height: 167px;
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

        &:last-child {
          margin-bottom: 0px;
        }
      }
    }

    &-avatar {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
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
    margin-top: auto;

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

  svg {
    margin: 0;
  }
}
</style>
