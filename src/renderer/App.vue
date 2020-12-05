<template>
  <div id="app">
    <header class="app-header">
      <!-- Control Buttons -->
      <div class="app-header-control-buttons">
        <button class="btn-close" @click="onClickClose" />
        <button class="btn-min" @click="onClickMin" />
        <button class="btn-max" @click="onClickMax" />
      </div>
      <!-- Search -->
      <div class="app-header-search" v-if="access_token">
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
      <div class="app-header-right-section" v-if="access_token">
        <!-- Import -->
        <button class="c-gray-300 mr-5" @click="onImport">
          {{ $t('Import') }}
          <VIcon name="download" size="14px" class="ml-2" />
        </button>
        <!-- Export -->
        <button class="c-gray-300 mr-5" @click="onExport">
          {{ $t('Export') }}
          <VIcon name="upload" size="14px" class="ml-2" />
        </button>
        <!-- Logout -->
        <button class="c-danger mr-3" @click="onClickLogout">
          {{ $t('Logout') }}
          <VIcon name="logout" size="14px" rotation="180" class="ml-2" />
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
import Papa from 'papaparse'
import { remote, app, ipcRenderer } from 'electron'
import { mapActions, mapMutations, mapState } from 'vuex'
import CryptoUtils from '@/utils/crypto'

export default {
  computed: mapState(['access_token', 'searchQuery']),

  methods: {
    ...mapActions(['Import', 'Export', 'Logout']),
    ...mapActions('Logins', ['FetchAll']),
    ...mapMutations(['onInputSearchQuery']),

    onClickClose() {
      app.quit()
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

    onClickLogout() {
      this.Logout()
      this.$router.replace({ name: 'Login' })
    },

    async onExport() {
      const filePath = remote.dialog.showSaveDialogSync(null)

      if (!filePath) {
        return
      }

      try {
        const data = await this.Export()

        const itemList = JSON.parse(CryptoUtils.aesDecrypt(data))
        itemList.forEach(item => CryptoUtils.decryptFields(item))

        const csvContent = Papa.unparse(itemList)
        fs.writeFileSync(filePath, csvContent)
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
    -webkit-app-region: no-drag;

    button {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
    }

    .btn-close {
      background-color: #e82649;
    }

    .btn-min {
      background-color: #ffd600;
    }

    .btn-max {
      background-color: #1fe061;
    }
  }

  &-right-section {
    display: flex;
    margin-left: auto;
  }
}
</style>
