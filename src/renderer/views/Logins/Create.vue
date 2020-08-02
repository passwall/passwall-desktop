<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Login')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <form class="form" @submit.stop.prevent="onClickSave">
        <!-- Title -->
        <div class="form-row">
          <label v-text="$t('Title')" />
          <VFormText
            v-model="form.title"
            v-validate="'required'"
            name="Title"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
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
          <label v-text="$t('Username')" />
          <VFormText
            v-model="form.username"
            v-validate="'required'"
            name="Username"
            :placeholder="$t('ClickToFill')"
            theme="no-border"
          />
        </div>
        <!-- Password -->
        <div class="form-row">
          <label v-text="$t('Password')" />
          <div class="d-flex">
            <VFormText
              v-model="form.password"
              v-validate="'required'"
              name="Password"
              :type="showPass ? 'text' : 'password'"
              :placeholder="$t('ClickToFill')"
              theme="no-border"
            />
            <!-- Generate -->
            <GeneratePassword class="mt-2 mr-3" v-model="form.password" />
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-1 ml-n1"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
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
            <!-- Show/Hide -->
            <button
              class="detail-page-header-icon mt-1 ml-n1"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
          <VTextArea
            :placeholder="$t('ClickToFill')"
            v-model="form.extra"
            v-validate="'required'"
            name="Extra"
          />
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-3 mb-5 mx-3" :loading="$wait.is($waiters.Logins.Create)">
          {{ $t('Save') }}
        </VButton>
      </form>
    </div>
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
        password: ''
      }
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