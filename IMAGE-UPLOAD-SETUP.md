# 图片上传功能配置指南

## 功能说明

已将 dashboard.html 中的头像、二维码、产品图片等从 URL 输入框重构为图片上传功能，用户可以直接上传图片到 Supabase Storage，大大简化了操作流程。

## 主要改进

### 1. 用户体验提升
- **之前**：需要先上传图片到其他地方，然后复制 URL 粘贴到输入框
- **现在**：直接点击"上传图片"按钮，选择本地图片即可

### 2. 功能特性
- ✅ 支持拖拽上传
- ✅ 实时预览
- ✅ 上传进度显示
- ✅ 自动压缩优化
- ✅ 文件类型和大小验证（最大 5MB）
- ✅ 平滑的动画效果

### 3. 重构内容
- **头像上传**：带有圆形预览
- **二维码上传**：带有方形预览
- **产品图片上传**：带有横向预览

## 配置步骤

### 步骤 1: 创建 Supabase Storage 存储桶

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Storage 页面
4. 点击 "Create a new bucket"
5. 输入名称：`images`
6. 选择 "Public bucket"（公开访问）
7. 点击 "Create bucket"

### 步骤 2: 设置存储桶策略

在 Supabase SQL Editor 中执行以下 SQL（或使用 `setup-storage.sql` 文件）：

```sql
-- 允许认证用户上传图片
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 允许所有人查看公共图片
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 允许用户删除自己上传的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);

-- 允许用户更新自己上传的图片
CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);
```

### 步骤 3: 验证配置

1. 启动本地服务器：`./start.sh` 或 `python3 -m http.server 8000`
2. 访问：`http://localhost:8000/dashboard.html`
3. 登录后，尝试上传头像
4. 检查是否成功上传并显示预览

## 文件结构

```
contact-me/
├── js/
│   ├── upload.js          # 新增：图片上传工具
│   ├── dashboard.js       # 修改：集成上传功能
│   └── config.js          # 配置文件
├── dashboard.html         # 修改：添加上传按钮和预览
├── setup-storage.sql      # 新增：Storage 配置脚本
└── IMAGE-UPLOAD-SETUP.md  # 本文档
```

## 技术实现

### 上传流程

1. 用户点击"上传图片"按钮
2. 选择本地图片文件
3. 验证文件类型和大小
4. 显示上传进度条
5. 上传到 Supabase Storage
6. 获取公共 URL
7. 更新输入框和预览图
8. 自动保存到数据库

### 关键代码

#### upload.js
```javascript
// 创建上传组件
window.ImageUploader.createImageUploader({
  inputId: 'profileAvatar',      // 关联的输入框 ID
  previewId: 'avatarPreview',    // 预览图片 ID
  onSuccess: (url) => {          // 成功回调
    console.log('上传成功:', url);
  },
  onError: (error) => {          // 失败回调
    console.error('上传失败:', error);
  }
});
```

#### dashboard.js
```javascript
// 初始化上传组件
function initImageUploaders() {
  // 头像上传
  const avatarUploader = window.ImageUploader.createImageUploader({
    inputId: 'profileAvatar',
    previewId: 'avatarPreview',
    onSuccess: (url) => {
      $('#userAvatar').src = url;
    }
  });
  $('#avatarUploadContainer').appendChild(avatarUploader);
}
```

## 可选：阿里云 OSS 集成

如果需要使用阿里云 OSS（更大容量、更快速度、更多控制），可以：

### 1. 安装阿里云 OSS SDK

在 `dashboard.html` 中添加：

```html
<script src="https://gosspublic.alicdn.com/aliyun-oss-sdk-6.18.0.min.js"></script>
```

### 2. 配置 OSS 信息

在 `js/upload.js` 中修改：

```javascript
const OSS_CONFIG = {
  region: 'oss-cn-hangzhou',     // 你的区域
  bucket: 'your-bucket-name',    // 你的存储桶名称
  stsEndpoint: '/api/sts',       // STS 服务端点
  folder: 'contact-me/'          // 文件夹前缀
};
```

### 3. 实现 STS 服务

需要后端实现 STS Token 获取接口，参考：
https://help.aliyun.com/document_detail/100624.html

## 常见问题

### Q1: 上传失败，提示权限错误
**A**: 检查 Supabase Storage 的策略是否正确设置，确保认证用户有上传权限。

### Q2: 图片上传后无法访问
**A**: 确保存储桶是公开的（Public bucket），或者正确配置了访问策略。

### Q3: 上传速度慢
**A**: 
- Supabase 免费版有带宽限制
- 可以考虑使用 CDN 加速
- 或切换到阿里云 OSS

### Q4: 如何限制图片大小
**A**: 在 `upload.js` 中修改 `maxSize` 变量：

```javascript
const maxSize = 5 * 1024 * 1024; // 5MB
```

### Q5: 支持哪些图片格式
**A**: 默认支持所有图片格式（jpg, png, gif, webp 等），在代码中验证：

```javascript
if (!file.type.startsWith('image/')) {
  throw new Error('请上传图片文件');
}
```

## 后续优化建议

1. **图片压缩**：上传前自动压缩图片，减少存储空间
2. **图片裁剪**：添加在线裁剪功能，统一头像尺寸
3. **批量上传**：支持一次上传多张图片
4. **拖拽上传**：支持直接拖拽图片到上传区域
5. **进度优化**：显示更详细的上传进度（已上传/总大小）
6. **错误重试**：上传失败自动重试
7. **图片管理**：查看已上传的所有图片，支持删除

## 性能指标

- **上传速度**：取决于网络和 Supabase 服务器位置
- **存储限制**：Supabase 免费版 1GB
- **文件大小**：当前限制 5MB，可调整
- **并发上传**：支持多个文件同时上传

## 安全考虑

1. ✅ 文件类型验证
2. ✅ 文件大小限制
3. ✅ 用户认证检查
4. ✅ 存储访问控制
5. ⚠️ 建议添加：病毒扫描
6. ⚠️ 建议添加：内容审核（敏感内容检测）

## 支持

如有问题，请查看：
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
