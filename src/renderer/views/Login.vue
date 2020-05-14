<template>
  <div class="login-container">
    <!-- Left Background -->
    <div>
      <Icon name="passwall-back" class="login-background" width="450px" height="540px" />
      <Icon name="right-corner" class="login-right-corner" size="82" />
    </div>
    <!-- Login Form -->
    <form class="login-form" @submit.stop.prevent="onLogin">
      <!-- E-Mail Address -->
      <div>
        <label>E-Mail Address</label>
        <FormText
          v-model="LoginForm.email"
          size="medium"
          v-validate="'required|email'"
          name="E-Mail"
          placeholder="E-Mail"
        />
      </div>
      <!-- Master Password -->
      <div>
        <label>Master Password</label>
        <FormText
          v-model="LoginForm.master_password"
          size="medium"
          v-validate="'required|min:6|max:100'"
          name="Master Password"
          placeholder="Master Password"
        />
      </div>
      <!-- Login Btn -->
      <Btn type="submit" size="medium">Login</Btn>
    </form>
  </div>
</template>

<script>
import FormText from '@/components/FormText'

export default {
  data() {
    return {
      LoginForm: {
        email: '',
        master_password: ''
      }
    }
  },

  methods: {
    onLogin() {
      this.$validator.validate().then(result => {
        if (!result) return
        conosle.log(this.LoginForm)
      })
    }
  }
}
</script>

<style>
.login-container {
  width: 100%;
  position: relative;
  display: flex;
  justify-content: space-between;
}

.login-container .btn,
.login-container .form-text {
  width: 350px;
}

.login-background  {
  position: absolute;
  bottom: 0px;
  left: 0px;
}

.login-right-corner {
  position: absolute;
  top: 0px;
  right: 0px;
}

.login-form {
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 130px;
}

.login-form label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
  color: #fff;
  margin-bottom: 8px;
}
</style>
