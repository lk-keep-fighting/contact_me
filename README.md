# 联系我 H5 MVP

一个帮助创业者“一键自我介绍+产品引流”的纯静态 H5 页面，使用 Tailwind CDN 与 Supabase JS（可选）快速上线。

## 功能
- 个人简介、联系方式（社交链接或二维码）、产品介绍（图文）
- 一键分享（Web Share API + 常见平台回退）
- 轻量 UI，移动端优先，分享页优化（CTA、社媒预览）
- 后端数据存储采用 Supabase（可选；无配置时自动使用本地示例数据）

## 目录结构
```
index.html
js/app.js
README.md
supabase.sql
```

## 快速开始
1. 打开 `index.html` 即可本地预览（无需构建）。
2. 如需接入 Supabase：
   - 在 `index.html` 中设置 `window.__APP_CONFIG__` 的 `supabaseUrl` 与 `supabaseKey`。
   - 部署 `supabase.sql` 到你的 Supabase 项目（SQL Editor 执行）。
   - 用链接访问：`https://your-domain?handle=founder` 或 `?id=<uuid>`。

## 部署
- 静态托管任选：Vercel、Netlify、Cloudflare Pages、GitHub Pages、阿里云 OSS、七牛、腾讯云 COS。
- 直接把本仓库上传/连接即可。无需服务器。

## SEO/社媒预览
在 `index.html` 中根据你的品牌更新：
- `<title>` 与 `<meta name="description">`
- 可按需增加 Open Graph 标签：
```html
<meta property="og:title" content="联系我 | 一键自我介绍">
<meta property="og:description" content="一键查看我的背景与产品亮点，欢迎合作交流。">
<meta property="og:image" content="https://your.cdn/og.jpg">
<meta property="og:type" content="website">
```

## 配置项（window.__APP_CONFIG__）
```js
{
  supabaseUrl: "https://xxxx.supabase.co",
  supabaseKey: "public-anon-key",
  defaultHandle: "founder",
  share: { title: "了解我和我的产品", text: "一键查看我的背景与产品亮点，欢迎合作交流。", url: location.href }
}
```

## 开发提示
- UI 使用 Tailwind CDN，可在 `<script src="https://cdn.tailwindcss.com"></script>` 下方自定义主题色。
- 图标使用 Boxicons（CDN 已引入），在社交按钮中通过 `icon_class` 控制。
- 无 Supabase 配置时将渲染内置示例数据，便于快速演示。

## License
MIT
# contact_me
# contact_me
