/* eslint-disable no-undef */
/**
 * 阿里云 OSS 图片上传工具
 * 使用 STS 临时凭证上传图片到阿里云 OSS
 */

// OSS 配置
const OSS_CONFIG = {
  region: 'oss-cn-hangzhou', // 根据实际情况修改
  bucket: 'your-bucket-name', // 根据实际情况修改
  stsEndpoint: '/api/sts', // STS 服务端点，需要后端实现
  folder: 'contact-me/' // 上传文件夹前缀
};

/**
 * 获取 STS 临时凭证
 */
async function getStsToken() {
  try {
    const response = await fetch(OSS_CONFIG.stsEndpoint);
    if (!response.ok) {
      throw new Error('获取 STS 凭证失败');
    }
    return await response.json();
  } catch (error) {
    console.error('获取 STS 凭证失败:', error);
    // 降级方案：如果没有 STS 服务，可以使用 Supabase Storage
    return null;
  }
}

/**
 * 上传图片到阿里云 OSS
 * @param {File} file - 要上传的文件
 * @param {Function} onProgress - 上传进度回调
 * @returns {Promise<string>} - 返回图片 URL
 */
async function uploadToOss(file, onProgress) {
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('请上传图片文件');
    }
    
    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片大小不能超过 5MB');
    }
    
    // 获取 STS 凭证
    const stsToken = await getStsToken();
    
    if (!stsToken) {
      // 降级方案：使用 Supabase Storage
      return await uploadToSupabase(file, onProgress);
    }
    
    // 生成唯一文件名
    const ext = file.name.split('.').pop();
    const fileName = `${OSS_CONFIG.folder}${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    
    // 使用阿里云 OSS SDK 上传
    const client = new OSS({
      region: OSS_CONFIG.region,
      accessKeyId: stsToken.accessKeyId,
      accessKeySecret: stsToken.accessKeySecret,
      stsToken: stsToken.securityToken,
      bucket: OSS_CONFIG.bucket
    });
    
    const result = await client.put(fileName, file, {
      progress: (p) => {
        if (onProgress) {
          onProgress(Math.floor(p * 100));
        }
      }
    });
    
    return result.url;
  } catch (error) {
    console.error('上传到 OSS 失败:', error);
    throw error;
  }
}

/**
 * 上传图片到 Supabase Storage（降级方案）
 * @param {File} file - 要上传的文件
 * @param {Function} onProgress - 上传进度回调
 * @returns {Promise<string>} - 返回图片 URL
 */
async function uploadToSupabase(file, onProgress) {
  try {
    const supabase = window.supabase.createClient(
      window.__APP_CONFIG__.supabaseUrl,
      window.__APP_CONFIG__.supabaseKey
    );
    
    // 生成唯一文件名
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const filePath = `public/${fileName}`;
    
    // 上传文件
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // 获取公共 URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('上传到 Supabase 失败:', error);
    throw error;
  }
}

/**
 * 创建图片上传组件
 * @param {Object} options - 配置选项
 * @param {string} options.inputId - 关联的输入框 ID
 * @param {string} options.previewId - 预览图片的 ID（可选）
 * @param {Function} options.onSuccess - 上传成功回调
 * @param {Function} options.onError - 上传失败回调
 */
function createImageUploader(options) {
  const {
    inputId,
    previewId,
    onSuccess,
    onError
  } = options;
  
  // 创建文件选择器
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);
  
  // 创建上传按钮容器
  const container = document.createElement('div');
  container.className = 'flex items-center space-x-2';
  
  // 创建上传按钮
  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'upload-btn px-3 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors duration-200 flex items-center space-x-2';
  uploadBtn.innerHTML = `
    <i class='bx bx-upload'></i>
    <span>上传图片</span>
  `;
  
  // 创建进度条
  const progressBar = document.createElement('div');
  progressBar.className = 'hidden w-full bg-slate-200 rounded-full h-2 overflow-hidden';
  progressBar.innerHTML = '<div class="progress-bar bg-sky-600 h-full transition-all duration-300" style="width: 0%"></div>';
  
  // 创建预览图片（如果指定了 previewId）
  let previewImg = null;
  if (previewId) {
    previewImg = document.getElementById(previewId);
  }
  
  // 点击上传按钮
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // 文件选择后上传
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // 显示进度条
      uploadBtn.classList.add('hidden');
      progressBar.classList.remove('hidden');
      
      // 上传文件
      const url = await uploadToSupabase(file, (progress) => {
        const progressFill = progressBar.querySelector('div');
        progressFill.style.width = `${progress}%`;
      });
      
      // 更新输入框值
      const input = document.getElementById(inputId);
      if (input) {
        input.value = url;
        // 触发 blur 事件以保存数据
        input.dispatchEvent(new Event('blur'));
      }
      
      // 更新预览图片
      if (previewImg) {
        previewImg.src = url;
      }
      
      // 成功回调
      if (onSuccess) {
        onSuccess(url);
      }
      
      // 显示成功提示
      showToast('上传成功', 'success');
    } catch (error) {
      console.error('上传失败:', error);
      
      // 失败回调
      if (onError) {
        onError(error);
      }
      
      // 显示错误提示
      showToast(error.message || '上传失败', 'error');
    } finally {
      // 隐藏进度条，显示上传按钮
      uploadBtn.classList.remove('hidden');
      progressBar.classList.add('hidden');
      
      // 重置进度条
      const progressFill = progressBar.querySelector('div');
      progressFill.style.width = '0%';
      
      // 清空文件选择器
      fileInput.value = '';
    }
  });
  
  container.appendChild(uploadBtn);
  container.appendChild(progressBar);
  
  return container;
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型（success, error, info）
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-0 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500'
  }`;
  toast.innerHTML = `
    <div class="flex items-center space-x-2">
      <i class='bx ${
        type === 'success' ? 'bx-check-circle' :
        type === 'error' ? 'bx-error-circle' :
        'bx-info-circle'
      }'></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 3 秒后自动消失
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// 导出工具函数
window.ImageUploader = {
  uploadToOss,
  uploadToSupabase,
  createImageUploader,
  showToast
};
