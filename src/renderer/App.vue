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
          <button
            type="button"
            class="search-action-btn"
            :disabled="!searchQuery"
            @click="onSearchAction"
          >
            <VIcon v-if="searchQuery" name="x" size="14px" />
            <VIcon v-else name="search" size="16px" />
          </button>
        </div>
      </div>
      <!-- Right Section -->
      <div class="app-header-right-section" v-if="authenticated">
        <!-- Vault -->
        <button class="vault-link mr-3" @click="onClickVault">
          {{ $t('Vault') }}
          <VIcon name="external-link" size="12px" class="ml-2 vault-link__icon" />
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
import Papa from 'papaparse'
import { mapActions, mapMutations, mapState } from 'vuex'
import { decryptFields, decodeBase64Json, encryptPayload } from '@/utils/crypto'
import SystemService from '@/api/services/System'

export default {
  data() {
    return {
      isAlwaysOnTop: false,
      menuCleanup: []
    }
  },

  created() {
    if (window.electronAPI) {
      const removeExport = window.electronAPI.onMenuExport(() => this.onExport())
      const removeImport = window.electronAPI.onMenuImport(() => this.onImport())
      this.menuCleanup = [removeExport, removeImport].filter(Boolean)
    }
  },

  beforeUnmount() {
    this.menuCleanup.forEach(removeListener => removeListener())
  },
  
  computed: mapState(['authenticated', 'searchQuery']),
  watch: {
    searchQuery(value) {
    }
  },

  methods: {
    ...mapActions(['Import', 'Export', 'Logout']),
    ...mapActions('Passwords', ['FetchAll']),
    ...mapMutations(['onInputSearchQuery']),

    onClickQuit() {
      if (window.electronAPI) {
        window.electronAPI.app.quit()
      }
    },

    onClickMin() {
      if (window.electronAPI) {
        window.electronAPI.window.minimize()
      }
    },

    onClickMax() {
      if (window.electronAPI) {
        window.electronAPI.window.toggleMaximize()
      }
    },

    async onAlwaysOnTop() {
      if (!window.electronAPI) {
        return
      }

      this.isAlwaysOnTop = await window.electronAPI.window.toggleAlwaysOnTop()
    },

    async onClickLogout() {
      try {
        await this.Logout()
      } finally {
        this.$router.replace({ name: 'Login' })
      }
    },

    onClearSearch() {
      this.onInputSearchQuery({ target: { value: '' } })
    },

    onSearchAction() {
      if (this.searchQuery) {
        this.onClearSearch()
      }
    },

    onClickVault() {
      if (window.electronAPI) {
        window.electronAPI.shell.openExternal('https://vault.passwall.io')
      }
    },

    async onExport() {
      if (!window.electronAPI) {
        return
      }

      const userKey = this.$store.state.userKey
      if (!userKey) {
        this.$notifyError(this.$t('Something went wrong.'))
        return
      }

      const dir = await window.electronAPI.dialog.selectExportDirectory()

      if (!dir) {
        return
      }
      
      try {
        const { data } = await SystemService.Export()

        const itemList = decodeBase64Json(data.data)
        
        const passwordItems = itemList.Passwords || []
        const PasswordEncryptedFields = ['username', 'password', 'notes', 'totp_secret']
        await Promise.all(
          passwordItems.map(item => decryptFields(item, PasswordEncryptedFields, userKey))
        )
        
        const ServerEncryptedFields = ['ip','username','password','hosting_username','hosting_password','admin_username','admin_password','extra']
        await Promise.all(
          itemList.Servers.map(item => decryptFields(item, ServerEncryptedFields, userKey))
        )
        
        const NoteEncryptedFields = ['note']
        await Promise.all(
          itemList.Notes.map(item => decryptFields(item, NoteEncryptedFields, userKey))
        )
        
        const EmailEncryptedFields = ['email', 'password']
        await Promise.all(
          itemList.Emails.map(item => decryptFields(item, EmailEncryptedFields, userKey))
        )
        
        const CreditCardEncryptedFields = ['type', 'number', 'expiry_date', 'cardholder_name', 'verification_number']
        await Promise.all(
          itemList.CreditCards.map(item => decryptFields(item, CreditCardEncryptedFields, userKey))
        )
        
        const BankAccountEncryptedFields = ['account_name', 'account_number', 'iban', 'currency', 'password']
        await Promise.all(
          itemList.BankAccounts.map(item => decryptFields(item, BankAccountEncryptedFields, userKey))
        )
        
        const files = [
          { name: 'passwords.csv', content: Papa.unparse(passwordItems) },
          { name: 'servers.csv', content: Papa.unparse(itemList.Servers) },
          { name: 'notes.csv', content: Papa.unparse(itemList.Notes) },
          { name: 'emails.csv', content: Papa.unparse(itemList.Emails) },
          { name: 'credit_cards.csv', content: Papa.unparse(itemList.CreditCards) },
          { name: 'bank_accounts.csv', content: Papa.unparse(itemList.BankAccounts) }
        ]

        await window.electronAPI.fs.writeFiles(dir, files)

        this.$notifySuccess(this.$t('All records exported successfully.'))
          
      } catch (error) {
        this.$notifyError(this.$t('Something went wrong.'))
        console.log(error)
      }
    },

    onImport() {
      if (!window.electronAPI) {
        return
      }

      const userKey = this.$store.state.userKey
      if (!userKey) {
        this.$notifyError(this.$t('Something went wrong.'))
        return
      }

      window.electronAPI.dialog.selectImportFile().then(async filePath => {
        if (!filePath) {
          return
        }

        try {
          const fileContent = await window.electronAPI.fs.readFile(filePath)

          const parsedCSV = Papa.parse(fileContent.trim(), {
            header: true // creates array of { head: value }
          })

          if (parsedCSV.errors.length > 0) {
            this.$notifyError(this.$t('There is an error. Error: ', parsedCSV.errors[0].message))
            return
          }

          const itemList = await Promise.all(
            parsedCSV.data.map(item =>
              encryptPayload(item, ['username', 'password', 'notes', 'totp_secret'], userKey)
            )
          )

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
