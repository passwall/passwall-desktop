const path = require('path')
const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

module.exports = defineConfig({
  plugins: [vue()],
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  base: './',
  publicDir: 'static',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: "@use '@/styles/config/variables.scss' as *;",
        api: 'modern'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    proxy: {
      '/auth': {
        target: 'https://api.passwall.io',
        changeOrigin: true,
        secure: true
      },
      '/api': {
        target: 'https://api.passwall.io',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
