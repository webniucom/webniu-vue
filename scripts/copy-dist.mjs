/**
 * 子应用产物拷贝脚本
 *
 * 用法：node ../../scripts/copy-dist.mjs [pluginName]
 *   把 vue/plugin/<pluginName>/dist 拷贝到 plugin/<pluginName>/public/admin/dist
 *   （webman 以 /app/<pluginName>/admin/dist/... 托管该目录）
 *   省略 pluginName 时取当前工作目录名，即在子应用目录里执行即可，无需带参数
 */
import { rmSync, cpSync, existsSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 未传参时用当前目录名（子应用目录名即插件名）
const name = process.argv[2] || basename(process.cwd())

if (!name) {
  console.error('用法: node copy-dist.mjs [pluginName]')
  process.exit(1)
}

const src = resolve(__dirname, `../plugin/${name}/dist`)
const dest = resolve(__dirname, `../../plugin/${name}/public/admin/dist`)

if (!existsSync(src)) {
  console.error(`源目录不存在: ${src}`)
  process.exit(1)
}

rmSync(dest, { recursive: true, force: true })
cpSync(src, dest, { recursive: true })
console.log(`✓ 已拷贝 ${src} → ${dest}`)
