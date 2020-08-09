<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('New Email')" class="url" />
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

        <!-- Email -->
        <div class="form-row">
          <label v-text="$t('Email')" />
          <VFormText
            v-model="form.email"
            v-validate="'required'"
            name="Email"
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
              v-tooltip="$t(showPass ? 'Hide' : 'Show')"
            >
              <VIcon name="eye-off" v-if="showPass" size="12" @click="showPass = false" />
              <VIcon name="eye" v-else size="12" @click="showPass = true" />
            </button>
          </div>
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
        email: '',
        password: ''
      }
    }
  },

  computed: {
    loading() {
      return this.$wait.is(this.$waiters.Emails.Create)
    }
  },

  methods: {
    ...mapActions('Emails', ['Create', 'FetchAll']),

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return

        const onSuccess = async () => {
          await this.Create({ ...this.form })
          this.FetchAll()
          this.$router.push({ name: 'Emails', params: { refresh: true } })
        }

        this.$request(onSuccess, this.$waiters.Emails.Create)
      })
    }
  }
}
</script>
