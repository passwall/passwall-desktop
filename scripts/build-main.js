const esbuild = require('esbuild')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'dist', 'main')

esbuild
  .build({
    entryPoints: {
      index: path.join(rootDir, 'src', 'main', 'index.js'),
      preload: path.join(rootDir, 'src', 'preload', 'index.js')
    },
    outdir: outDir,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    sourcemap: true,
    external: ['electron'],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
