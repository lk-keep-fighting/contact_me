# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 项目概述

这是一个为创业者打造的个人介绍页面SaaS平台，支持一键创建、分享和引流。用户可以创建个人Profile页面，展示产品/服务、社交媒体链接，并获得访问统计。

**技术栈**: 原生HTML/CSS/JS + Tailwind CSS + Supabase (PostgreSQL + Auth + Storage)

## 核心命令

### 本地开发
```bash
# 启动本地开发服务器
./start.sh
# 或者
python3 -m http.server 8000
```

访问应用: http://localhost:8000

### 数据库设置

**重要**: 首次设置或重置数据库时，必须按以下顺序执行SQL文件:

```bash
# 1. 创建核心表结构和RLS策略
# 在 Supabase SQL Editor 中执行:
saas-schema-fixed.sql

# 2. 配置图片上传存储桶
# 在 Supabase SQL Editor 中执行:
setup-storage.sql
```

### 配置更新

所有配置集中在 `js/config.js` - **只需修改这一个文件**:

```javascript
window.__APP_CONFIG__ = {
  supabaseUrl: "你的Supabase项目URL",
  supabaseKey: "你的anon key",
  // 其他配置...
}
```

修改后刷新浏览器即可生效。

## 架构设计

### 数据流向

```
用户 → 前端页面 → Supabase Client SDK → Supabase (Auth/DB/Storage)
                                           ↓
                                    RLS策略保护数据
```

### 核心数据模型

**数据库表关系**:
```
auth.users (Supabase内置)
    ↓
user_profiles (用户基础信息, 1:1)
    ↓
profiles (用户Profile页面, 1:N)
    ├─→ products (产品/服务, 1:N)
    ├─→ socials (社交链接, 1:N)
    ├─→ page_views (访问统计, 1:N)
    └─→ shares (分享统计, 1:N)
```

**关键设计决策**:
- `user_profiles` 和 `profiles` 分离: 一个用户可以创建多个Profile页面（虽然当前MVP只支持单个）
- `handle` 字段是唯一标识，用于生成公开访问的URL (如: `/profile.html?handle=lowcode`)
- 所有表启用RLS (Row Level Security)，用户只能访问自己的数据
- 公开页面通过 `is_published=true` 允许匿名访问

### 文件结构与职责

```
contact-me/
├── index.html          # 首页（营销页面）
├── login.html          # 登录/注册页面
├── dashboard.html      # 管理后台（编辑Profile）
├── profile.html        # 公开Profile页面（展示页）
│
├── js/
│   ├── config.js       # 统一配置文件（Supabase连接等）
│   ├── auth.js         # 认证逻辑（登录/注册/演示账户）
│   ├── auth-utils.js   # 认证工具函数
│   ├── dashboard.js    # 管理后台逻辑（保存Profile、管理产品/社交链接）
│   ├── app.js          # 公开页面逻辑（展示Profile、处理分享）
│   └── upload.js       # 图片上传工具库（Supabase Storage集成）
│
├── saas-schema-fixed.sql  # 数据库架构（核心表结构）
├── setup-storage.sql      # 存储桶配置
└── start.sh               # 启动脚本
```

### 页面流程

1. **新用户注册流程**:
   - 访问 `login.html` → 注册账户 → 邮箱验证（可选）
   - 自动创建 `user_profiles` 记录
   - 跳转到 `dashboard.html`
   - 系统自动生成默认 `handle`（基于用户名/邮箱）

2. **编辑Profile流程**:
   - `dashboard.html` 加载用户数据（通过 `auth.uid()` 过滤）
   - 用户编辑信息、上传图片、添加产品/社交链接
   - 点击保存 → 调用 `saveProfile()` → 更新数据库
   - 点击预览 → 打开新窗口查看 `profile.html?handle=xxx`

3. **公开页面访问流程**:
   - 访问 `profile.html?handle=xxx`
   - 查询 `profiles` 表（通过 `handle` 和 `is_published=true`）
   - 加载关联的 `products` 和 `socials`
   - 记录访问统计到 `page_views` 表
   - 显示分享按钮（Web Share API + 回退方案）

### 认证与权限

**RLS策略核心逻辑**:
```sql
-- 用户只能查看/修改自己的数据
auth.uid() = user_id

-- 公开页面允许匿名访问
is_published = true
```

**重要**: 
- 修改表结构后，必须检查对应的RLS策略
- 统计数据 (`page_views`, `shares`) 允许匿名插入（用于追踪访问）

### 图片上传机制

**技术实现**:
- 使用 Supabase Storage 的 `images` 公共存储桶
- 前端通过 `js/upload.js` 的 `ImageUploader` 工具类上传
- 自动文件验证（类型、大小限制5MB）
- 上传后返回公开URL，存储到数据库对应字段

**使用示例**:
```javascript
window.ImageUploader.createImageUploader({
  inputId: 'profileAvatar',    // 目标input元素ID
  previewId: 'avatarPreview',  // 预览img元素ID
  onSuccess: (url) => {
    // 上传成功，url是图片的公开访问地址
  }
});
```

**存储桶配置** (已在 `setup-storage.sql` 中定义):
- 认证用户可上传/删除自己的图片
- 所有人可查看公共图片
- 用户只能删除/更新自己上传的图片 (通过 `owner` 字段验证)

## 开发注意事项

### 修改配置

**关键原则**: 配置集中化管理
- 所有Supabase连接信息在 `js/config.js` 中
- 页面通过 `window.__APP_CONFIG__` 全局变量访问配置
- 避免在多个文件中硬编码配置

### 修改数据库架构

1. 修改 `saas-schema-fixed.sql` 文件
2. 在Supabase SQL Editor中执行 `DROP TABLE` 和新的 `CREATE TABLE`
3. 注意级联删除 (`ON DELETE CASCADE`) 的影响
4. 验证RLS策略是否需要更新
5. 测试数据访问权限是否正确

### 添加新功能

**典型流程**:
1. 确定是否需要新表（修改 `saas-schema-fixed.sql`）
2. 添加后端逻辑（Supabase操作在对应的 `.js` 文件中）
3. 添加前端UI（修改对应的 `.html` 文件）
4. 更新 `js/config.js` 的 `features` 开关（如果是可选功能）
5. 测试RLS策略和权限

### 调试工具

- `debug.html`: 基础连接测试和注册测试
- `test-upload.html`: 图片上传功能测试
- `test-preview.html`: 页面预览测试
- `check-config.html`: 配置验证工具

浏览器控制台会显示详细的Supabase操作日志。

## 部署与环境

### 本地开发环境
- 只需要静态文件服务器（Python HTTP server）
- Supabase项目配置在 `js/config.js` 中
- 无需构建步骤，直接编辑代码即可

### 生产部署
- 部署到任意静态托管平台（Vercel、Netlify、阿里云OSS等）
- 更新 `js/config.js` 中的Supabase配置
- 配置自定义域名（可选）
- 在Supabase Auth设置中添加生产域名到 "Redirect URLs"

### Supabase配置清单

1. **创建项目**: 在 https://supabase.com 创建新项目
2. **执行SQL**: 依次执行 `saas-schema-fixed.sql` 和 `setup-storage.sql`
3. **认证设置**: 
   - 配置邮箱模板（可选）
   - 添加Redirect URLs: `http://localhost:8000/dashboard.html`
4. **获取密钥**: 复制 Project URL 和 anon key 到 `js/config.js`

## 常见问题

### 连接失败
- 检查 `js/config.js` 中的 `supabaseUrl` 和 `supabaseKey`
- 确认Supabase项目状态为 "Active"
- 检查浏览器控制台的网络请求

### 注册/登录失败
- 确认已执行 `saas-schema-fixed.sql` 创建 `user_profiles` 表
- 检查密码长度（至少6位）
- 查看Supabase Dashboard的 "Logs" 部分

### 图片上传失败
- 确认已执行 `setup-storage.sql` 创建存储桶
- 检查图片大小（不超过5MB）
- 确认用户已登录
- 在Supabase Dashboard检查 Storage 权限配置

### 数据访问权限错误
- 检查RLS策略是否正确
- 确认用户已登录 (`auth.uid()` 不为空)
- 查看Supabase Dashboard的 "Table Editor" 中的策略设置
- 对于公开访问的页面，确认 `is_published = true`

## 技术债务与改进方向

### 当前限制
- MVP版本，仅支持单个Profile（虽然数据库设计支持多个）
- 图片存储依赖Supabase（免费版1GB限制）
- 无服务端渲染，SEO优化有限

### 建议改进
- 添加图片压缩和裁剪功能
- 实现批量上传和管理
- 添加页面模板系统
- 增强数据分析功能
- 实现订阅和支付系统（已有 `subscriptions` 表结构）
