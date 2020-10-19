<template>
  <div class="add-item-menu" :class="{ '--active': active }">
    <!-- Items -->
    <div class="add-item-menu-items">
      <!-- Logins -->
      <button @click="onClickItem('LoginCreate')" class="add-item-menu-item">
        <VIcon name="lock-closed" size="14px" class="icon" />
        {{ $t('Login') }}
      </button>

      <!-- Credit Cards -->
      <button
        @click="onClickItem('CreditCardCreate')"
        class="add-item-menu-item"
        :class="{ '--lock': !hasProPlan }"
      >
        <VIcon name="credit-card" size="14px" class="icon" />
        {{ $t('Credit Cards') }}
        <!-- Premium -->
        <div class="premium-icon"><VIcon name="star" size="8px" class="c-secondary" /></div>
      </button>

      <!-- Bank Accounts -->
      <button
        @click="onClickItem('BankAccountCreate')"
        class="add-item-menu-item"
        :class="{ '--lock': !hasProPlan }"
      >
        <VIcon name="bank-account" size="14px" class="icon" />
        {{ $t('Bank Accounts') }}
        <!-- Premium -->
        <div class="premium-icon"><VIcon name="star" size="8px" class="c-secondary" /></div>
      </button>

      <!-- Emails -->
      <button
        @click="onClickItem('EmailCreate')"
        class="add-item-menu-item"
        :class="{ '--lock': !hasProPlan }"
      >
        <VIcon name="email" size="14px" class="icon" />
        {{ $t('Emails') }}
        <!-- Premium -->
        <div class="premium-icon"><VIcon name="star" size="8px" class="c-secondary" /></div>
      </button>

      <!-- Private Notes -->
      <button
        @click="onClickItem('NoteCreate')"
        class="add-item-menu-item"
        :class="{ '--lock': !hasProPlan }"
      >
        <VIcon name="private-note" size="14px" class="icon" />
        {{ $t('Private Notes') }}
        <!-- Premium -->
        <div class="premium-icon"><VIcon name="star" size="8px" class="c-secondary" /></div>
      </button>

      <!-- Servers -->
      <button
        @click="onClickItem('ServerCreate')"
        class="add-item-menu-item"
        :class="{ '--lock': !hasProPlan }"
      >
        <VIcon name="server" size="14px" class="icon" />
        {{ $t('Servers') }}
        <!-- Premium -->
        <div class="premium-icon"><VIcon name="star" size="8px" class="c-secondary" /></div>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'AddItemMenu',

  props: {
    active: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters(['hasProPlan'])
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
  background: rgba($color-gray-600, 0.8);
  display: none;

  &.--active {
    display: block;
  }

  &-items {
    position: absolute;
    bottom: 68px;
    right: 12px;
    z-index: 99;
    width: 200px;
    border-radius: 8px;
    background: black;
    display: flex;
    flex-direction: column;
    padding: $spacer-3 0;

    .add-item-menu-item {
      display: flex;
      padding: 10px $spacer-4;
      color: #fff;
      cursor: pointer;

      &.--lock {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: $color-primary;
  box-shadow: 10px 20px 20px rgba(0, 0, 0, 0.3);

  &.--active {
    transform: rotate(45deg);
  }
}
</style>
