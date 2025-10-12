/* eslint-disable no-undef */
const cfg = window.__APP_CONFIG__ || {};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

let supabase = null;
let currentUser = null;
let currentProfile = null;

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
    } else {
      console.log('用户资料已存在');
    }
  } catch (error) {
    console.error('确保用户资料存在时出错:', error);
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
  $('#userAvatar').src = profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
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

// 加载统计数据
async function loadAnalytics() {
  if (!currentProfile) return;
  
  const { count: viewCount } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', currentProfile.id);
  
  const { count: shareCount } = await supabase
    .from('shares')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', currentProfile.id);
  
  $('#viewCount').textContent = viewCount || 0;
  $('#shareCount').textContent = shareCount || 0;
}

// 设置事件监听器
function setupEventListeners() {
  // 保存基本信息
  $all('#profileName, #profileTitle, #profileBio, #profileTags, #profileAvatar, #profileHandle, #themeColor, #ctaLabel, #ctaUrl').forEach(input => {
    input.addEventListener('blur', saveProfile);
  });
  
  // 添加社交链接
  $('#addSocialBtn').addEventListener('click', () => {
    $('#socialModal').showModal();
  });
  
  // 添加产品
  $('#addProductBtn').addEventListener('click', () => {
    $('#productModal').showModal();
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
}

// 保存资料
async function saveProfile() {
  if (!currentUser) return;
  
  const profileData = {
    user_id: currentUser.id,
    name: $('#profileName').value,
    title: $('#profileTitle').value,
    bio: $('#profileBio').value,
    tags: $('#profileTags').value,
    avatar_url: $('#profileAvatar').value,
    handle: $('#profileHandle').value,
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
  $('#userAvatar').src = profileData.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
  
  return currentProfile;
}

// 保存社交链接
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
  
  const { error } = await supabase
    .from('socials')
    .insert(socialData);
  
  if (error) {
    console.error('保存社交链接失败:', error);
    return;
  }
  
  $('#socialModal').close();
  clearSocialForm();
  loadSocials();
}

// 保存产品
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
  
  const { error } = await supabase
    .from('products')
    .insert(productData);
  
  if (error) {
    console.error('保存产品失败:', error);
    return;
  }
  
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
}

function clearProductForm() {
  $('#productName').value = '';
  $('#productDescription').value = '';
  $('#productImage').value = '';
  $('#productUrl').value = '';
  $('#productShareText').value = '';
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
function editSocial(id) {
  // TODO: 实现编辑功能
  console.log('编辑社交链接:', id);
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
function editProduct(id) {
  // TODO: 实现编辑功能
  console.log('编辑产品:', id);
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
