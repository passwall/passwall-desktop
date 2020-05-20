<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.url" class="url" />
        <span v-text="form.email" class="email" />
      </div>
      <!-- Share -->
      <button class="detail-page-header-icon ml-auto" v-tooltip="$t('Share')">
        <ShareIcon size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')">
        <TrashIcon size="14" />
      </button>
      <!-- Copy -->
      <button class="detail-page-header-icon" v-tooltip="$t('Copy')">
        <ClipboardCopyIcon size="14" />
      </button>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <div class="form">
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>
        <!-- E-Mail Address -->
        <div class="form-row">
          <label v-text="$t('EMailAddress')" />
          <VFormText :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('Username')" />
          <VFormText :placeholder="$t('ClickToFill')" theme="no-border" />
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <!-- <VFormPassword :placeholder="$t('ClickToFill')" theme="no-border" /> -->
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-auto mb-5 mx-3">{{ $t('Save') }}</VButton>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        url: '',
        email: '',
        username: '',
        password: ''
      }
    }
  },

  computed: {
    data() {
      return this.$route.params.data
    }
  }
}
</script>

<style lang="scss">
.detail-page {
  width: 100%;
  height: 100vh;
  border-left: 1px solid black;
  background-color: $color-gray-600;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    border-bottom: 1px solid black;
    padding: 0 $spacer-5;

    &-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background-color: $color-gray-400;
    }

    &-summary {
      color: #fff;
      margin: 0 auto 0 $spacer-3;
      display: flex;
      flex-direction: column;

      .url {
        font-weight: bold;
        font-size: 12px;
        line-height: 16px;
      }

      .email {
        font-weight: normal;
        font-size: 10px;
        line-height: 16px;
      }
    }

    &-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background-color: $color-gray-500;
      margin-left: $spacer-3;
      color: $color-gray-300;
    }
  }
}

.form {
  padding: $spacer-3;

  &,
  &-row {
    display: flex;
    flex-direction: column;
  }

  &-row {
    border-bottom: 1px solid $color-gray-500;

    label {
      font-weight: $font-weight-medium;
      font-size: $font-size-small;
      line-height: 16px;
      margin: $spacer-2 $spacer-3 0 $spacer-3;
    }

    &:last-of-type {
      border: 0;
    }
  }
}
</style>
