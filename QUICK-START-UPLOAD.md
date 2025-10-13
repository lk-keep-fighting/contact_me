# 图片上传功能快速启动指南

## 🚀 快速开始

### 1. 创建 Supabase Storage 存储桶

最简单的方法 - 使用 Supabase Dashboard：

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 左侧菜单点击 **Storage**
4. 点击 **New bucket** 按钮
5. 输入名称：`images`
6. 勾选 **Public bucket**
7. 点击 **Create bucket**

### 2. 设置访问策略

点击刚创建的 `images` 存储桶，然后点击 **Policies** 标签：

**方式一：使用 UI 创建策略**
1. 点击 **New Policy**
2. 选择模板 **Allow public read access**
3. 点击 **Use this template** 并保存

**方式二：使用 SQL**
1. 左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴以下代码：

```sql
-- 允许认证用户上传
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 允许所有人查看
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');
```

4. 点击 **Run** 执行

### 3. 启动本地服务器

在项目目录下运行：

```bash
# 方式 1: 使用启动脚本
./start.sh

# 方式 2: 使用 Python
python3 -m http.server 8000

# 方式 3: 使用 Node.js
npx http-server -p 8000
```

### 4. 测试上传功能

1. 浏览器访问：http://localhost:8000/test-upload.html
2. 点击任意"上传图片"按钮
3. 选择一张图片
4. 查看上传进度和结果

### 5. 访问管理后台

1. 访问：http://localhost:8000/login.html
2. 登录你的账号
3. 进入 Dashboard
4. 尝试上传头像、二维码、产品图片

## ✨ 功能特性

- ✅ **一键上传**：点击按钮直接上传本地图片
- ✅ **实时预览**：上传后立即显示预览
- ✅ **进度显示**：可视化上传进度条
- ✅ **自动保存**：上传成功后自动保存到数据库
- ✅ **文件验证**：自动检查文件类型和大小
- ✅ **错误提示**：友好的错误提示信息
- ✅ **平滑动画**：优雅的交互动画效果

## 📁 重构内容

### 修改的文件

1. **dashboard.html**
   - 头像输入框 → 头像上传 + 预览
   - 二维码输入框 → 二维码上传 + 预览
   - 产品图片输入框 → 产品图片上传 + 预览

2. **dashboard.js**
   - 新增 `initImageUploaders()` 函数
   - 新增 `setupQrPreview()` 函数
   - 新增 `setupProductImagePreview()` 函数
   - 更新 `populateForm()` 函数

3. **新增文件**
   - `js/upload.js` - 图片上传工具库
   - `setup-storage.sql` - Supabase Storage 配置
   - `test-upload.html` - 上传功能测试页面
   - `IMAGE-UPLOAD-SETUP.md` - 详细配置文档

## 🎨 界面对比

### 之前
```
头像URL: [https://example.com/avatar.jpg_________]
```

### 现在
```
头像:  [圆形预览]  
       [https://example.com/avatar.jpg_________] (只读)
       [📤 上传图片]
```

## 📊 技术栈

- **前端**: HTML, TailwindCSS, JavaScript
- **存储**: Supabase Storage
- **图标**: Boxicons
- **动画**: CSS Transitions

## ⚙️ 配置说明

### 文件大小限制

在 `js/upload.js` 中修改：

```javascript
const maxSize = 5 * 1024 * 1024; // 5MB
```

### 支持的文件类型

默认支持所有图片格式，如需限制：

```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('仅支持 JPG、PNG、WebP 格式');
}
```

### 存储路径

图片存储在 Supabase Storage 的路径：

```
bucket: images
path: public/{timestamp}-{random}.{ext}
```

## 🔧 故障排查

### 问题：上传按钮不显示

**解决方案**：
1. 检查浏览器控制台是否有错误
2. 确认 `js/upload.js` 已正确加载
3. 检查 `window.ImageUploader` 是否存在

```javascript
console.log(window.ImageUploader); // 应该显示对象
```

### 问题：上传失败，提示 403

**解决方案**：
1. 检查 Supabase Storage 策略是否正确
2. 确认用户已登录
3. 验证存储桶名称是否为 `images`

### 问题：图片上传成功但无法显示

**解决方案**：
1. 检查存储桶是否设置为 Public
2. 在 Supabase Dashboard 中手动查看上传的文件
3. 复制文件的 Public URL 测试是否能访问

### 问题：上传速度很慢

**解决方案**：
1. 压缩图片后再上传
2. 检查网络连接
3. Supabase 服务器位置可能较远，考虑使用 CDN

## 📝 使用示例

### 在其他页面使用上传功能

```html
<!-- 1. 引入依赖 -->
<script src="/js/config.js"></script>
<script src="https://unpkg.com/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>
<script src="/js/upload.js"></script>

<!-- 2. 添加 HTML 元素 -->
<input id="myImageUrl" type="text" readonly>
<div id="myUploadContainer"></div>

<!-- 3. 初始化上传组件 -->
<script>
  const uploader = window.ImageUploader.createImageUploader({
    inputId: 'myImageUrl',
    onSuccess: (url) => {
      console.log('上传成功:', url);
    },
    onError: (error) => {
      console.error('上传失败:', error);
    }
  });
  document.getElementById('myUploadContainer').appendChild(uploader);
</script>
```

## 🎯 下一步

- [ ] 添加图片裁剪功能
- [ ] 支持拖拽上传
- [ ] 批量上传多张图片
- [ ] 图片压缩优化
- [ ] 上传历史记录
- [ ] 图片管理界面

## 📚 相关文档

- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [完整配置指南](./IMAGE-UPLOAD-SETUP.md)
- [测试页面](http://localhost:8000/test-upload.html)

## 💡 提示

**最佳实践**：
1. 上传前压缩图片可节省存储空间和带宽
2. 头像建议尺寸：200x200 到 500x500
3. 二维码建议尺寸：300x300 到 600x600
4. 产品图片建议尺寸：800x600 或 1200x900
5. 使用 WebP 格式可减少 30% 文件大小

**安全提示**：
- ✅ 已实现：文件类型验证
- ✅ 已实现：文件大小限制
- ✅ 已实现：用户认证检查
- ⚠️  建议添加：内容安全检测
- ⚠️  建议添加：上传频率限制

---

**需要帮助？** 查看 [IMAGE-UPLOAD-SETUP.md](./IMAGE-UPLOAD-SETUP.md) 获取详细文档
