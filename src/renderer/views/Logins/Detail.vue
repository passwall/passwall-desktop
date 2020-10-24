<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="getTitle" class="url" />
        <span v-text="form.username" class="email" />
      </div>

      <!-- Copy -->
      <button
        class="detail-page-header-icon"
        v-tooltip="$t('Copy')"
        v-clipboard:copy="loginCopyContent"
      >
        <VIcon name="duplicate" size="14px" />
      </button>
      <!-- Delete -->
      <button class="detail-page-header-icon" v-tooltip="$t('Delete')" @click="onClickDelete">
        <VIcon name="trash" size="14px" />
      </button>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <!-- Edit Btn -->
      <button
        v-if="!isEditMode"
        class="detail-page-header-icon edit-btn"
        v-tooltip="$t('Edit')"
        @click="isEditMode = true"
      >
        <VIcon name="pencil" size="14px" />
      </button>

      <form class="form" @submit.stop.prevent="onClickUpdate">
        <!-- Title -->
        <FormRowText v-model="form.title" :title="$t('Title')" :edit-mode="isEditMode" />

        <!-- URL -->
        <FormRowText v-model="form.url" :title="$t('URL')" :edit-mode="isEditMode" />

        <!-- Username -->
        <FormRowText v-model="form.username" :title="$t('Username')" :edit-mode="isEditMode" />

        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <div class="d-flex flex-items-center">
            <VFormText
              v-if="isEditMode"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              v-model="form.password"
              theme="no-border"
            />
            <!-- Text -->
            <div v-else class="d-flex px-3 py-2">
              <span v-text="showPass ? form.password : '●●●●●●'" class="mr-2" />
            </div>
            <!-- Copy -->
            <ClipboardButton :copy="form.password" />
            <!-- Generate -->
            <GeneratePassword v-if="isEditMode" class="mx-2" v-model="form.password" />
            <!-- Show/Hide -->
            <button
              type="button"
              @click="showPass = !showPass"
              class="detail-page-header-icon ml-2"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon :name="showPass ? 'eye-off' : 'eye'" size="12px" />
            </button>
          </div>
        </div>

        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-items-end flex-content-between">
            <label v-text="$t('Extra')" />
            <div class="d-flex flex-items-center">
              <!-- Copy -->
              <ClipboardButton :copy="form.extra" />
              <!-- Show/Hide -->
              <button
                type="button"
                @click="showExtra = !showExtra"
                class="detail-page-header-icon ml-2"
                v-tooltip="$t(showExtra ? 'Hide' : 'Show')"
              >
                <VIcon :name="showExtra ? 'eye-off' : 'eye'" size="12px" />
              </button>
            </div>
          </div>
          <div class="d-flex">
            <VTextArea
              v-model="form.extra"
              :sensitive="!isEditMode && !showExtra"
              :placeholder="$t(isEditMode ? 'ClickToFill' : 'ContentHidden')"
              :disabled="!isEditMode"
            />
          </div>
        </div>

        <!-- Save & Cancel -->
        <div class="d-flex m-3" v-if="isEditMode">
          <VButton class="flex-1" theme="text" :disabled="loading" @click="isEditMode = false">
            {{ $t('Cancel') }}
          </VButton>
          <VButton class="flex-1" type="submit" :loading="loading">
            {{ $t('Save') }}
          </VButton>
        </div>
      </form>
    </PerfectScrollbar>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  data() {
    return {
      isEditMode: false,
      showPass: false,
      showExtra: false,
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

    loading() {
      return this.$wait.is(this.$waiters.Logins.Update)
    },

    loginCopyContent() {
      return (
        `Title: ${this.form.title}\n` +
        `URL: ${this.form.url}\n` +
        `Username: ${this.form.username}\n` +
        `Password: ${this.form.password}` +
        `Extra: ${this.form.extra}\n`
      )
    },
    getTitle(){
      return this.form.title ? this.form.title : this.form.url
    }
  }
}
</script>
