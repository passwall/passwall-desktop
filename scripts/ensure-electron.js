const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const electronPackageJson = require.resolve('electron/package.json')
const electronRoot = path.dirname(electronPackageJson)
const pathFile = path.join(electronRoot, 'path.txt')

const ensureElectronInstalled = () => {
  if (fs.existsSync(pathFile)) {
    return
  }

  console.warn('[ensure-electron] Electron binary is missing. Reinstalling Electron binary...')

  const installScript = require.resolve('electron/install.js')
  const result = spawnSync(process.execPath, [installScript], {
    stdio: 'inherit',
    env: process.env
  })

  if (result.status !== 0 || !fs.existsSync(pathFile)) {
    console.error(
      '[ensure-electron] Electron install failed. Try: pnpm remove electron && pnpm add -D electron@^40.0.0'
    )
    process.exit(result.status || 1)
  }

  console.log('[ensure-electron] Electron binary installed successfully.')
}

ensureElectronInstalled()
