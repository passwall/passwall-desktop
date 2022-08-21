<template>
  <div id="app">
    <header class="app-header">
      <!-- Control Buttons -->
      <div class="app-header-control-buttons">
        <button class="btn-quit" @click="onClickQuit" />
        <button class="btn-min" @click="onClickMin" />
        <button class="btn-max" @click="onClickMax" />
      </div>
      <!-- Search -->
      <div class="app-header-search" v-if="authenticated">
        <div class="app-header-search-wrapper">
          <input
            type="text"
            :value="searchQuery"
            @input="onInputSearchQuery"
            :placeholder="$t('Search passwords, websites, notes')"
          />
          <VIcon name="search" size="16px" />
        </div>
      </div>
      <!-- Right Section -->
      <div class="app-header-right-section" v-if="authenticated">
        <!-- Always On Top -->
        <button class="top-btn mr-3" :class="[isAlwaysOnTop ? 'active' : '']" @click="onAlwaysOnTop">
          <VIcon name="always-on-top" size="14px" v-tooltip="$t('AlwaysOnTop')" />
        </button>
        <!-- Import -->
        <button class="top-btn mr-3" @click="onImport">
          <VIcon name="download" size="14px" v-tooltip="$t('Import')" />
        </button>
        <!-- Export -->
        <button class="top-btn mr-3" @click="onExport">
          <VIcon name="upload" size="14px" v-tooltip="$t('Export')" />
        </button>
        <!-- Logout -->
        <button class="c-danger mr-3" @click="onClickLogout">
          {{ $t('Logout') }}
          <VIcon name="logout" size="14px" rotation="180" class="ml-2" v-tooltip="$t('Logout')" />
        </button>
      </div>
    </header>
    <!-- Content -->
    <RouterView />
    <!-- Hidden -->
    <TheIcons />
    <notifications width="345" position="top center" />
  </div>
</template>

<script>
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { remote, ipcRenderer } from 'electron'
import { mapActions, mapMutations, mapState } from 'vuex'
import CryptoUtils from '@/utils/crypto'
import SystemService from '@/api/services/System'

export default {
  data() {
    return {
      isAlwaysOnTop: false,
    }
  },
  
  computed: mapState(['authenticated', 'searchQuery']),

  methods: {
    ...mapActions(['Import', 'Export', 'Logout']),
    ...mapActions('Logins', ['FetchAll']),
    ...mapMutations(['onInputSearchQuery']),

    onClickQuit() {
      remote.app.quit()
    },

    onClickMin() {
      remote.getCurrentWindow().minimize()
    },

    onClickMax() {
      if (remote.getCurrentWindow().isMaximized()) {
        remote.getCurrentWindow().unmaximize()
      } else {
        remote.getCurrentWindow().maximize()
      }
    },

    onAlwaysOnTop() {
      this.isAlwaysOnTop = !this.isAlwaysOnTop
      remote.getCurrentWindow().setAlwaysOnTop(!remote.getCurrentWindow().isAlwaysOnTop())
    },

    onClickLogout() {
      this.Logout()
      this.$router.replace({ name: 'Login' })
    },

    async onExport() {
      const dir = remote.dialog.showOpenDialogSync({ 
        title: 'Select Export Directory',
        properties: ['openDirectory', 'createDirectory'] 
      })

      if (dir.length === 0) {
        return
      }
      
      try {
        const { data } = await SystemService.Export()
        
        const itemList = JSON.parse(CryptoUtils.aesDecrypt(data.data))
        
        // console.log(itemList.Logins)
        const LoginEncryptedFields = ['username', 'password', 'extra']
        itemList.Logins.forEach(item => CryptoUtils.decryptFields(item, LoginEncryptedFields))
        
        const ServerEncryptedFields = ['ip','username','password','hosting_username','hosting_password','admin_username','admin_password','extra']
        itemList.Servers.forEach(item => CryptoUtils.decryptFields(item, ServerEncryptedFields))
        
        const NoteEncryptedFields = ['note']
        itemList.Notes.forEach(item => CryptoUtils.decryptFields(item, NoteEncryptedFields))
        
        const EmailEncryptedFields = ['email', 'password']
        itemList.Emails.forEach(item => CryptoUtils.decryptFields(item, EmailEncryptedFields))
        
        const CreditCardEncryptedFields = ['type', 'number', 'expiry_date', 'cardholder_name', 'verification_number']
        itemList.CreditCards.forEach(item => CryptoUtils.decryptFields(item, CreditCardEncryptedFields))
        
        const BankAccountEncryptedFields = ['account_name', 'account_number', 'iban', 'currency', 'password']
        itemList.BankAccounts.forEach(item => CryptoUtils.decryptFields(item, BankAccountEncryptedFields))
        
        const contentLogins = Papa.unparse(itemList.Logins)
        fs.writeFile(path.join(dir[0],"logins.csv"), contentLogins, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        const contentServer = Papa.unparse(itemList.Servers)
        fs.writeFile(path.join(dir[0],"servers.csv"), contentServer, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        const contentNote = Papa.unparse(itemList.Notes)
        fs.writeFile(path.join(dir[0],"notes.csv"), contentNote, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        const contentEmail = Papa.unparse(itemList.Emails)
        fs.writeFile(path.join(dir[0],"emails.csv"), contentEmail, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        const contentCreditCard = Papa.unparse(itemList.CreditCards)
        fs.writeFile(path.join(dir[0],"credit_cards.csv"), contentCreditCard, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        const contentBankAccount = Papa.unparse(itemList.BankAccounts)
        fs.writeFile(path.join(dir[0],"credit_cards.csv"), contentBankAccount, function (err) {
            if (err) {
              this.$notifyError(this.$t('Something went wrong.'))
              console.log(err)
            }
        });
        
        this.$notifySuccess(this.$t(`All records exported successfully.`))
          
      } catch (error) {
        this.$notifyError(this.$t('Something went wrong.'))
        console.log(error)
      }
    },

    onImport() {

      remote.dialog.showOpenDialog({ properties: ['openFile'] }).then(async ({ filePaths }) => {

        if (filePaths.length === 0) {
          return
        }
        try {
          const fileContent = fs.readFileSync(filePaths[0]).toString()

          let parsedCSV = Papa.parse(fileContent.trim(), {
            header: true // creates array of { head: value }
          })

          if (parsedCSV.errors.length > 0) {
            this.$notifyError(this.$t('There is an error. Error: ', parsedCSV.errors[0].message))
            return
          }

          const itemList = parsedCSV.data.map(item => {
            return CryptoUtils.encryptPayload(item, ['username', 'password', 'extra'])
          })

          await this.Import(itemList)
          this.FetchAll()
        } catch (error) {
          this.$notifyError(this.$t('Something went wrong.'))
          console.log(error)
        }
      })
    }
  }
}
</script>

<style lang="scss">
.app-header {
  width: 100vw;
  height: 56px;
  margin: 0px;
  padding: 0px 16px;
  background: $color-gray-500;
  -webkit-user-select: none;
  -webkit-app-region: drag;

  & > * {
    -webkit-app-region: no-drag;
  }

  &,
  &-control-buttons {
    display: flex;
    align-items: center;
  }

  &-search {
    width: 295px;
    text-align: center;
    border-right: 1px solid black;
    border-left: 1px solid black;

    &-wrapper {
      position: relative;
      width: 260px;

      input {
        width: 100%;
        height: 40px;
        background-color: #000;
        border-radius: 8px;
        padding: 0 46px 0 24px;
        color: white;
        border: 0;
        font-size: 12px;

        &::placeholder {
          font-size: 12px;
          color: $color-gray-300;
        }
      }
    }

    .v-icon {
      top: 12px;
      right: 20px;
      position: absolute;
      color: $color-gray-300;
    }
  }

  &-control-buttons {
    width: 184px;
    height: 48px;
    -webkit-app-region: drag;

    button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
      -webkit-app-region: no-drag;
    }

    .btn-quit {
      background-color: #e82649;
    }

    .btn-min {
      background-color: #ffd600;
    }

    .btn-max {
      background-color: #1fe061;
    }
  }

  .top-btn {
    color: $color-gray-300;
  }

  .top-btn:hover, .top-btn.active {
    color: $color-secondary;
  }

  &-right-section {
    display: flex;
    margin-left: auto;
  }
}
</style>
