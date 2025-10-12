# 联系我 SaaS 设置指南

## 🚨 当前问题
Supabase项目连接失败，需要重新创建项目。

## 🔧 解决步骤

### 1. 创建新的Supabase项目

1. **访问 Supabase**
   - 打开 [https://supabase.com](https://supabase.com)
   - 点击 "Start your project"
   - 使用GitHub账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择组织（或创建新组织）
   - 填写项目信息：
     - **Name**: `contact-me-saas`
     - **Database Password**: 设置一个强密码（记住这个密码）
     - **Region**: 选择离你最近的区域
   - 点击 "Create new project"

3. **等待项目创建**
   - 项目创建需要1-2分钟
   - 等待状态变为 "Active"

### 2. 获取项目配置信息

1. **进入项目设置**
   - 在项目仪表板中，点击左侧菜单的 "Settings"
   - 点击 "API"

2. **复制配置信息**
   - **Project URL**: 类似 `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: 以 `eyJ...` 开头的长字符串

### 3. 更新项目配置

**只需要更新一个文件：`js/config.js`**

```javascript
// 统一配置文件 - 只需要在这里更新一次
window.__APP_CONFIG__ = {
  // Supabase 配置
  supabaseUrl: "你的项目URL",
  supabaseKey: "你的anon key",
  
  // 应用配置
  defaultHandle: "lowcode",
  appName: "联系我 SaaS",
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

**优势：**
- ✅ 只需要在一个地方更新配置
- ✅ 所有页面自动使用统一配置
- ✅ 便于维护和管理
- ✅ 支持更多配置选项

### 4. 执行数据库架构

1. **进入SQL Editor**
   - 在Supabase项目中，点击左侧菜单的 "SQL Editor"
   - 点击 "New query"

2. **执行架构文件**
   - 复制 `saas-schema-fixed.sql` 的全部内容
   - 粘贴到SQL Editor中
   - 点击 "Run" 执行

3. **验证表创建**
   - 在左侧菜单点击 "Table Editor"
   - 确认以下表已创建：
     - `user_profiles`
     - `profiles`
     - `products`
     - `socials`
     - `page_views`
     - `shares`
     - `templates`
     - `subscriptions`

### 5. 配置认证设置

1. **进入认证设置**
   - 点击左侧菜单的 "Authentication"
   - 点击 "Settings"

2. **配置邮箱认证（可选）**
   - 如果不需要邮箱确认，可以禁用：
     - 找到 "Enable email confirmations"
     - 取消勾选
   - 点击 "Save"

3. **配置重定向URL**
   - 在 "Site URL" 中设置：`http://localhost:8000`
   - 在 "Redirect URLs" 中添加：
     - `http://localhost:8000/dashboard.html`
     - `http://localhost:8000/login.html`

### 6. 测试应用

1. **启动本地服务器**
```bash
python3 -m http.server 8000
```

2. **访问调试页面**
   - 打开 `http://localhost:8000/debug.html`
   - 测试连接和注册功能

3. **访问登录页面**
   - 打开 `http://localhost:8000/login.html`
   - 注册新账户或使用演示账户

## 🎯 快速测试

### 使用演示账户
1. 在登录页面点击 "体验演示账户"
2. 系统会自动创建演示用户
3. 登录后进入管理后台

### 手动注册
1. 填写邮箱、密码、姓名
2. 点击注册
3. 如果启用了邮箱确认，检查邮箱
4. 登录后进入管理后台

## 🔍 常见问题

### 1. 连接失败
- 检查Supabase URL和Key是否正确
- 确认项目状态为 "Active"
- 检查网络连接

### 2. 注册失败
- 检查邮箱格式是否正确
- 确认密码至少6位
- 查看浏览器控制台错误信息

### 3. 数据库错误
- 确认已执行 `saas-schema-fixed.sql`
- 检查表是否正确创建
- 查看SQL Editor中的错误信息

## 📞 获取帮助

如果遇到问题：
1. 查看浏览器控制台错误信息
2. 检查Supabase项目日志
3. 确认所有配置信息正确

---

**注意**: 请将上述配置中的 "你的项目URL" 和 "你的anon key" 替换为实际的Supabase项目信息。
