import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'node:fs'
import vueDevTools from 'vite-plugin-vue-devtools'
import viteCompression from 'vite-plugin-compression'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import tailwindcss from '@tailwindcss/vite'
// 注意：去掉了 unplugin-element-plus 插件
// 改为在 main.ts 里手动 import 'element-plus/dist/index.css' 全量引入
// 避免 useSource:true 模式下 SCSS additionalData 变量注入干扰 element-plus 按需编译

/**
 * 构建时需要排除的 src/views 子目录（仅 build 生效，dev 不受影响）。
 * 列入此处的模块不会进入 dist，源码仍保留，可按交付版本增删。
 */
const EXCLUDED_VIEW_DIRS: string[] = []

/**
 * 扫描 vue/plugin/* 目录，为每个有 vite.config.ts 的子应用生成代理规则。
 *
 * 为什么需要这个？
 *   基座通过 RuleService.php 拿到子应用 remoteEntry.js 的完整 URL（如 http://localhost:5177/app/wechat/admin/dist/remoteEntry.js），
 *   浏览器跨域加载 remoteEntry.js 没问题（Vite dev server 默认开 CORS）。
 *   但 remoteEntry.js 内部的 ES module import 用的是绝对路径（如 /app/wechat/admin/dist/node_modules/...），
 *   这些路径会相对于基座页面 origin（localhost:3006）解析，然后被基座原来的 ^/app/ 代理规则转发到 webman（8787），
 *   webman 没有 Vite dev 产物 → chunk 加载失败 → 远程加载失败。
 *
 *   解决方案：把子应用 admin/dist 路径下的请求代理到对应的 dev server（更具体的规则排在通用 ^/app/ 之前）。
 *   自动发现 = 新建子应用时不用改基座 vite.config.ts。
 */
function discoverSubAppProxies(): Record<string, { target: string; changeOrigin: boolean }> {
  const pluginDir = path.resolve(__dirname, 'plugin')
  const proxies: Record<string, { target: string; changeOrigin: boolean }> = {}
  if (!fs.existsSync(pluginDir)) return proxies

  for (const entry of fs.readdirSync(pluginDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const viteConfig = path.join(pluginDir, entry.name, 'vite.config.ts')
    if (!fs.existsSync(viteConfig)) continue

    const content = fs.readFileSync(viteConfig, 'utf-8')
    const match = content.match(/const\s+DEV_PORT\s*=\s*(\d+)/)
    if (!match) continue

    const port = match[1]
    // 更具体的规则必须排在通用规则之前，否则 /app/wechat/admin/dist/* 会被 ^/app/ 先匹配
    proxies[`^/app/${entry.name}/admin/dist/`] = {
      target: `http://localhost:${port}`,
      changeOrigin: true
    }
  }
  return proxies
}

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const {
    VITE_VERSION = '1.3.2',
    VITE_PORT = '3006',
    VITE_BASE_URL = '/',
    VITE_API_URL = '/app/',
    VITE_API_PROXY_URL = 'http://127.0.0.1:8787/',
    VITE_OUT_DIR
  } = env

  console.log(`🚀 API_URL = ${VITE_API_URL}  VERSION = ${VITE_VERSION}`)

  return defineConfig({
    define: { __APP_VERSION__: JSON.stringify(VITE_VERSION) },
    base: VITE_BASE_URL,
    server: {
      port: Number(VITE_PORT),
      proxy: {
        // 先放子应用 dev server 代理（更具体的路径），再放通用 API 代理
        ...discoverSubAppProxies(),
        // 壳子代理到 webman：子应用 API + 主框架 API
        '^/app/': { target: VITE_API_PROXY_URL, changeOrigin: true }
      },
      host: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@views': path.resolve(__dirname, 'src/views'),
        '@imgs': path.resolve(__dirname, 'src/assets/images'),
        '@icons': path.resolve(__dirname, 'src/assets/icons'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@stores': path.resolve(__dirname, 'src/store'),
        '@styles': path.resolve(__dirname, 'src/assets/styles'),
        // 管理端共享组件库（自 1.2 原版 components/core 全量迁移）
        '@admin': path.resolve(__dirname, 'shared/admin/src')
      }
    },
    build: {
      target: 'es2015',
      outDir: VITE_OUT_DIR || 'dist',
      emptyOutDir: !!VITE_OUT_DIR,
      chunkSizeWarningLimit: 2000,
      minify: 'terser',
      terserOptions: { compress: { drop_console: true, drop_debugger: true } },
      dynamicImportVarsOptions: { warnOnError: true, exclude: [], include: ['src/views/**/*.vue'] },
      rollupOptions: {
        output: {
          /**
           * 第三方依赖拆包：避免所有 vendor 堆进同一个入口 chunk。
           * 拆开后浏览器可并行下载，且业务版本更新时 vendor 命中缓存，
           * 入口 chunk 只保留业务代码，首屏解析更快。
           */
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            // 取 node_modules 之后的包路径（兼容 pnpm 的多层 .pnpm 目录）
            // 注意：不能直接匹配 '/vue/'，因为项目根目录本身就叫 vue，会误伤所有模块
            const p = id.replace(/\\/g, '/')
            const rel = p.slice(p.lastIndexOf('/node_modules/') + '/node_modules/'.length)
            if (rel.startsWith('@element-plus/icons-vue')) return 'vendor-el-icons'
            if (rel.startsWith('element-plus/')) return 'vendor-element-plus'
            if (rel.startsWith('echarts/') || rel.startsWith('zrender/')) return 'vendor-echarts'
            if (rel.startsWith('@wangeditor/') || rel.startsWith('prismjs/')) return 'vendor-editor'
            if (rel.startsWith('highlight.js/')) return 'vendor-highlight'
            // 图标数据（~1MB JSON）单独成 chunk：它只被 iconify-loader 动态 import，
            // 拆出去后 Rollup 才会按异步 chunk 处理，首屏不加载、浏览器单独缓存。
            // 注意要先于 '@iconify/' 判断，否则会被并入同步加载的 vendor-iconify。
            if (rel.startsWith('@iconify-json/')) return 'icons-data'
            if (rel.startsWith('@iconify/')) return 'vendor-iconify'
            // vue 及其生态（vue-router/pinia/@vueuse/vue-i18n）与 axios、lodash、dayjs 等基础库
            // 互相引用，必须放在同一个 chunk，否则会出现 chunk 循环依赖，
            // 运行时报 "Cannot access 'xx' before initialization"（TDZ）导致白屏。
            return 'vendor-core'
          }
        },
        onwarn(warning, warn) {
          if (warning.message?.includes('#__PURE__') && warning.message?.includes('Rollup cannot interpret')) return
          if (warning.message?.includes("'deep' is not recognized as a valid pseudo")) return
          warn(warning)
        }
      }
    },
    plugins: [
      spaFallbackPlugin(),
      excludeViewsPlugin(EXCLUDED_VIEW_DIRS),
      vue(),
      tailwindcss(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core', { 'element-plus': ['ElMessage', 'ElMessageBox', 'ElNotification', 'ElLoading'] }],
        dts: 'src/types/import/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      // 扫描目录同时包含共享包，保证 shared/admin 里用到的组件与 Element Plus 组件都被全局声明
      Components({
        dirs: ['src/components', 'shared/admin/src'],
        deep: true,
        dts: 'src/types/import/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      viteCompression({ verbose: false, disable: false, algorithm: 'gzip', ext: '.gz', threshold: 10240, deleteOriginFile: false }),
      vueDevTools()
    ],
    optimizeDeps: {
      include: [
        'echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers',
        'crypto-js', 'file-saver',
        'element-plus/es', 'element-plus/es/components/*/style/css', 'element-plus/es/components/*/style/index'
      ]
    },
    css: {
      preprocessorOptions: {
        scss: { additionalData: `@use "@styles/core/el-light.scss" as *; @use "@styles/core/mixin.scss" as *;` }
      },
      postcss: {
        plugins: [{
          postcssPlugin: 'internal:charset-removal',
          AtRule: { charset: (atRule) => { if (atRule.name === 'charset') atRule.remove() } }
        }]
      }
    }
  })
}

/**
 * SPA 回退：dev server 把 /app/* 的 HTML 请求都指向 index.html，
 * 避免刷新子路由 404。静态资源（带扩展名）和 API 不受影响。
 */
/** 不走 SPA fallback 的白名单：这些路径应该被 proxy 转发到 webman 处理 */
const SPA_FALLBACK_BYPASS = [
  /^\/app\/lottery\/\d+\/\d+(?:\/[A-Za-z0-9_-]+)?\/?$/,   // 抽奖 H5 短链接 /app/lottery/{i}/{fid}[/code/]
]

function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        const url = req.url || ''
        const pathname = url.split('?')[0]
        const accept = req.headers?.accept || ''
        // 有文件扩展名（.js/.css/.map 等）、POST/PUT 等非 GET、或带查询参数的 API 请求 → 跳过 fallback
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        if (/\.[^/]+$/.test(pathname)) return next()
        if (url.includes('?')) return next()  // API 请求带 query，不走 fallback
        if (accept && !accept.includes('text/html') && accept !== '*/*') return next()
        // 白名单路径不走 fallback，让它们被 proxy 转发到 webman
        if (SPA_FALLBACK_BYPASS.some(re => re.test(pathname))) return next()
        if (pathname === '/app' || pathname.startsWith('/app/')) req.url = '/index.html'
        next()
      })
    }
  }
}

/**
 * 构建排除：仅 build 生效。把 import.meta.glob 动态收集到的
 * 指定 views 目录解析为空模块，使源码及依赖不进入 dist。
 */
function excludeViewsPlugin(dirs: string[]) {
  const EMPTY_ID = '\0exclude-views-empty'
  const segments = dirs.map((d) => `/views/${d}/`)
  const isExcluded = (source: string) => {
    const normalized = (source || '').replace(/\\/g, '/')
    return segments.some((seg) => normalized.includes(seg))
  }
  return {
    name: 'exclude-views-on-build',
    apply: 'build' as const,
    resolveId(source: string) { if (isExcluded(source)) return EMPTY_ID; return null },
    load(id: string) { if (id === EMPTY_ID) return 'export default { render() { return null } }'; return null }
  }
}
