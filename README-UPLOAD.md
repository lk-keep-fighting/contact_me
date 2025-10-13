# 📸 图片上传功能 - 使用指南

## 🎯 功能概述

已将 Dashboard 中的所有图片输入从 **URL 输入框** 重构为 **本地上传**，极大简化用户操作！

### ⚡ 快速对比

| 操作 | 之前 | 现在 |
|------|------|------|
| **头像设置** | 7步，5分钟 | 2步，30秒 |
| **二维码上传** | 需要图床 | 直接上传 |
| **产品图片** | 手动复制URL | 一键完成 |

## 🚀 立即开始

### 第一步：配置 Supabase Storage

**方式一：使用 UI (推荐新手)**

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单 → **Storage**
4. 点击 **New bucket**
5. 名称填 `images`，勾选 **Public bucket**
6. 点击 **Create bucket**

**方式二：使用 SQL (推荐开发者)**

在 SQL Editor 中执行：

```sql
-- 创建存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);

-- 设置策略
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'images');
```

### 第二步：测试功能

```bash
# 启动服务器
./start.sh

# 或者
python3 -m http.server 8000
```

访问测试页面: http://localhost:8000/test-upload.html

## 📖 使用教程

### 上传头像

1. 打开 Dashboard
2. 找到"基本信息"区域
3. 点击 **📤 上传图片** 按钮
4. 选择头像文件
5. ✅ 自动上传并更新预览

### 上传二维码

1. 点击"添加联系方式"
2. 选择平台（如：微信）
3. 点击二维码区域的 **📤 上传图片**
4. 选择二维码图片
5. ✅ 预览显示，点击保存

### 上传产品图片

1. 点击"添加产品/服务"
2. 填写产品信息
3. 点击 **📤 上传图片**
4. 选择产品图片
5. ✅ 横向预览，点击保存

## 🎨 界面展示

### 头像上传区域

```
┌─────────────────────────────────────────────┐
│ 头像                                         │
│  ╭─────╮                                     │
│  │     │  URL: https://supabase.co/...jpg   │
│  │ 😊  │  [📤 上传图片]                      │
│  │     │                                     │
│  ╰─────╯                                     │
└─────────────────────────────────────────────┘
```

### 上传进度显示

```
[📤 上传图片] → [████████░░ 80%] → [✅ 上传成功]
```

## ✨ 功能特性

- ✅ **一键上传**: 点击按钮，选择文件
- ✅ **实时预览**: 上传后立即显示
- ✅ **进度显示**: 可视化上传进度
- ✅ **自动保存**: 无需手动保存
- ✅ **文件验证**: 自动检查类型和大小
- ✅ **错误提示**: 清晰的错误信息
- ✅ **平滑动画**: 现代化交互体验

## 🔧 技术细节

### 支持的文件

- **类型**: JPG, PNG, GIF, WebP, SVG
- **大小**: 最大 5MB
- **建议**:
  - 头像: 200x200 ~ 500x500
  - 二维码: 300x300 ~ 600x600
  - 产品图: 800x600 ~ 1200x900

### 存储位置

- **服务**: Supabase Storage
- **存储桶**: `images`
- **路径**: `public/{timestamp}-{random}.{ext}`
- **访问**: 公开 URL，永久有效

### 安全措施

1. ✅ 文件类型验证
2. ✅ 文件大小限制 (5MB)
3. ✅ 用户认证检查
4. ✅ 访问权限控制

## 📁 项目文件

### 新增文件

```
contact-me/
├── js/
│   └── upload.js              # ⭐ 上传工具库
├── test-upload.html           # ⭐ 测试页面
├── setup-storage.sql          # ⭐ 配置脚本
├── IMAGE-UPLOAD-SETUP.md      # 详细文档
├── QUICK-START-UPLOAD.md      # 快速指南
├── UPLOAD-DEMO.md             # 功能演示
└── REFACTOR-SUMMARY.md        # 重构总结
```

### 修改文件

```
✏️  dashboard.html    # 添加上传按钮和预览
✏️  js/dashboard.js   # 集成上传功能
```

## 🐛 常见问题

### Q: 上传失败，提示 403 错误

**A**: 检查 Storage 策略是否正确配置

```sql
-- 查看现有策略
SELECT * FROM storage.policies WHERE bucket_id = 'images';

-- 确保有 INSERT 和 SELECT 策略
```

### Q: 图片无法显示

**A**: 确认存储桶是 Public

```sql
-- 检查存储桶配置
SELECT * FROM storage.buckets WHERE id = 'images';

-- public 字段应该为 true
```

### Q: 上传速度很慢

**A**: 
1. 压缩图片后再上传
2. 检查网络连接
3. Supabase 服务器位置较远，可考虑使用 CDN

### Q: 如何修改文件大小限制

**A**: 在 `js/upload.js` 中修改：

```javascript
// 找到这一行
const maxSize = 5 * 1024 * 1024; // 5MB

// 修改为你需要的大小，如 10MB
const maxSize = 10 * 1024 * 1024;
```

## 📊 存储容量

### Supabase 免费版

- **存储**: 1GB
- **带宽**: 2GB/月
- **适合**: 100 人左右

### 需要升级？

| 用户数 | 月上传 | 年消耗 | 建议方案 |
|--------|--------|--------|----------|
| <100   | 少     | <1GB   | 免费版 ✅ |
| 100-500 | 中等   | 1-8GB  | Pro ($25/月) |
| >500   | 大量   | >8GB   | Team ($599/月) |

## 🎯 最佳实践

### 优化建议

1. **压缩图片**: 使用工具如 TinyPNG
2. **格式选择**: WebP > PNG > JPG
3. **尺寸控制**: 不超过建议尺寸
4. **定期清理**: 删除无用图片

### 示例工具

```bash
# 使用 ImageMagick 压缩
convert input.jpg -quality 85 output.jpg

# 转换为 WebP
cwebp -q 80 input.jpg -o output.webp

# 调整尺寸
convert input.jpg -resize 800x600 output.jpg
```

## 🔗 相关链接

- 📘 [详细配置文档](./IMAGE-UPLOAD-SETUP.md)
- 🚀 [快速启动指南](./QUICK-START-UPLOAD.md)
- 🎬 [功能演示说明](./UPLOAD-DEMO.md)
- 📝 [重构总结](./REFACTOR-SUMMARY.md)
- 🌐 [Supabase Storage 文档](https://supabase.com/docs/guides/storage)

## 🎓 高级用法

### 在其他页面使用

```html
<!-- 引入依赖 -->
<script src="/js/config.js"></script>
<script src="https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="/js/upload.js"></script>

<!-- 使用组件 -->
<div id="myUploader"></div>
<script>
  const uploader = window.ImageUploader.createImageUploader({
    inputId: 'myInput',
    onSuccess: (url) => console.log('成功:', url)
  });
  document.getElementById('myUploader').appendChild(uploader);
</script>
```

### 自定义样式

```javascript
// 获取上传按钮并修改样式
const btn = uploader.querySelector('.upload-btn');
btn.className = 'my-custom-btn';
btn.textContent = '点击上传';
```

### 监听上传事件

```javascript
window.ImageUploader.createImageUploader({
  inputId: 'myInput',
  onSuccess: (url) => {
    console.log('✅ 上传成功:', url);
    // 自定义成功处理
  },
  onError: (error) => {
    console.error('❌ 上传失败:', error.message);
    // 自定义错误处理
  }
});
```

## 💬 反馈与支持

遇到问题？
1. 查看 [常见问题](#-常见问题)
2. 阅读 [详细文档](./IMAGE-UPLOAD-SETUP.md)
3. 检查浏览器控制台错误

建议改进？
- 在项目中提交 Issue
- 贡献代码 Pull Request

---

**更新日期**: 2025-10-14  
**版本**: 1.0.0  
**状态**: ✅ 已完成
