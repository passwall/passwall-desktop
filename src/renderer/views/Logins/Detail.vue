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
        <span v-text="form.username" class="email" />
      </div>

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="loginCopyContent"
      >
        <VIcon name="duplicate" size="14" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14" />
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
        <VIcon name="pencil" size="14" />
      </button>

      <form class="form" @submit.stop.prevent="onClickUpdate">
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
            <GeneratePassword v-if="isEditMode" class="mt-1 mx-2" v-model="form.password" />
            <!-- Show/Hide Pass -->
            <button
              type="button"
              class="detail-page-header-icon mt-1 ml-2"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-content-between">
            <label v-text="$t('Extra')" />
            <!-- Copy -->
            <ClipboardButton :copy="form.extra" class="mt-2" />
            <!-- Show/Hide Pass -->
            <button
              type="button"
              class="detail-page-header-icon mt-1 ml-2"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
          <div class="d-flex">
            <VTextArea v-if="isEditMode" v-model="form.extra" :placeholder="$t('ClickToFill')" />
            <VTextArea
              v-else
              :value="showPass ? form.extra : ''"
              :placeholder="$t('contentHidden')"
              disabled
            />
          </div>
        </div>

        <!-- Save -->
        <VButton
          v-if="isEditMode"
          type="submit"
          :loading="$wait.is($waiters.Logins.Update)"
          class="mt-4 mb-5 mx-3"
        >
          {{ $t('Save') }}
        </VButton>
      </form>
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
    this.getDetail(to.params.id)
    next()
  },

  created() {
    this.getDetail(this.$route.params.id)
  },

  methods: {
    ...mapActions('Logins', ['Get', 'Delete', 'Update']),

    getDetail(id) {
      const onSuccess = async () => {
        await this.Get(id)
        this.form = { ...this.Detail }
      }

      const onError = () => {
        this.$router.back()
      }

      this.$request(onSuccess, this.$waiters.Logins.Get, onError)
    },

    onClickDelete() {
      const onSuccess = async () => {
        await this.Delete(this.form.id)
        const index = this.ItemList.findIndex(item => item.id == this.form.id)
        if (index !== -1) {
          this.ItemList.splice(index, 1)
        }
        this.$router.push({ name: 'Logins', params: { refresh: true } })
      }

      this.$request(onSuccess, this.$waiters.Logins.Delete)
    },

    async onClickUpdate() {
      const onSuccess = async () => {
        await this.Update({ ...this.form })
        this.$router.push({ name: 'Logins', params: { refresh: true } })
      }

      await this.$request(onSuccess, this.$waiters.Logins.Update)
      this.isEditMode = false
    }
  },

  computed: {
    ...mapState('Logins', ['Detail', 'ItemList']),

    loginCopyContent() {
      return (
        `Title: ${this.form.title}\n` +
        `URL: ${this.form.url}\n` +
        `Username: ${this.form.username}\n` +
        `Password: ${this.form.password}` +
        `Extra: ${this.form.extra}\n`
      )
    }
  }
}
</script>
