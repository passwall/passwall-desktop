<template>
  <div class="detail-page">
    <div class="detail-page-header">
      <!-- Avatar -->
      <div class="detail-page-header-avatar">
        <img v-if="form.src" :src="form.src" />
      </div>
      <!-- Summary -->
      <div class="detail-page-header-summary">
        <span v-text="$t('NewLogin')" class="url" />
        <span v-text="$t('Please fill all the necessary fields')" class="email" />
      </div>
    </div>
    <!-- Content -->
    <div class="detail-page-content">
      <div class="form">
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
              class="detail-page-header-icon mt-2 ml-n1"
              style="width: 20px; height: 20px;"
              v-tooltip="$t(showPass ? 'HidePassword' : 'ShowPassword')"
            >
              <EyeOffIcon v-if="showPass" size="12" @click="showPass = false" />
              <EyeIcon v-else size="12" @click="showPass = true" />
            </button>
          </div>
        </div>

        <!-- Save -->
        <VButton type="submit" class="mt-auto mb-5 mx-3" @click="onClickSave">
          {{ $t('Save') }}
        </VButton>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

// TODO
import CryptoJS from 'crypto-js'
import format from 'date-fns/format'

// TODO
const key = '82f2ceed4c503896c8a291e560bd4325' // change to your key
const iv = 'sinasinasisinaaa' // change to your iv
const apiKey = '123xxxyyyzzz' // change to your api key
const reqTime = format(new Date(), 'yyyyMMddHHmmss')


export default {
  data() {
    return {
      showPass: false,
      form: {
        url: '',
        username: '',
        password: ''
      }
    }
  },

  methods: {
    ...mapActions('Logins', ['Create', 'FetchAll']),

    // TODO
    aesEncrypt(txt) {
      const cipher = CryptoJS.AES.encrypt(txt, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC
      })

      return cipher.toString()
    },

    // TODO
    aesDencrypt(txt) {
      const cipher = CryptoJS.AES.decrypt(txt, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC
      })

      return CryptoJS.enc.Utf8.stringify(cipher).toString()
    },

    onClickSave() {
      this.$validator.validate().then(async result => {
        if (!result) return
        console.log(this.form)
        
        try {

          // TODO
          this.form.password = this.aesEncrypt(this.form.password)

          await this.Create(this.form)
          this.FetchAll()
          this.$router.push({ name: 'Logins', params: { refresh: true } })
        } catch (error) {
          console.log(error)
        }
      })
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
</style>
