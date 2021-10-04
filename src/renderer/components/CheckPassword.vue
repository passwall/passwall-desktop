<template>
  <button
    type="button"
    @click="checkPassword"
    class="password-check-btn ml-1"
    v-tooltip="$t('CheckIfExposed')"
  >
    <VIcon name="check" size="14px" />
  </button>
</template>

<script>
import Axios from 'axios'
import CryptoUtils from '@/utils/crypto'

export default {
  name: 'CheckPassword',

  props: {
    password: {
      type: String,
      default: ''
    }
  },

  methods: {
    async checkPassword() {
      let text = ""
      if (this.password === "") {
        text = this.$t(`Please enter your password to check if password has been exposed.`)
        this.$notifyError(text)
        return
      }
      var hash = CryptoUtils.sha1(this.password)
      var first = hash.substring(0, 5)
      var last = hash.slice(hash.length - 5)
      var found = false
      var times = ""

      try {
        const response = await Axios.get(`https://api.pwnedpasswords.com/range/${first}`)
        var returnedPasswords = response.data.split('\n')
        for (var i = 0; i < returnedPasswords.length; i++) {
          var row = returnedPasswords[i].split(':')
          if (row[0].slice(row[0].length - 5) === last) {
            found = true
            times = row[1]
            break
          }
        }

        if (found) {
          text = this.$t(`Password has been exposed ${times} time(s) in data breaches. You should change it.`)
          this.$notifyWarn(text)
        } else {
          text = this.$t(`This password was not found in any known data breaches. It should be safe to use.`)
          this.$notifySuccess(text)
        }

      } catch (err) {
        let text = this.$t('Ooops! Something went wrong!')
        this.$notifyError(text)
        // Handle Error Here
        console.error(err)
      }
    }
  }
}
</script>

<style lang="scss">
.password-check-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: $color-gray-500;
  color: $color-gray-300;
}

</style>
