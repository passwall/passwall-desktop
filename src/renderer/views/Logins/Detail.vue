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
      <!-- <button class="detail-page-header-icon ml-auto" v-tooltip="$t('Share')">
        <ShareIcon size="14" />
      </button> -->
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <TrashIcon size="14" />
      </button>
      <!-- Copy -->
      <button class="detail-page-header-icon" v-tooltip="$t('Copy')" v-clipboard:copy="loginCopyContent">
        <DuplicateIcon size="14" />
      </button>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <!-- Edit Btn -->
      <button
        v-if="!isEditMode"
        class="detail-page-header-icon edit-btn"
        v-tooltip="$t('Edit')"
        @click="isEditMode = true"
      >
        <PencilIcon size="14" />
      </button>
      <div class="form">
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.url"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.url" class="mr-2" />
            <ClipboardButton :copy="form.url" />
          </div>
        </div>
        <!-- E-Mail Address -->
        <div class="form-row">
          <label v-text="$t('EMailAddress')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.email"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.email" class="mr-2" />
            <ClipboardButton :copy="form.email" />
          </div>
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('Username')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.username"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.username" class="mr-2" />
            <ClipboardButton :copy="form.username" />
          </div>
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <VFormText
            v-if="isEditMode"
            type="password"
            v-model="form.password"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="showPass ? form.password : '●●●●●●'" class="mr-2" />
            <ClipboardButton :copy="form.password" />
            <!-- Show/Hide Pass -->
            <button
              class="detail-page-header-icon ml-2"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <EyeOffIcon v-if="showPass" size="12" @click="showPass = false" />
              <EyeIcon v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save -->
        <VButton type="submit" v-if="isEditMode" class="mt-auto mb-5 mx-3">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isEditMode: false,
      showPass: false,
      form: {}
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.init(to.params)
    next()
  },

  created() {
    this.init(this.$route.params)
  },

  computed: {
    loginCopyContent() {
      return `URL: ${this.form.url}
Username: ${this.form.username}
Password: ${this.form.password}`
    }
  },

  methods: {
    init(params) {
      if (params.data) {
        this.form = params.data
      } else {
        this.$router.back()
      }
    },

    onClickDelete() {},

    onClickUpdate() {
      this.isEditMode = false
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background-color: $color-gray-500;
      margin-left: $spacer-3;
      color: $color-gray-300;
    }
  }

  &-content {
    position: relative;
    height: calc(100% - 64px);

    .edit-btn {
      position: absolute;
      top: 37px;
      right: 32px;
    }
  }
}

.form {
  padding: $spacer-3;
  height: 100%;

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
