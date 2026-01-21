const esbuild = require('esbuild')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const outDir = path.join(rootDir, 'dist', 'main')

const start = async () => {
  const ctx = await esbuild.context({
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
      'process.env.NODE_ENV': '"development"'
    }
  })

  await ctx.watch()
}

start().catch(error => {
  console.error(error)
  process.exit(1)
})
