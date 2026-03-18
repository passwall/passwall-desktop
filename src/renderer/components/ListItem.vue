<template>
  <div class="list-item" :class="{ '--active': active }" @click="$emit('click')">
    <!-- Avatar -->
    <div class="list-item-avatar">
      <CompanyLogo :url="getUrl" />
    </div>
    <!-- Summary -->
    <div class="list-item-summary">
      <span v-text="getTitle" class="url" />
      <span v-text="getUsername" class="username" />
    </div>
    <!-- Detail -->
    <button class="list-item-detail">
      <VIcon name="chevron-right" size="14px" />
    </button>
  </div>
</template>

<script>
export default {
  name: 'ListItem',

  props: {
    data: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: String,
      default: 'NotLogin'
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    getTitle: function () {
      if (this.type === 'Login' || this.type === 'Password') {
        return this.data.name || this.data.title || this.data.url
      }
      return this.data.title || this.data.name
    },
    getUrl: function () {
      if (this.type === 'Login' || this.type === 'Password') {
        return this.data.url || this.data.title || this.data.name
      }
      return this.data.title || this.data.name
    },
    getUsername: function () {
      if (this.type === 'Login' || this.type === 'Password') return this.data.username
      else if (this.type === 'Address') return this.data.address
      else if (this.type === 'BankAccount') return this.data.iban
      else if (this.type === 'CreditCard') return this.data.number
      else if (this.type === 'Server') return this.data.ip
      else return ''
    }
  }
}
</script>

<style lang="scss">
.list-item {
  height: 64px;
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  background-color: black;
  border-bottom: 1px solid rgba(#fff, 0.04);
  transition: background-color 150ms ease;

  &:hover:not(.--active) {
    background-color: rgba(#fff, 0.03);
  }

  &.--active {
    background: $color-gray-600;
    border-left: 2px solid $color-primary;
  }

  &-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background-color: $color-gray-400;
    margin-left: $spacer-3;
    flex-shrink: 0;
  }

  &-summary {
    color: #fff;
    margin: 0 auto 0 $spacer-3;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .url {
      font-weight: 600;
      font-size: $font-size-normal;
      line-height: 18px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .username {
      font-weight: normal;
      font-size: $font-size-mini;
      line-height: 16px;
      color: $color-gray-300;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &-detail {
    margin: 0 $spacer-3 0 auto;
    color: $color-gray-300;
    transition:
      color 150ms ease,
      transform 150ms ease;
    flex-shrink: 0;
  }

  &:hover &-detail {
    color: $color-secondary;
    transform: translateX(2px);
  }
}
</style>
