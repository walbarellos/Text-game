// vite.config.js
import { defineConfig } from 'vite'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import fg from 'fast-glob'

function integrityPlugin() {
  return {
    name: 'integrity-manifest',
    apply: 'build',
    async closeBundle() {
      const dir = 'dist'
      // Ajuste os padrões aqui se quiser incluir mais tipos:
      const files = ['assets/*.js'] // ex.: ['assets/*.{js,css}']
      const paths = (await fg(files, { cwd: dir })).map((p) => `${dir}/${p}`)

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

export default defineConfig({
  base: './', // ← ESSENCIAL para rodar em subpasta do itch.io
  plugins: [integrityPlugin()],
                            build: {
                              outDir: 'dist',
                              assetsDir: 'assets',
                              sourcemap: true,
                              minify: 'terser',
                              terserOptions: {
                                compress: { drop_console: true, drop_debugger: true },
                              },
                              rollupOptions: {
                                output: {
                                  entryFileNames: 'assets/[name]-[hash].js',
                                  chunkFileNames: 'assets/[name]-[hash].js',
                                  assetFileNames: 'assets/[name]-[hash][extname]',
                                },
                              },
                            },
                            define: {
                              __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
                            },
})
