/* eslint-disable no-undef */
const cfg = window.__APP_CONFIG__ || {};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

function parseQuery() {
  const p = new URLSearchParams(location.search);
  return { handle: p.get('handle'), id: p.get('id') };
}

function createClient() {
  if (!cfg.supabaseUrl || !cfg.supabaseKey) return null;
  return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
}

function setText(id, text) {
  const el = $(id);
  if (el && text) el.textContent = text;
}

function makeSocialButton(link) {
  const a = document.createElement('a');
  a.className = 'glass flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 transition';
  a.href = link.url || '#';
  a.target = link.url && link.url.startsWith('http') ? '_blank' : '_self';
  a.rel = 'noopener noreferrer';
  a.addEventListener('click', (e) => {
    if (link.qr && link.qr.url) {
      e.preventDefault();
      openQr(link.name, link.qr.url, link.qr.note);
    }
  });
  const i = document.createElement('i');
  i.className = `bx ${link.icon || 'bx-link'} text-lg`;
  const span = document.createElement('span');
  span.textContent = link.label || link.name || '链接';
  a.appendChild(i); a.appendChild(span);
  return a;
}

function renderProducts(products) {
  const container = $('#products');
  container.innerHTML = '';
  (products || []).forEach((p) => {
    const card = document.createElement('article');
    card.className = 'glass rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700';
    const img = document.createElement('img');
    img.className = 'w-full h-44 object-cover bg-slate-100 dark:bg-slate-800';
    img.src = p.image || 'https://placehold.co/800x400?text=Product';
    img.alt = p.name || 'product';
    const box = document.createElement('div');
    box.className = 'p-4';
    const h3 = document.createElement('h3');
    h3.className = 'font-semibold';
    h3.textContent = p.name || '产品名称';
    const desc = document.createElement('p');
    desc.className = 'text-sm text-slate-600 dark:text-slate-300 mt-1';
    desc.textContent = p.description || '';
    const row = document.createElement('div');
    row.className = 'mt-3 flex items-center gap-2';
    if (p.url) {
      const btn = document.createElement('a');
      btn.href = p.url; btn.target = '_blank'; btn.rel = 'noopener noreferrer';
      btn.className = 'px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-500';
      btn.textContent = '查看';
      row.appendChild(btn);
    }
    if (p.shareText) {
      const sbtn = document.createElement('button');
      sbtn.className = 'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:border-sky-400';
      sbtn.textContent = '分享';
      sbtn.addEventListener('click', () => share({
        title: p.name,
        text: p.shareText || p.description || '',
        url: p.url || location.href
      }));
      row.appendChild(sbtn);
    }
    box.appendChild(h3); box.appendChild(desc); box.appendChild(row);
    card.appendChild(img); card.appendChild(box);
    container.appendChild(card);
  });
}

function openQr(title, url, note) {
  $('#qrTitle').textContent = title || '扫码添加';
  $('#qrImage').src = url;
  $('#qrNote').textContent = note || '长按保存二维码';
  const dlg = $('#qrModal');
  if (typeof dlg.showModal === 'function') dlg.showModal();
}

async function share(payload) {
  const data = payload || cfg.share || {};
  try {
    if (navigator.share) {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
    } else {
      const url = encodeURIComponent(data.url || location.href);
      const text = encodeURIComponent(`${data.title || ''} ${data.text || ''}`.trim());
      // Fallback: open share chooser page
      const links = [
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        `https://t.me/share/url?url=${url}&text=${text}`,
        `https://www.facebook.com/sharer/sharer.php?u=${url}`
      ];
      window.open(links[0], '_blank');
    }
  } catch (e) {
    console.error('Share failed', e);
  }
}

function applyThemeColor(color) {
  // 使用CSS变量应用主题色
  document.documentElement.style.setProperty('--theme-color', color);
  
  // 直接更新关键元素的样式
  const elements = {
    // 主要按钮
    '#cta': `background-color: ${color} !important;`,
    // 纸牌 hover效果
    '.glass:hover': `border-color: ${color}40 !important;`,
    // 按钮
    'button.bg-sky-600': `background-color: ${color} !important;`,
    'a.bg-sky-600': `background-color: ${color} !important;`,
    // 标签
    '.bg-sky-50': `background-color: ${color}10 !important; color: ${color} !important; border-color: ${color}20 !important;`
  };
  
  // 创建或更新样式表
  let styleEl = document.getElementById('dynamic-theme');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = Object.entries(elements)
    .map(([selector, styles]) => `${selector} { ${styles} }`)
    .join('\n');
}

function hydrateFallbackStatic() {
  // For local demo without Supabase
  const demo = {
    name: '低代码分享',
    title: '低代码技术专家 | 开发者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lowcode',
    badges: ['低代码', '技术分享', '开发者'],
    bio: '专注低代码技术分享，帮助开发者快速构建应用，提升开发效率。',
    cta: { url: '#', label: '技术交流' },
    themeColor: '#0ea5e9',
    socials: [
      { name: 'WeChat', label: '个人微信', icon: 'bx-qr', qr: { url: 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/wx.jpg', note: '醒着做梦' } },
      { name: 'WeChatOfficial', label: '微信公众号', icon: 'bx-qr', qr: { url: 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/lowcode-share.JPG', note: '低代码分享' } },
      { name: 'Email', label: '邮箱', icon: 'bx-envelope', url: 'mailto:442969153@qq.com' }
    ],
    products: [
      { name: '联系我 H5应用', description: '帮助创业者一键介绍自己及产品的H5应用，支持一键分享到社交媒体', image: '', url: '#', shareText: '这个联系我应用很不错，推荐给大家！' },
      { name: 'Logic-IDE', description: 'Java可视化编排工具，让复杂业务逻辑变得简单直观', image: '', url: 'https://aims.feishu.cn/wiki/AEzIwqBxHiHUMvkz8OVc8qCZnHh', shareText: 'Logic-IDE：Java可视化编排工具，让开发更高效！' }
    ],
    footerName: '低代码分享'
  };
  applyData(demo);
}

function applyData(data) {
  $('#avatar').src = data.avatar || '';
  setText('#name', data.name);
  setText('#title', data.title);
  setText('#bio', data.bio);
  setText('#footerName', data.footerName || data.name || '');
  $('#year').textContent = new Date().getFullYear();
  
  // 应用主题色
  if (data.themeColor) {
    applyThemeColor(data.themeColor);
  }

  const badges = $('#badges');
  badges.innerHTML = '';
  (data.badges || []).forEach((b) => {
    const tag = document.createElement('span');
    tag.className = 'text-xs px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700';
    tag.textContent = b;
    badges.appendChild(tag);
  });

  const social = $('#socialLinks');
  social.innerHTML = '';
  (data.socials || []).forEach((s) => social.appendChild(makeSocialButton(s)));

  const cta = $('#cta');
  if (data.cta && data.cta.url) {
    cta.href = data.cta.url;
    cta.textContent = data.cta.label || '立即体验产品';
  }

  renderProducts(data.products);
}

async function loadData() {
  const { handle, id } = parseQuery();
  const client = createClient();
  
  console.log('Loading data for:', { handle, id });
  
  if (!client) {
    console.log('No Supabase client, using fallback data');
    hydrateFallbackStatic();
    return;
  }
  
  let query = client.from('profiles').select('*, products(*), socials(*)').limit(1);
  if (id) query = query.eq('id', id);
  else query = query.eq('handle', handle || cfg.defaultHandle);
  
  const { data, error } = await query.single();
  if (error) {
    console.warn('Load from Supabase failed, fallback to demo', error);
    hydrateFallbackStatic();
    return;
  }
  
  console.log('Loaded data from Supabase:', data);

  const mapped = {
    name: data.name,
    title: data.title,
    avatar: data.avatar_url,
    badges: (data.tags || '').split(',').filter(Boolean),
    bio: data.bio,
    cta: { url: data.cta_url, label: data.cta_label },
    themeColor: data.theme_color || '#0ea5e9',
    socials: (data.socials || []).map(s => ({
      name: s.platform,
      label: s.label || s.platform,
      icon: s.icon_class || 'bx-link',
      url: s.url,
      qr: s.qr_image_url ? { url: s.qr_image_url, note: s.qr_note } : null
    })),
    products: (data.products || []).map(p => ({
      name: p.name,
      description: p.description,
      image: p.image_url,
      url: p.url,
      shareText: p.share_text
    })),
    footerName: data.brand || data.name
  };
  applyData(mapped);
  
  // 保存profile ID供统计使用
  window.currentProfileId = data.id;
  
  // 记录访问统计
  recordPageView(data.id);
}

// 记录页面访问
async function recordPageView(profileId) {
  if (!profileId) {
    console.warn('没有profileId，无法记录访问');
    return;
  }
  
  console.log('尝试记录页面访问，profileId:', profileId);
  
  const client = createClient();
  if (!client) {
    console.warn('没有Supabase客户端，无法记录访问');
    return;
  }
  
  const viewData = {
    profile_id: profileId
  };
  
  console.log('访问数据:', viewData);
  
  try {
    const { error } = await client.from('page_views').insert(viewData);
    
    if (error) {
      console.error('记录访问失败:', error);
    } else {
      console.log('访问记录成功');
    }
  } catch (error) {
    console.error('记录访问出错:', error);
  }
}

$('#shareBtn').addEventListener('click', () => share());

document.addEventListener('DOMContentLoaded', loadData);


