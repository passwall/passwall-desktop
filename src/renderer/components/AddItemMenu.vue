<template>
  <div class="add-item-menu" :class="{ '--active': active }">
    <!-- Items -->
    <div class="add-item-menu-items">
      <!-- Passwords -->
      <button @click="onClickItem('PasswordCreate')" class="add-item-menu-item">
        <VIcon name="lock-closed" size="14px" class="icon" />
        {{ $t('Password') }}
      </button>

      <!-- Secure Notes -->
      <button @click="onClickItem('NoteCreate')" class="add-item-menu-item">
        <VIcon name="private-note" size="14px" class="icon" />
        {{ $t('Private Note') }}
      </button>

      <!-- Addresses -->
      <button @click="onClickItem('AddressCreate')" class="add-item-menu-item">
        <VIcon name="location-marker" size="14px" class="icon" />
        {{ $t('Address') }}
      </button>

      <!-- Payment Cards -->
      <button @click="onClickItem('CreditCardCreate')" class="add-item-menu-item">
        <VIcon name="credit-card" size="14px" class="icon" />
        {{ $t('Credit Card') }}
      </button>

      <!-- Bank Accounts -->
      <button @click="onClickItem('BankAccountCreate')" class="add-item-menu-item">
        <VIcon name="bank-account" size="14px" class="icon" />
        {{ $t('Bank Account') }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddItemMenu',

  props: {
    active: {
      type: Boolean,
      default: false
    }
  },

  methods: {
    onClickItem(name) {
      this.$router.push({ name })
      this.$emit('hide')
    }
  }
}
</script>

<style lang="scss">
.add-item-menu {
  width: 295px;
  height: 100%;
  position: absolute;
  background: rgba($color-gray-600, 0.85);
  backdrop-filter: blur(4px);
  display: none;

  &.--active {
    display: block;
  }

  &-items {
    position: absolute;
    bottom: 68px;
    right: 12px;
    z-index: 99;
    width: 210px;
    border-radius: 10px;
    background: $color-gray-500;
    border: 1px solid rgba(#fff, 0.06);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    padding: 8px 0;

    .add-item-menu-item {
      display: flex;
      align-items: center;
      padding: 10px $spacer-4;
      color: #fff;
      cursor: pointer;
      font-size: 13px;
      transition: background-color 150ms ease;

      &:hover {
        background-color: rgba(#fff, 0.05);
      }

      .icon {
        margin-right: $spacer-2;
      }
    }
  }
}

.add-item-menu-btn {
  position: absolute;
  right: 12px;
  bottom: 14px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: $color-primary;
  box-shadow: 0 4px 16px rgba($color-primary, 0.4);
  transition: all 200ms ease;

  &:hover {
    background-color: #6e2bff;
    box-shadow: 0 6px 20px rgba($color-primary, 0.5);
    transform: scale(1.05);
  }

  &.--active {
    transform: rotate(45deg);
    background-color: $color-danger;
    box-shadow: 0 4px 16px rgba($color-danger, 0.4);
  }
}
</style>
