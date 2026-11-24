import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import fs from 'node:fs'
import { federation } from '@module-federation/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'

const APP_NAME = path.basename(__dirname)
const DEV_PORT = 5177

function generateExposes(): Record<string, string> {
  const viewsDir = path.resolve(__dirname, 'src/views')
  if (!fs.existsSync(viewsDir)) return {}

  const files: string[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name === 'modules' || e.name === 'components') continue
        walk(path.join(dir, e.name))
      } else if (e.name.endsWith('.vue')) {
        files.push(path.join(dir, e.name))
      }
    }
  }
  walk(viewsDir)

  const exposes: Record<string, string> = {}
  for (const file of files) {
    const rel = path.relative(viewsDir, file).replace(/\\/g, '/').replace(/\.vue$/, '')
    const name = rel.startsWith(`${APP_NAME}/`) ? rel.slice(APP_NAME.length + 1) : rel
    const key = name.replace(/\/index$/, '') || 'index'
    if (exposes[`./views/${key}`]) continue
    exposes[`./views/${key}`] = `./src/views/${rel}.vue`
  }
  return exposes
}

export default defineConfig({
  root: __dirname,
  base: `/app/${APP_NAME}/admin/dist/`,
  // 子应用独立编译共享组件时 import.meta.env.VITE_API_URL 为空，
  // 会导致上传等组件拼出 undefined 开头的接口地址，这里与基座保持一致
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('/app/')
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: true,
    proxy: {
      [`^/app/${APP_NAME}/(?!admin/dist)`]: { target: 'http://127.0.0.1:8787', changeOrigin: true },
      '/app/webniu': { target: 'http://127.0.0.1:8787', changeOrigin: true }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@admin': path.resolve(__dirname, '../../shared/admin/src'),
      '@styles': path.resolve(__dirname, '../../src/assets/styles'),
      '@stores': path.resolve(__dirname, 'src/stores')
    }
  },
  build: {
    target: 'es2020',
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core', { 'element-plus': ['ElMessage', 'ElMessageBox', 'ElNotification', 'ElLoading'] }],
      dts: 'src/types/import/auto-imports.d.ts',
      resolvers: [ElementPlusResolver({ importStyle: false })]
    }),
    Components({
      dirs: ['src/components', '../../shared/admin/src'],
      deep: true,
      dts: false
    }),
    tailwindcss(),
    federation({
      name: APP_NAME,
      filename: 'remoteEntry.js',
      exposes: generateExposes(),
      shared: {
        vue: { singleton: true },
        'vue-router': { singleton: true },
        'element-plus': { singleton: true },
        pinia: { singleton: true }
      },
      dts: false
    })
  ]
})
