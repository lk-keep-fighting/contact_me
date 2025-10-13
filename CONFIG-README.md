# 配置说明

## 🎯 统一配置管理

现在所有配置都集中在 `js/config.js` 文件中，只需要在一个地方更新即可！

## 📁 配置文件结构

```javascript
window.__APP_CONFIG__ = {
  // Supabase 配置
  supabaseUrl: "你的项目URL",
  supabaseKey: "你的anon key",
  
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
```

## 🔧 配置项说明

### Supabase 配置
- `supabaseUrl`: Supabase项目URL
- `supabaseKey`: Supabase公钥

### 应用配置
- `defaultHandle`: 默认用户标识
- `appName`: 应用名称
- `appDescription`: 应用描述

### 分享配置
- `share.title`: 分享标题
- `share.text`: 分享描述
- `share.url`: 分享链接

### 主题配置
- `theme.primaryColor`: 主色调
- `theme.secondaryColor`: 辅助色

### 功能开关
- `features.enableAnalytics`: 是否启用数据分析
- `features.enableSharing`: 是否启用分享功能
- `features.enableQRCode`: 是否启用二维码功能
- `features.enableCustomDomain`: 是否启用自定义域名

## 🚀 使用方法

### 1. 更新Supabase配置
```javascript
supabaseUrl: "https://你的项目.supabase.co",
supabaseKey: "你的anon key",
```

### 2. 自定义应用信息
```javascript
appName: "你的应用名称",
appDescription: "你的应用描述",
```

### 3. 调整主题色彩
```javascript
theme: {
  primaryColor: "#你的主色调",
  secondaryColor: "#你的辅助色"
}
```

### 4. 控制功能开关
```javascript
features: {
  enableAnalytics: true,    // 启用数据分析
  enableSharing: true,      // 启用分享功能
  enableQRCode: true,       // 启用二维码
  enableCustomDomain: false // 禁用自定义域名
}
```

## ✅ 优势

1. **统一管理**: 所有配置在一个文件中
2. **易于维护**: 修改一次，全站生效
3. **功能丰富**: 支持主题、功能开关等高级配置
4. **向后兼容**: 保持原有功能不变

## 🔄 更新流程

1. 修改 `js/config.js` 文件
2. 保存文件
3. 刷新浏览器页面
4. 配置立即生效

## 📝 注意事项

- 修改配置后需要刷新页面才能生效
- Supabase配置错误会导致功能异常
- 建议在修改前备份原配置
- 生产环境请使用HTTPS

---

**现在你只需要修改 `js/config.js` 一个文件，所有页面都会自动使用新配置！**
