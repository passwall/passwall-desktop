<template>
  <div class="sidebar">
    <div class="account">
      <!-- Avatar -->
      <VAvatar :pro="hasProPlan" :name="user.name" />
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
        </div>
      </div>
    </div>

    <!-- Logins -->
    <MenuItem :service="$C.Services.Logins" :name="$t('Logins')" icon="lock-closed" />

    <!-- Credit Cards -->
    <MenuItem
      :service="$C.Services.CreditCards"
      :name="$t('Credit Cards')"
      icon="credit-card"
      :lock="!hasProPlan"
    />

    <!-- Bank Accounts -->
    <MenuItem
      :service="$C.Services.BankAccounts"
      :name="$t('Bank Accounts')"
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

    <button class="btn-empty-fix"></button>

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
        <VIcon name="external-link" size="11px" />
      </div>
    </button>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import HTTPClient from '@/api/HTTPClient'
import MenuItem from './MenuItem'
import electron from 'electron'

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

    accountMenuClass() {
      return [this.hasProPlan ? '--pro-plan' : '--free-plan', { '--open': this.showAccountMenu }]
    }
  },

  methods: {
    onClickUpdateApp() {
      electron.shell.openExternal(this.updateLink || 'https://passwall.io')
    },

    async checkUpdate() {
      const { version } = require('../../../../../package.json')
      try {
        const { data } = await HTTPClient.get(
          'https://api.github.com/repos/passwall/passwall-desktop/releases/latest',
          {},
          { Authorization: null }
        )

        this.hasUpdate = data.tag_name != version
        this.updateLink = data.html_url
      } catch (err) {
        console.log(err)
      }
    },

    onClickFeedback() {
      electron.shell.openExternal('https://passwall.typeform.com/to/GAv1h2')
    },

    onClickUpgrade() {
      window.Paddle.Checkout.open({
        product: 630862,
        email: this.user.email,
        successCallback: this.onClickLogout
      })
    },

    onClickUpdate() {
      electron.shell.openExternal(this.user.update_url)
    },

    onClickCancel() {
      electron.shell.openExternal(this.user.cancel_url)
    }
  }
}
</script>

<style lang="scss">
.sidebar {
  width: 200px;
  min-width: 200px;
  height: 100%;
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
      }

      &-plan {
        font-size: 12px;
        line-height: 18px;
        color: $color-secondary;
      }
    }
  }

  .btn-empty-fix {
    margin-top: auto;
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
