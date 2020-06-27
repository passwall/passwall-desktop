<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="form.title" class="url" />
        <span v-text="form.email" class="email" />
      </div>
      
      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="emailCopyContent"
      >
        <DuplicateIcon size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <TrashIcon size="14" />
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
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('Title')" />
          <VFormText
            v-if="isEditMode"
            v-model="form.title"
            theme="no-border"
            :placeholder="$t('ClickToFill')"
          />
          <!-- Text -->
          <div v-else class="d-flex flex-items-center px-3 py-2">
            <span v-text="form.title" class="mr-2" />
            <ClipboardButton :copy="form.title" />
          </div>
        </div>
        <!-- Email -->
        <div class="form-row">
          <label v-text="$t('Email')" />
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

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <div class="d-flex">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              v-model="form.password"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex flex-items-center px-3 py-2">
              <span v-text="showPass ? form.password : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.password" class="mt-2" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mt-2 mx-2" v-model="form.password" />
            <!-- Show/Hide Pass -->
            <button
              class="detail-page-header-icon mt-2 ml-2"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <EyeOffIcon v-if="showPass" size="12" @click="showPass = false" />
              <EyeIcon v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save -->
        <VButton v-if="isEditMode" @click="onClickUpdate" class="mt-auto mb-5 mx-3">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      isEditMode: false,
      showPass: false,
      form: {}
    }
  },

  beforeRouteUpdate(to, from, next) {
    this.isEditMode = false
    this.showPass = false
    this.init(to.params)
    next()
  },

  created() {
    this.init(this.$route.params)
  },

  methods: {
    ...mapActions('Emails', ['Get', 'Delete', 'Update']),

    async init(params) {
      try {
        await this.Get(params.id)
        this.form = { ...this.Detail }
      } catch (error) {
        this.$router.back()
      }
    },

    async onClickDelete() {
      try {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Emails', params: { refresh: true } })
      } catch (err) {
        console.log(err)
      }
    },

    async onClickUpdate() {
      try {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'Emails', params: { refresh: true } })
      } catch (err) {
        console.log(err)
      } finally {
        this.isEditMode = false
      }
    }
  },

  computed: {
    ...mapState('Emails', ['Detail', 'ItemList']),

    emailCopyContent() {
      return `Title: ${this.form.title}\nEmail: ${this.form.email}\n`
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
        font-size: $font-size-normal;
        line-height: 16px;
      }

      .email {
        font-weight: normal;
        font-size: $font-size-mini;
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
      margin-left: $spacer-2;
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
</style>
