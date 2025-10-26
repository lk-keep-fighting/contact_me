/* eslint-disable no-undef */
const cfg = window.__APP_CONFIG__ || {};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

let supabase = null;
let currentUser = null;
let currentProfile = null;
let handleCheckTimeout = null; // 防抖计时器

// 初始化
async function init() {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    console.error('Supabase配置缺失');
    return;
  }
  
  supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  
  // 检查用户登录状态
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // 未登录，跳转到登录页面
    window.location.href = '/login.html';
    return;
  }
  
  currentUser = user;
  await loadUserProfile();
  setupEventListeners();
  initImageUploaders();
}

// 确保用户资料存在
async function ensureUserProfile() {
  try {
    // 检查用户资料是否存在
    const { data: existingProfile, error: selectError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', currentUser.id)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('查询用户资料失败:', selectError);
      return;
    }
    
    if (!existingProfile) {
      console.log('用户资料不存在，正在创建...');
      // 创建用户资料
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || '新用户'
        });
      
      if (error) {
        console.error('创建用户资料失败:', error);
        throw error;
      }
      
      console.log('用户资料创建成功');
      
      // 为新用户生成默认handle
      await ensureDefaultHandle();
    } else {
      console.log('用户资料已存在');
    }
  } catch (error) {
    console.error('确保用户资料存在时出错:', error);
  }
}

// 为新用户确保默认handle
async function ensureDefaultHandle() {
  try {
    // 检查是否已有profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('user_id', currentUser.id)
      .single();
    
    // 如果已有profile且有handle，则不需要处理
    if (existingProfile?.handle) {
      return;
    }
    
    // 生成默认handle
    const userName = currentUser.user_metadata?.name || '新用户';
    const userEmail = currentUser.email;
    const defaultHandle = await generateDefaultHandle(userName, userEmail);
    
    console.log('为新用户生成默认handle:', defaultHandle);
    
    // 设置到输入框
    $('#profileHandle').value = defaultHandle;
    
    // 显示成功提示
    showHandleValidation(true, '已为您生成默认标识，可自由修改');
    
  } catch (error) {
    console.error('生成默认handle失败:', error);
  }
}

// 加载用户资料
async function loadUserProfile() {
  // 首先确保用户资料存在
  await ensureUserProfile();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('加载资料失败:', error);
    return;
  }
  
  currentProfile = profile;
  if (profile) {
    populateForm(profile);
    loadSocials();
    loadProducts();
    loadAnalytics();
  }
}

// 填充表单数据
function populateForm(profile) {
  $('#profileName').value = profile.name || '';
  $('#profileTitle').value = profile.title || '';
  $('#profileBio').value = profile.bio || '';
  $('#profileTags').value = profile.tags || '';
  $('#profileAvatar').value = profile.avatar_url || '';
  $('#profileHandle').value = profile.handle || '';
  $('#themeColor').value = profile.theme_color || '#0ea5e9';
  $('#ctaLabel').value = profile.cta_label || '';
  $('#ctaUrl').value = profile.cta_url || '';
  $('#userName').textContent = profile.name || '用户';
  
  // 更新头像预览
  const avatarUrl = profile.avatar_url || '/assets/images/default-avatar.svg';
  $('#userAvatar').src = avatarUrl;
  $('#avatarPreview').src = avatarUrl;
  
  // 更新URL预览
  const preview = $('#handlePreview');
  if (preview) {
    preview.textContent = profile.handle || 'your-handle';
  }
  
  // 如果handle存在，显示成功状态
  if (profile.handle) {
    showHandleValidation(true, '当前标识');
  }
}

// 加载社交链接
async function loadSocials() {
  if (!currentProfile) return;
  
  const { data: socials } = await supabase
    .from('socials')
    .select('*')
    .eq('profile_id', currentProfile.id)
    .eq('is_published', true)
    .order('sort_order');
  
  const container = $('#socialsList');
  container.innerHTML = '';
  
  socials?.forEach(social => {
    const item = createSocialItem(social);
    container.appendChild(item);
  });
}

// 创建社交链接项
function createSocialItem(social) {
  const div = document.createElement('div');
  div.className = 'flex items-center justify-between p-3 border border-slate-200 rounded-lg';
  div.innerHTML = `
    <div class="flex items-center space-x-3">
      <i class='bx ${social.icon_class || 'bx-link'} text-lg'></i>
      <div>
        <div class="font-medium">${social.label || social.platform}</div>
        <div class="text-sm text-slate-500">${social.url || '二维码'}</div>
      </div>
    </div>
    <div class="flex items-center space-x-2">
      <button class="p-1 text-slate-400 hover:text-slate-600" onclick="editSocial('${social.id}')">
        <i class='bx bx-edit'></i>
      </button>
      <button class="p-1 text-red-400 hover:text-red-600" onclick="deleteSocial('${social.id}')">
        <i class='bx bx-trash'></i>
      </button>
    </div>
  `;
  return div;
}

// 加载产品
async function loadProducts() {
  if (!currentProfile) return;
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('profile_id', currentProfile.id)
    .eq('is_published', true)
    .order('sort_order');
  
  const container = $('#productsList');
  container.innerHTML = '';
  
  products?.forEach(product => {
    const item = createProductItem(product);
    container.appendChild(item);
  });
}

// 创建产品项
function createProductItem(product) {
  const div = document.createElement('div');
  div.className = 'border border-slate-200 rounded-lg p-4';
  div.innerHTML = `
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <h3 class="font-semibold">${product.name}</h3>
        <p class="text-sm text-slate-600 mt-1">${product.description || ''}</p>
        ${product.url ? `<a href="${product.url}" target="_blank" class="text-sm text-sky-600 hover:underline">查看产品</a>` : ''}
      </div>
      <div class="flex items-center space-x-2 ml-4">
        <button class="p-1 text-slate-400 hover:text-slate-600" onclick="editProduct('${product.id}')">
          <i class='bx bx-edit'></i>
        </button>
        <button class="p-1 text-red-400 hover:text-red-600" onclick="deleteProduct('${product.id}')">
          <i class='bx bx-trash'></i>
        </button>
      </div>
    </div>
  `;
  return div;
}

// 加载访问统计数据
async function loadAnalytics() {
  if (!currentProfile) {
    console.warn('没有当前用户资料，无法加载统计');
    $('#viewCount').textContent = '0';
    return;
  }
  
  console.log('加载访问统计，profile_id:', currentProfile.id);
  
  try {
    const { count: viewCount, error } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', currentProfile.id);
    
    if (error) {
      console.error('加载访问统计失败:', error);
      $('#viewCount').textContent = '0';
      return;
    }
    
    console.log('访问统计加载成功:', viewCount);
    $('#viewCount').textContent = viewCount || 0;
    
  } catch (error) {
    console.error('加载访问统计错误:', error);
    $('#viewCount').textContent = '0';
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 保存基本信息
  $all('#profileName, #profileTitle, #profileBio, #profileTags, #profileAvatar, #themeColor, #ctaLabel, #ctaUrl').forEach(input => {
    input.addEventListener('blur', saveProfile);
  });
  
  // 页面标识特殊处理
  const handleInput = $('#profileHandle');
  handleInput.addEventListener('input', handleInputChange);
  handleInput.addEventListener('blur', async () => {
    const handle = handleInput.value.trim();
    if (handle) {
      await validateHandleInRealTime(handle);
      // 只有在验证通过后才保存
      try {
        await saveProfile();
      } catch (error) {
        console.log('保存失败（handle验证问题）:', error.message);
      }
    }
  });
  
  // 添加社交链接
  $('#addSocialBtn').addEventListener('click', () => {
    const modal = $('#socialModal');
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.style.display = 'block';
    }
  });
  
  // 添加产品
  $('#addProductBtn').addEventListener('click', () => {
    const modal = $('#productModal');
    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.style.display = 'block';
    }
  });
  
  // 模态框事件
  $('#cancelSocial').addEventListener('click', () => $('#socialModal').close());
  $('#cancelProduct').addEventListener('click', () => $('#productModal').close());
  $('#saveSocial').addEventListener('click', saveSocial);
  $('#saveProduct').addEventListener('click', saveProduct);
  
  // 预览和发布
  $('#previewBtn').addEventListener('click', previewPage);
  $('#publishBtn').addEventListener('click', publishPage);
  $('#refreshPreview').addEventListener('click', refreshPreview);
  
  // 退出登录
  $('#logoutBtn').addEventListener('click', logout);
}

// 生成唯一的默认handle
async function generateDefaultHandle(name, email) {
  // 尝试从姓名生成
  let baseHandle = name ? name.toLowerCase()
    .replace(/[\s\u4e00-\u9fff]+/g, '') // 移除中文和空格
    .replace(/[^a-z0-9]/g, '') // 只保留字母和数字
    .substring(0, 20) : '';
  
  // 如果姓名不可用，从邮箱生成
  if (!baseHandle && email) {
    baseHandle = email.split('@')[0]
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }
  
  // 如果还是没有，使用默认值
  if (!baseHandle) {
    baseHandle = 'user';
  }
  
  // 检查唯一性并添加数字后缀
  let handle = baseHandle;
  let counter = 1;
  
  while (await checkHandleExists(handle)) {
    handle = `${baseHandle}${counter}`;
    counter++;
    if (counter > 999) break; // 防止无限循环
  }
  
  return handle;
}

// 检查handle是否已存在
async function checkHandleExists(handle, excludeCurrentProfile = true) {
  if (!handle) return false;
  
  let query = supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle);
  
  // 如果是更新现有资料，排除当前资料
  if (excludeCurrentProfile && currentProfile) {
    query = query.neq('id', currentProfile.id);
  }
  
  const { data, error } = await query.single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('检查handle失败:', error);
    return false;
  }
  
  return !!data;
}

// 验证handle有效性
function validateHandle(handle) {
  if (!handle || handle.trim().length === 0) {
    return { valid: false, message: '页面标识不能为空' };
  }
  
  if (handle.length < 3) {
    return { valid: false, message: '页面标识至少需要3个字符' };
  }
  
  if (handle.length > 30) {
    return { valid: false, message: '页面标识不能超过30个字符' };
  }
  
  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(handle)) {
    return { valid: false, message: '页面标识只能包含小写字母、数字、下划线和短横线，且不能以特殊符号开头或结尾' };
  }
  
  // 检查保留字
  const reservedWords = ['admin', 'api', 'www', 'mail', 'ftp', 'blog', 'help', 'support', 'contact', 'about', 'login', 'register', 'dashboard', 'profile', 'settings'];
  if (reservedWords.includes(handle.toLowerCase())) {
    return { valid: false, message: '该标识为系统保留字，请选择其他标识' };
  }
  
  return { valid: true, message: '' };
}

// 显示handle验证状态
function showHandleValidation(isValid, message, isChecking = false) {
  const input = $('#profileHandle');
  const container = input.parentElement;
  
  // 移除现有的提示
  const existingMsg = container.querySelector('.handle-validation');
  if (existingMsg) existingMsg.remove();
  
  // 重置输入框样式
  input.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500');
  
  if (isChecking) {
    input.classList.add('border-yellow-500');
    const msg = document.createElement('p');
    msg.className = 'handle-validation text-xs text-yellow-600 mt-1';
    msg.innerHTML = '<i class="bx bx-loader bx-spin"></i> 检查可用性...';
    container.appendChild(msg);
  } else if (!isValid) {
    input.classList.add('border-red-500');
    const msg = document.createElement('p');
    msg.className = 'handle-validation text-xs text-red-600 mt-1';
    msg.innerHTML = `<i class="bx bx-error-circle"></i> ${message}`;
    container.appendChild(msg);
  } else if (message) {
    input.classList.add('border-green-500');
    const msg = document.createElement('p');
    msg.className = 'handle-validation text-xs text-green-600 mt-1';
    msg.innerHTML = `<i class="bx bx-check-circle"></i> ${message}`;
    container.appendChild(msg);
  }
}

// 处理handle输入变化
function handleInputChange() {
  const input = $('#profileHandle');
  const handle = input.value.trim().toLowerCase();
  
  // 更新输入框为小写
  input.value = handle;
  
  // 更新URL预览
  const preview = $('#handlePreview');
  if (preview) {
    preview.textContent = handle || 'your-handle';
  }
  
  // 清除之前的计时器
  if (handleCheckTimeout) {
    clearTimeout(handleCheckTimeout);
  }
  
  // 如果为空，清除提示
  if (!handle) {
    showHandleValidation(false, '');
    return;
  }
  
  // 防抖延迟500ms后验证
  handleCheckTimeout = setTimeout(async () => {
    await validateHandleInRealTime(handle);
  }, 500);
}

// 实时验证handle
async function validateHandleInRealTime(handle) {
  // 显示检查状态
  showHandleValidation(true, '', true);
  
  // 首先验证格式
  const validation = validateHandle(handle);
  if (!validation.valid) {
    showHandleValidation(false, validation.message);
    return false;
  }
  
  // 检查唯一性
  try {
    const exists = await checkHandleExists(handle);
    if (exists) {
      showHandleValidation(false, '该标识已被使用，请选择其他标识');
      return false;
    } else {
      showHandleValidation(true, '标识可用');
      return true;
    }
  } catch (error) {
    console.error('检查handle失败:', error);
    showHandleValidation(false, '检查失败，请稍后重试');
    return false;
  }
}

// 保存资料
async function saveProfile() {
  if (!currentUser) return;
  
  const handle = $('#profileHandle').value.trim();
  
  // 验证handle
  const validation = validateHandle(handle);
  if (!validation.valid) {
    showHandleValidation(false, validation.message);
    throw new Error(validation.message);
  }
  
  // 检查handle唯一性
  const exists = await checkHandleExists(handle);
  if (exists) {
    showHandleValidation(false, '该页面标识已被使用，请选择其他标识');
    throw new Error('该页面标识已被使用');
  }
  
  const profileData = {
    user_id: currentUser.id,
    name: $('#profileName').value,
    title: $('#profileTitle').value,
    bio: $('#profileBio').value,
    tags: $('#profileTags').value,
    avatar_url: $('#profileAvatar').value,
    handle: handle,
    theme_color: $('#themeColor').value,
    cta_label: $('#ctaLabel').value,
    cta_url: $('#ctaUrl').value,
    is_published: true
  };
  
  if (currentProfile) {
    // 更新现有资料
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', currentProfile.id);
    
    if (error) {
      console.error('更新资料失败:', error);
      throw error;
    }
  } else {
    // 创建新资料
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) {
      console.error('创建资料失败:', error);
      throw error;
    }
    
    currentProfile = data;
  }
  
  // 更新用户信息显示
  $('#userName').textContent = profileData.name || '用户';
  const avatarUrl = profileData.avatar_url || '/assets/images/default-avatar.svg';
  $('#userAvatar').src = avatarUrl;
  $('#avatarPreview').src = avatarUrl;
  
  return currentProfile;
}

// 保存社交链接（新增或更新）
async function saveSocial() {
  if (!currentProfile) return;
  
  const socialData = {
    profile_id: currentProfile.id,
    platform: $('#socialPlatform').value,
    label: $('#socialLabel').value,
    icon_class: getIconClass($('#socialPlatform').value),
    url: $('#socialUrl').value,
    qr_image_url: $('#socialQr').value,
    qr_note: $('#socialQrNote').value,
    is_published: true
  };
  
  let error;
  if (window.editingSocialId) {
    // 更新
    ({ error } = await supabase
      .from('socials')
      .update(socialData)
      .eq('id', window.editingSocialId));
  } else {
    // 新增
    ({ error } = await supabase
      .from('socials')
      .insert(socialData));
  }
  
  if (error) {
    console.error('保存社交链接失败:', error);
    return;
  }
  
  // 重置编辑状态
  window.editingSocialId = null;
  $('#socialModalTitle').textContent = '新增联系方式';
  $('#saveSocial').textContent = '保存';
  
  $('#socialModal').close();
  clearSocialForm();
  loadSocials();
}

// 保存产品（新增或更新）
async function saveProduct() {
  if (!currentProfile) return;
  
  const productData = {
    profile_id: currentProfile.id,
    name: $('#productName').value,
    description: $('#productDescription').value,
    image_url: $('#productImage').value,
    url: $('#productUrl').value,
    share_text: $('#productShareText').value,
    is_published: true
  };
  
  let error;
  if (window.editingProductId) {
    // 更新
    ({ error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', window.editingProductId));
  } else {
    // 新增
    ({ error } = await supabase
      .from('products')
      .insert(productData));
  }
  
  if (error) {
    console.error('保存产品失败:', error);
    return;
  }
  
  // 重置编辑状态
  window.editingProductId = null;
  $('#productModalTitle').textContent = '新增产品';
  $('#saveProduct').textContent = '保存';

  $('#productModal').close();
  clearProductForm();
  loadProducts();
}

// 获取图标类名
function getIconClass(platform) {
  const icons = {
    'WeChat': 'bx-qr',
    'WeChatOfficial': 'bx-qr',
    'Weibo': 'bxl-weibo',
    'LinkedIn': 'bxl-linkedin',
    'Twitter': 'bxl-twitter',
    'Email': 'bx-envelope',
    'Phone': 'bx-phone',
    'QQ': 'bxl-qq',
    'Custom': 'bx-link'
  };
  return icons[platform] || 'bx-link';
}

// 清空表单
function clearSocialForm() {
  $('#socialPlatform').value = 'WeChat';
  $('#socialLabel').value = '';
  $('#socialUrl').value = '';
  $('#socialQr').value = '';
  $('#socialQrNote').value = '';
  
  // 重置编辑状态
  window.editingSocialId = null;
  $('#socialModalTitle').textContent = '新增联系方式';
  $('#saveSocial').textContent = '保存';
  
  // 隐藏预览
  const container = $('#qrPreviewContainer');
  if (container) container.classList.add('hidden');
}

function clearProductForm() {
  $('#productName').value = '';
  $('#productDescription').value = '';
  $('#productImage').value = '';
  $('#productUrl').value = '';
  $('#productShareText').value = '';
  
  // 重置编辑状态  
  window.editingProductId = null;
  $('#productModalTitle').textContent = '新增产品';
  $('#saveProduct').textContent = '保存';
  
  // 隐藏预览
  const container = $('#productImagePreviewContainer');
  if (container) container.classList.add('hidden');
}

// 预览页面
function previewPage() {
  const handle = $('#profileHandle').value;
  if (!handle) {
    alert('请先填写页面标识');
    return;
  }
  
  // 先保存当前数据
  saveProfile().then(() => {
    const url = `/profile.html?handle=${handle}&preview=true`;
    window.open(url, '_blank');
  });
}

// 发布页面
async function publishPage() {
  const handle = $('#profileHandle').value;
  if (!handle) {
    alert('请先填写页面标识');
    return;
  }
  
  // 先保存当前数据
  await saveProfile();
  
  if (!currentProfile) {
    alert('请先保存基本信息');
    return;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_published: true })
    .eq('id', currentProfile.id);
  
  if (error) {
    console.error('发布失败:', error);
    return;
  }
  
  alert('页面已发布！');
}

// 刷新预览
function refreshPreview() {
  const handle = $('#profileHandle').value;
  if (!handle) {
    alert('请先填写页面标识');
    return;
  }
  
  // 先保存当前数据
  saveProfile().then(() => {
    const iframe = $('#previewFrame');
    iframe.src = `/profile.html?handle=${handle}&preview=true`;
  });
}

// 编辑社交链接
async function editSocial(id) {
  console.log('开始编辑社交链接:', id);
  if (!currentProfile) {
    console.error('没有当前用户资料');
    return;
  }
  
  // 获取社交链接数据
  const { data: social, error } = await supabase
    .from('socials')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('获取社交链接数据失败:', error);
    return;
  }
  
  // 填充编辑表单
  $('#socialPlatform').value = social.platform || 'WeChat';
  $('#socialLabel').value = social.label || '';
  $('#socialUrl').value = social.url || '';
  $('#socialQr').value = social.qr_image_url || '';
  $('#socialQrNote').value = social.qr_note || '';
  
  // 设置编辑模式
  window.editingSocialId = id;
  $('#socialModalTitle').textContent = '编辑联系方式';
  $('#saveSocial').textContent = '更新';
  
  // 如果有二维码，显示预览
  if (social.qr_image_url) {
    const preview = $('#qrPreview');
    const container = $('#qrPreviewContainer');
    if (preview && container) {
      preview.src = social.qr_image_url;
      container.classList.remove('hidden');
    }
  }
  
  // 打开模态框
  const modal = $('#socialModal');
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.style.display = 'block';
  }
}

// 删除社交链接
async function deleteSocial(id) {
  if (!confirm('确定要删除这个联系方式吗？')) return;
  
  const { error } = await supabase
    .from('socials')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('删除失败:', error);
    return;
  }
  
  loadSocials();
}

// 编辑产品
async function editProduct(id) {
  console.log('开始编辑产品:', id);
  if (!currentProfile) {
    console.error('没有当前用户资料');
    return;
  }
  
  // 获取产品数据
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('获取产品数据失败:', error);
    return;
  }
  
  // 填充编辑表单
  $('#productName').value = product.name || '';
  $('#productDescription').value = product.description || '';
  $('#productImage').value = product.image_url || '';
  $('#productUrl').value = product.url || '';
  $('#productShareText').value = product.share_text || '';
  
  // 设置编辑模式
  window.editingProductId = id;
  $('#productModalTitle').textContent = '编辑产品';
  $('#saveProduct').textContent = '更新产品';
  
  // 如果有产品图片，显示预览
  if (product.image_url) {
    const preview = $('#productImagePreview');
    const container = $('#productImagePreviewContainer');
    if (preview && container) {
      preview.src = product.image_url;
      container.classList.remove('hidden');
    }
  }
  
  // 打开模态框
  const modal = $('#productModal');
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.style.display = 'block';
  }
}

// 删除产品
async function deleteProduct(id) {
  if (!confirm('确定要删除这个产品吗？')) return;
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('删除失败:', error);
    return;
  }
  
  loadProducts();
}

// 退出登录
async function logout() {
  // 使用通用退出函数
  const success = await window.AuthUtils?.performLogout?.() || 
                  await performFallbackLogout();
  
  if (success) {
    // 清除本地状态
    currentUser = null;
    currentProfile = null;
  }
}

// 备用退出方法（如果通用工具未加载）
async function performFallbackLogout() {
  if (!confirm('确认要退出登录吗？')) {
    return false;
  }
  
  try {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert('退出失败，请重试');
        return false;
      }
    }
    window.location.href = '/login.html';
    return true;
  } catch (error) {
    alert('退出异常，请重试');
    return false;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 初始化图片上传组件
function initImageUploaders() {
  // 头像上传
  const avatarUploader = window.ImageUploader.createImageUploader({
    inputId: 'profileAvatar',
    previewId: 'avatarPreview',
    onSuccess: (url) => {
      $('#userAvatar').src = url;
      console.log('头像上传成功:', url);
    },
    onError: (error) => {
      console.error('头像上传失败:', error);
    }
  });
  $('#avatarUploadContainer').appendChild(avatarUploader);
  
  // 二维码上传
  const qrUploader = window.ImageUploader.createImageUploader({
    inputId: 'socialQr',
    onSuccess: (url) => {
      const previewContainer = $('#qrPreviewContainer');
      const preview = $('#qrPreview');
      preview.src = url;
      previewContainer.classList.remove('hidden');
      console.log('二维码上传成功:', url);
    },
    onError: (error) => {
      console.error('二维码上传失败:', error);
    }
  });
  $('#qrUploadContainer').appendChild(qrUploader);
  
  // 产品图片上传
  const productImageUploader = window.ImageUploader.createImageUploader({
    inputId: 'productImage',
    onSuccess: (url) => {
      const previewContainer = $('#productImagePreviewContainer');
      const preview = $('#productImagePreview');
      preview.src = url;
      previewContainer.classList.remove('hidden');
      console.log('产品图片上传成功:', url);
    },
    onError: (error) => {
      console.error('产品图片上传失败:', error);
    }
  });
  $('#productImageUploadContainer').appendChild(productImageUploader);
  
  // 设置预览功能
  setupQrPreview();
  setupProductImagePreview();
}

// 监听二维码输入框变化
function setupQrPreview() {
  const qrInput = $('#socialQr');
  const previewContainer = $('#qrPreviewContainer');
  const preview = $('#qrPreview');
  
  if (qrInput) {
    qrInput.addEventListener('input', () => {
      const url = qrInput.value.trim();
      if (url) {
        preview.src = url;
        previewContainer.classList.remove('hidden');
      } else {
        previewContainer.classList.add('hidden');
      }
    });
  }
}

// 监听产品图片输入框变化
function setupProductImagePreview() {
  const imageInput = $('#productImage');
  const previewContainer = $('#productImagePreviewContainer');
  const preview = $('#productImagePreview');
  
  if (imageInput) {
    imageInput.addEventListener('input', () => {
      const url = imageInput.value.trim();
      if (url) {
        preview.src = url;
        previewContainer.classList.remove('hidden');
      } else {
        previewContainer.classList.add('hidden');
      }
    });
  }
}
