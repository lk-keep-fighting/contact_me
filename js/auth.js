/* eslint-disable no-undef */
const cfg = window.__APP_CONFIG__ || {};

function $(sel) { return document.querySelector(sel); }

let supabase = null;

// 初始化
async function init() {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    console.error('Supabase配置缺失');
    return;
  }
  
  supabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
  
  // 检查是否已登录
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    window.location.href = '/dashboard.html';
    return;
  }
  
  setupEventListeners();
}

// 设置事件监听器
function setupEventListeners() {
  // 登录表单
  $('#loginForm').addEventListener('submit', handleLogin);
  
  // 注册表单
  $('#signupForm').addEventListener('submit', handleSignup);
  
  // 切换表单
  $('#showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });
  
  $('#showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });
  
  // 演示登录
  $('#demoLogin').addEventListener('click', handleDemoLogin);
}

// 显示注册表单
function showRegisterForm() {
  $('#loginForm').parentElement.classList.add('hidden');
  $('#registerForm').classList.remove('hidden');
  hideMessages();
}

// 显示登录表单
function showLoginForm() {
  $('#registerForm').classList.add('hidden');
  $('#loginForm').parentElement.classList.remove('hidden');
  hideMessages();
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  
  const email = $('#email').value;
  const password = $('#password').value;
  
  if (!email || !password) {
    showError('请填写邮箱和密码');
    return;
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      showError(error.message);
      return;
    }
    
    showSuccess('登录成功，正在跳转...');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
    
  } catch (error) {
    showError('登录失败，请重试');
    console.error('Login error:', error);
  }
}

// 处理注册
async function handleSignup(e) {
  e.preventDefault();
  
  const name = $('#signupName').value;
  const email = $('#signupEmail').value;
  const password = $('#signupPassword').value;
  
  if (!name || !email || !password) {
    showError('请填写所有必填字段');
    return;
  }
  
  if (password.length < 6) {
    showError('密码至少需要6位字符');
    return;
  }
  
  try {
    // 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });
    
    if (error) {
      console.error('注册错误详情:', error);
      showError(`注册失败: ${error.message}`);
      return;
    }
    
    console.log('注册成功，用户数据:', data);
    
    if (data.user && !data.user.email_confirmed_at) {
      showSuccess('注册成功！请检查邮箱并点击确认链接完成注册。');
    } else {
      // 创建用户资料
      await createUserProfile(data.user, name, email);
      showSuccess('注册成功，正在跳转...');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    }
    
  } catch (error) {
    console.error('注册异常:', error);
    showError('注册失败，请重试');
  }
}

// 演示登录
async function handleDemoLogin() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@contactme.com',
      password: 'demo123456'
    });
    
    if (error) {
      // 如果演示账户不存在，创建一个
      await createDemoAccount();
      return;
    }
    
    showSuccess('演示登录成功，正在跳转...');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
    
  } catch (error) {
    showError('演示登录失败');
    console.error('Demo login error:', error);
  }
}

// 创建演示账户
async function createDemoAccount() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'demo@contactme.com',
      password: 'demo123456',
      options: {
        data: {
          name: '演示用户'
        }
      }
    });
    
    if (error) {
      console.error('演示账户创建错误:', error);
      showError(`创建演示账户失败: ${error.message}`);
      return;
    }
    
    // 创建用户资料
    await createUserProfile(data.user, '演示用户', 'demo@contactme.com');
    showSuccess('演示账户创建成功，正在跳转...');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);
    
  } catch (error) {
    console.error('创建演示账户异常:', error);
    showError('创建演示账户失败');
  }
}

// 创建用户资料
async function createUserProfile(user, name, email) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: email,
        name: name
      });
    
    if (error) {
      console.error('创建用户资料失败:', error);
      throw error;
    }
    
    console.log('用户资料创建成功');
  } catch (error) {
    console.error('创建用户资料异常:', error);
    throw error;
  }
}

// 显示错误消息
function showError(message) {
  hideMessages();
  $('#errorText').textContent = message;
  $('#errorMessage').classList.remove('hidden');
}

// 显示成功消息
function showSuccess(message) {
  hideMessages();
  $('#successText').textContent = message;
  $('#successMessage').classList.remove('hidden');
}

// 隐藏所有消息
function hideMessages() {
  $('#errorMessage').classList.add('hidden');
  $('#successMessage').classList.add('hidden');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
