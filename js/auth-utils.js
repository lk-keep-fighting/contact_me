/* 通用认证工具函数 */

// 检查用户登录状态
async function checkAuthStatus() {
  const cfg = window.__APP_CONFIG__ || {};
  
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    console.warn('Supabase配置缺失');
    return { user: null, session: null };
  }
  
  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  
  try {
    const { data: { user, session }, error } = await client.auth.getUser();
    
    if (error) {
      console.error('检查登录状态失败:', error);
      return { user: null, session: null };
    }
    
    return { user, session, client };
  } catch (err) {
    console.error('认证检查异常:', err);
    return { user: null, session: null };
  }
}

// 通用退出登录函数
async function performLogout(options = {}) {
  const {
    confirmMessage = '确认要退出登录吗？',
    redirectUrl = '/login.html',
    showAlert = true
  } = options;
  
  // 确认退出
  if (confirmMessage && !confirm(confirmMessage)) {
    return false;
  }
  
  try {
    console.log('开始退出登录...');
    
    const { client } = await checkAuthStatus();
    
    if (client) {
      const { error } = await client.auth.signOut();
      if (error) {
        console.error('退出失败:', error);
        if (showAlert) {
          alert('退出失败，请重试');
        }
        return false;
      }
    }
    
    // 清除可能的本地存储
    try {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
    } catch (e) {
      // 忽略清理错误
    }
    
    console.log('退出成功');
    
    // 跳转到指定页面
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
    
    return true;
    
  } catch (error) {
    console.error('退出异常:', error);
    if (showAlert) {
      alert('退出异常，请重试');
    }
    return false;
  }
}

// 添加退出按钮到页面
function addLogoutButton(containerId = 'logoutContainer', options = {}) {
  const {
    buttonText = '退出登录',
    buttonClass = 'px-3 py-1 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors',
    iconClass = 'bx bx-log-out',
    showText = false
  } = options;
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`找不到容器: ${containerId}`);
    return;
  }
  
  const button = document.createElement('button');
  button.className = buttonClass;
  button.title = buttonText;
  button.innerHTML = `
    <i class='${iconClass} align-[-2px]'></i>
    ${showText ? ` ${buttonText}` : ''}
  `;
  
  button.addEventListener('click', () => performLogout());
  
  container.appendChild(button);
}

// 保护需要登录的页面
async function requireAuth(redirectUrl = '/login.html') {
  const { user } = await checkAuthStatus();
  
  if (!user) {
    console.log('用户未登录，跳转到登录页');
    window.location.href = redirectUrl;
    return false;
  }
  
  return true;
}

// 如果已登录则跳转到dashboard（用于登录页面）
async function redirectIfLoggedIn(dashboardUrl = '/dashboard.html') {
  const { user } = await checkAuthStatus();
  
  if (user) {
    console.log('用户已登录，跳转到dashboard');
    window.location.href = dashboardUrl;
    return true;
  }
  
  return false;
}

// 导出函数供全局使用
window.AuthUtils = {
  checkAuthStatus,
  performLogout,
  addLogoutButton,
  requireAuth,
  redirectIfLoggedIn
};