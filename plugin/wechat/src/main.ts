import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Index from './views/index.vue'

const app = createApp(App)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as any)
}
const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: Index }]
})
app.use(router)
app.mount('#app')
