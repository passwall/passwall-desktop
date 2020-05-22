<template>
  <div class="add-item-menu" :class="{ '--active': active }">
    <!-- Items -->
    <div class="add-item-menu-items">
      <!-- Logins -->
      <button @click="onClickItem('LoginCreate')" class="add-item-menu-item">
        <LockClosedIcon size="14" class="icon" />
        {{ $t('Login') }}
      </button>

      <!-- Credit Cards -->
      <button class="add-item-menu-item" disabled>
        <CreditCardIcon size="14" class="icon" />
        {{ $t('CreditCards') }}
        <!-- Premium -->
        <div class="premium-icon" v-tooltip=""><StarIcon size="8" class="c-secondary" /></div>
      </button>

      <!-- Identities -->
      <button class="add-item-menu-item" disabled>
        <UserIcon size="14" class="icon" />
        {{ $t('Identities') }}
        <!-- Premium -->
        <div class="premium-icon" v-tooltip=""><StarIcon size="8" class="c-secondary" /></div>
      </button>

      <!-- Address -->
      <button class="add-item-menu-item" disabled>
        <LocationMarkerIcon size="14" class="icon" />
        {{ $t('Address') }}
        <!-- Premium -->
        <div class="premium-icon" v-tooltip=""><StarIcon size="8" class="c-secondary" /></div>
      </button>

      <!-- Private Notes -->
      <button class="add-item-menu-item" disabled>
        <ClipboardCheckIcon size="14" class="icon" />
        {{ $t('PrivateNotes') }}
        <!-- Premium -->
        <div class="premium-icon" v-tooltip=""><StarIcon size="8" class="c-secondary" /></div>
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
