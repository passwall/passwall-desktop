<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <CompanyLogo :url="form.url" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Login')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <PerfectScrollbar class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('TITLE')" />
          <VFormText
            name="Title"
            theme="no-border"
            v-model="form.title"
            v-validate="'required'"
            :placeholder="$t('ClickToFill')"
          />
        </div>
        <!-- URL -->
        <div class="form-row">
          <label v-text="$t('URL')" />
          <VFormText
            v-model="form.url"
            v-validate="'required'"
            name="URL"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Username -->
        <div class="form-row">
          <label v-text="$t('USERNAME')" />
          <VFormText
            name="Username"
            v-model="form.username"
            v-validate="'required'"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('PASSWORD')" />
          <div class="d-flex">
            <VFormText
              name="Password"
              v-model="form.password"
              v-validate="'required'"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            
            <GeneratePassword v-model="form.password" />
            <CheckPassword :password="form.password" />
            <ShowPassButton @click="showPass = $event" />
            <ClipboardButton :copy="form.password" />
          </div>
        </div>
        <!-- Extra -->
        <div class="form-row">
          <div class="d-flex flex-content-between">
            <label v-text="$t('EXTRA')" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-2 ml-n1"
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12px" @click="showPass = false" />
              <VIcon name="eye" v-else size="12px" @click="showPass = true" />
            </button>
          </div>
          <VTextArea :placeholder="$t('ClickToFill')" v-model="form.extra" name="Extra" />
        </div>

        <!-- Save & Cancel -->
        <div class="d-flex m-3">
          <VButton class="flex-1" theme="text" :disabled="loading" @click="$router.back()">
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
import { mapActions, mapState } from 'vuex'

export default {
  data() {
    return {
      showPass: false,
      form: {
        title: '',
        url: '',
        username: '',
        password: '',
        extra: ''
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.Logins.Create)
    }
  },

  methods: {
    ...mapActions('Logins', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'Logins', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Logins.Create)
      })
    }
  }
}
</script>
