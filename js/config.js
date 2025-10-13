// 统一配置文件 - 只需要在这里更新一次
window.__APP_CONFIG__ = {
  // Supabase 配置
  supabaseUrl: "https://zmuaawzjscrexezgencu.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWFhd3pqc2NyZXhlemdlbmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjczODQsImV4cCI6MjA3NTg0MzM4NH0.mNb3-SLgGIalH1szlpETInmpnoPHlMlg1Cbowe-wB0o",
  
  // 应用配置
  defaultHandle: "lowcode",
  appName: "联系我",
  appDescription: "为创业者打造的个人介绍平台",
  
  // 分享配置
  share: {
    title: "低代码技术分享",
    text: "专注低代码技术分享，助力开发者快速构建应用。欢迎交流学习！",
    url: typeof location !== 'undefined' ? location.href : ""
  },
  
  // 主题配置
  theme: {
    primaryColor: "#0ea5e9",
    secondaryColor: "#64748b"
  },
  
  // 功能开关
  features: {
    enableAnalytics: true,
    enableSharing: true,
    enableQRCode: true,
    enableCustomDomain: false
  }
};
