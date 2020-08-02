<template>
  <div id="app">
    <router-view />
    <TheIcons />
    <notifications width="345" position="top center" />
  </div>
</template>

<script>
import fs from 'fs'
import { ipcRenderer } from 'electron'
import { mapActions, mapState } from 'vuex'
const { dialog } = require('electron').remote
import CryptoUtils from '@/utils/crypto'
import ObjectsToCsv from 'objects-to-csv'

export default {
  created() {
    ipcRenderer.on('export', this.onExport)
    ipcRenderer.on('import', this.onImport)
  },

  computed: {
    ...mapState(['access_token'])
  },

  methods: {
    ...mapActions(['Import', 'Export']),
    ...mapActions('Logins', ['FetchAll']),

    checkAccess() {
      if (!this.access_token) {
        this.$notify({
          type: 'error',
          text: this.$t('You are not logged in. Please log in and try again')
        })
      }
      return Boolean(this.access_token)
    },

    async onExport() {
      if (!this.checkAccess()) return

      const filePath = dialog.showSaveDialogSync(null)
      if (!filePath) return

      try {
        const data = await this.Export()

        const itemList = JSON.parse(CryptoUtils.aesDecrypt(data))
        itemList.forEach(item => CryptoUtils.decryptFields(item))

        const csvContent = new ObjectsToCsv(itemList)

        fs.writeFileSync(filePath, csvContent.toString())
      } catch (error) {
        console.log(error)
      }
    },

    onImport() {
      if (!this.checkAccess()) return

      dialog.showOpenDialog({ properties: ['openFile'] }, async files => {
        if (files.length === 0) return

        try {
          const fileContent = fs.readFileSync(files[0]).toString()

          const parsedCSV = this.parseCSV(fileContent)
          console.log('parsedCSV', parsedCSV)

          const itemList = parsedCSV.map(item => {
            return CryptoUtils.encryptPayload(item, ['username', 'password', 'extra'])
          })
          console.log('itemlist', itemList)
          await this.Import(itemList)
          this.FetchAll()
        } catch (error) {
          console.log(error)
        }
      })
    },

    parseCSV(csv) {
      const arr = []
      let lines = csv.split('\n')

      // Get headers like ["URL", "Username", "Password"]
      let headers = lines[0].split(',')

      for (let i = 1; i < lines.length; i++) {
        let obj = {}

        if (!lines[i] || !lines[i].trim()) continue

        const words = lines[i].split(',')

        words.forEach((word, j) => {
          obj[headers[j].trim()] = words[j]
        })

        arr.push(obj)
      }
      return arr
    }
  }
}
</script>

<style lang="scss">
.vue-notification {
  padding: 10px 10px 10px 35px;
  margin-top: 10px;

  font-weight: 600;
  font-size: 14px;
  line-height: 22px;

  color: #ffffff;
  background: #151c27;

  border-radius: 8px;

  &.warn {
    background: #151c27;
    border-left-color: #151c27;
  }

  &.error {
    background: #151c27;
    border-left-color: #151c27;
    background-image: url(../../static/img/error-notify.png);
    background-repeat: no-repeat;
    background-position: 5px center;
  }

  &.success {
    background: #151c27;
    border-left-color: #151c27;
  }
}
</style>
