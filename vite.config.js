// vite.config.js
import { defineConfig } from 'vite'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import fg from 'fast-glob'

function integrityPlugin({ dir = 'dist', assetsDir = 'assets' } = {}) {
  return {
    name: 'integrity-manifest',
    apply: 'build',
    async closeBundle() {
      // Inclua aqui os tipos desejados no manifesto:
      const patterns = [
        `${assetsDir}/*.js`,
        `${assetsDir}/*.css`,
        // `${assetsDir}/*.{woff,woff2,ttf,otf,png,jpg,jpeg,webp,avif,svg}`
      ]
      const paths = (await fg(patterns, { cwd: dir })).map((p) => `${dir}/${p}`)

      const entries = {}
      for (const p of paths) {
        const buf = await fs.readFile(p)
        const hash = createHash('sha256').update(buf).digest('base64')
        entries[p.replace(`${dir}/`, '')] = `sha256-${hash}`
      }

      const buildId = createHash('sha256')
      .update(JSON.stringify(entries))
      .digest('hex')
      .slice(0, 12)

      await fs.writeFile(
        `${dir}/integrity.json`,
        JSON.stringify({ buildId, entries }, null, 2)
      )
      await fs.writeFile(`${dir}/build-id.txt`, buildId)

      console.log(`🔒 Manifesto de integridade criado (ID: ${buildId})`)
    },
  }
}

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: './', // ESSENCIAL para itch.io (subpasta)
plugins: [integrityPlugin()],
                            build: {
                              outDir: 'dist',
                              assetsDir: 'assets',
                              emptyOutDir: true,
                              sourcemap: true,
                              minify: 'terser',
                              terserOptions: {
                                compress: {
                                  drop_console: isProd,   // mantém console fora do prod, útil p/ debug no dev
                                  drop_debugger: isProd,
                                },
                              },
                              rollupOptions: {
                                output: {
                                  // ⚠️ NÃO prefixe com 'assets/' aqui, pois o Vite já usa assetsDir
                                  entryFileNames: '[name]-[hash].js',
                                  chunkFileNames: '[name]-[hash].js',
                                  assetFileNames: '[name]-[hash][extname]',
                                },
                              },
                              // target: 'es2018', // opcional (navegadores modernos)
                            },
                            define: {
                              __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
                            },
})
