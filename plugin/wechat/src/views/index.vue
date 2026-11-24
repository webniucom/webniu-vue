<template>
  <div class="index-home">
    <el-card shadow="never" class="index-card">
      <div class="index-head">
        <div class="index-logo">W</div>
        <div>
          <h2>wechat 管理</h2>
          <p>webniu plugin/wechat · 独立打包子应用 · Module Federation Remote</p>
        </div>
      </div>
      <el-alert
        class="index-alert"
        type="info"
        :closable="false"
        show-icon
        title="本页面仅在独立运行（vite dev / 直接访问）时展示；壳子内由菜单注册的路由加载具体业务页面。"
      />
      <el-descriptions class="index-info" title="链路信息" :column="1" border>
        <el-descriptions-item label="插件标识">wechat</el-descriptions-item>
        <el-descriptions-item label="remoteEntry.js 地址">/app/wechat/admin/dist/remoteEntry.js</el-descriptions-item>
        <el-descriptions-item label="暴露模块">./views/wechat/account、./views/wechat/applist 等</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'WechatHome' })
</script>

<style scoped>
  .index-home {
    padding: 0;
  }
  .index-card {
    border-radius: 12px;
  }
  .index-head {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .index-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #5d87ff, #36cfc9);
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .index-head h2 {
    margin: 0;
    font-size: 18px;
    color: #2b3445;
  }
  .index-head p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #8a93a6;
  }
  .index-alert,
  .index-info {
    margin-top: 16px;
  }
</style>
