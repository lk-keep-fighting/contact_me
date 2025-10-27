/* eslint-disable no-undef */
const cfg = window.__APP_CONFIG__ || {};

function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

const shareTemplates = [
  {
    id: 'aurora',
    name: '灵动云光',
    background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 55%, #f472b6 100%)',
    accent: '#38bdf8',
    kicker: 'Personal Brand',
    highlight: '一键生成产品亮点',
    slogan: '一张海报，让产品亮点立即被看到',
    subline: '扫码查看完整介绍，立即联系我',
    icon: 'bx-diamond',
    qrDark: '#0f172a',
    qrLight: '#ffffff',
    footerBg: 'rgba(255, 255, 255, 0.92)',
    footerColor: '#0f172a'
  },
  {
    id: 'sunrise',
    name: '晨曦新篇',
    background: 'linear-gradient(135deg, #f97316 0%, #facc15 52%, #fde68a 100%)',
    accent: '#f97316',
    kicker: 'Product Launch',
    highlight: '产品价值 × 成长故事',
    slogan: '扫码了解我的产品服务',
    subline: '随时沟通，获取定制化方案',
    icon: 'bx-bulb',
    qrDark: '#7c2d12',
    qrLight: '#ffffff',
    footerBg: 'rgba(255, 255, 255, 0.94)',
    footerColor: '#111827'
  },
  {
    id: 'midnight',
    name: '星夜闪耀',
    background: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #7c3aed 100%)',
    accent: '#7c3aed',
    kicker: 'Growth Story',
    highlight: '真实案例与用户口碑',
    slogan: '长按二维码，立即联系我',
    subline: '全天候响应，助你快人一步',
    icon: 'bx-meteor',
    qrDark: '#ede9fe',
    qrLight: '#111827',
    footerBg: 'rgba(17, 24, 39, 0.94)',
    footerColor: '#f9fafb',
    footerSublineColor: 'rgba(226, 232, 240, 0.7)'
  }
];
const RESERVED_HANDLE_SEGMENTS = new Set([
  'index',
  'index.html',
  '404',
  '404.html',
  'profile',
  'profile.html',
  'profiles',
  'page',
  'pages',
  'p',
  'user',
  'users',
  'u',
  'login',
  'login.html',
  'dashboard',
  'dashboard.html',
  'home',
  'home.html',
  'demo',
  'demo.html',
  'redirect',
  'redirect.html',
  'debug',
  'debug.html',
  'test',
  'test.html',
  'test-db',
  'test-db.html',
  'test-upload',
  'test-upload.html',
  'test-preview',
  'test-preview.html',
  'check-config',
  'check-config.html',
  'config',
  'config.html',
  'config.js',
  'assets',
  'js',
  'api',
  'saas',
  'supabase',
  'favicon.ico',
  'favicon.svg',
  'robots.txt'
]);
const HANDLE_PATH_PREFIXES = new Set(['p', 'page', 'pages', 'profile', 'profiles', 'u', 'user', 'users']);
const BLOCKED_PARENT_SEGMENTS = new Set(['assets', 'js', 'css', 'vendor', 'images', 'static', 'fonts']);
let currentShareTemplateId = shareTemplates[0]?.id || 'aurora';
let currentProfileData = null;
let shareStatusTimer = null;

function extractHandleFromPath(pathname = '') {
  if (!pathname) return null;
  const cleaned = decodeURIComponent(pathname).replace(/\/+$/, '');
  if (!cleaned || cleaned === '' || cleaned === '/') return null;
  const segments = cleaned.split('/').filter(Boolean);
  if (!segments.length) return null;

  const candidate = segments[segments.length - 1];
  const normalized = candidate.trim().toLowerCase();
  if (!normalized || candidate.includes('.') || RESERVED_HANDLE_SEGMENTS.has(normalized)) return null;

  let parentSegments = segments.slice(0, -1).map(segment => segment.trim());
  while (parentSegments.length && HANDLE_PATH_PREFIXES.has(parentSegments[parentSegments.length - 1].toLowerCase())) {
    parentSegments.pop();
  }
  if (parentSegments.some(segment => RESERVED_HANDLE_SEGMENTS.has(segment.toLowerCase()))) return null;
  if (parentSegments.some(segment => BLOCKED_PARENT_SEGMENTS.has(segment.toLowerCase()))) return null;

  return normalized;
}

function parseQuery() {
  const params = new URLSearchParams(location.search);
  let handle = params.get('handle');
  const id = params.get('id');

  if (handle) {
    handle = handle.trim().toLowerCase();
  }

  if (!handle) {
    const pathHandle = extractHandleFromPath(location.pathname || '');
    if (pathHandle) handle = pathHandle;
  }

  return { handle, id };
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
    img.src = p.image || '/assets/images/product-placeholder.png';
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

function getShareTemplate(id) {
  return shareTemplates.find(t => t.id === id) || shareTemplates[0];
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(14, 165, 233, ${alpha})`;
  const value = hex.replace('#', '');
  const short = value.length === 3;
  const r = parseInt(short ? value[0] + value[0] : value.slice(0, 2), 16);
  const g = parseInt(short ? value[1] + value[1] : value.slice(2, 4), 16);
  const b = parseInt(short ? value[2] + value[2] : value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getShareUrl() {
  if (typeof window === 'undefined') return '';
  const fallback = cfg.share || {};
  try {
    const baseUrl = new URL(location.href);
    const baseDir = baseUrl.pathname.replace(/\/[^/]*$/, '');
    const prefix = baseDir && baseDir !== '/' ? baseDir : '';
    const handle = currentProfileData?.handle?.toString().trim().toLowerCase();

    if (handle) {
      const friendlyPath = `${prefix}/${handle}`.replace(/\/{2,}/g, '/');
      const friendlyUrl = new URL(baseUrl.href);
      friendlyUrl.pathname = friendlyPath.startsWith('/') ? friendlyPath : `/${friendlyPath}`;
      friendlyUrl.search = '';
      friendlyUrl.hash = '';
      return friendlyUrl.toString();
    }

    if (window.currentProfileId) {
      const profilePath = `${prefix}/profile.html`.replace(/\/{2,}/g, '/');
      const profileUrl = new URL(baseUrl.href);
      profileUrl.pathname = profilePath.startsWith('/') ? profilePath : `/${profilePath}`;
      profileUrl.search = '';
      profileUrl.hash = '';
      profileUrl.searchParams.set('id', window.currentProfileId);
      return profileUrl.toString();
    }

    return location.href || fallback.url || '';
  } catch (error) {
    return fallback.url || location.href;
  }
}

function truncateText(text = '', maxLength = 120) {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function formatShareUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch (error) {
    return url;
  }
}

function buildSharePayload() {
  const fallback = cfg.share || {};
  const url = getShareUrl() || fallback.url || '';
  const title = currentProfileData?.name || fallback.title || cfg.appName || '联系我';
  const textSource = currentProfileData?.bio || fallback.text || cfg.appDescription || '';
  return {
    title,
    text: truncateText(textSource, 180),
    url
  };
}

function updateShareStatus(message, type = 'info') {
  const status = $('#shareStatus');
  if (!status) return;
  status.textContent = message;
  if (type) {
    status.dataset.type = type;
  } else {
    status.removeAttribute('data-type');
  }
  if (shareStatusTimer) clearTimeout(shareStatusTimer);
  shareStatusTimer = setTimeout(() => {
    status.removeAttribute('data-type');
    status.textContent = '';
  }, 4000);
}

async function renderSharePoster(templateId = currentShareTemplateId) {
  const container = $('#posterPreview');
  if (!container) return;
  if (!currentProfileData) {
    container.innerHTML = '<div class="text-sm text-slate-500">资料加载中，请稍后再试。</div>';
    updateShareStatus('资料加载中，请稍后再试。', 'info');
    return;
  }
  updateShareStatus('正在生成分享海报...', 'info');
  currentShareTemplateId = templateId;
  container.innerHTML = "<div class='flex items-center gap-2 text-slate-500 text-sm'><i class='bx bx-loader-alt bx-spin'></i><span>正在生成海报...</span></div>";
  const template = getShareTemplate(templateId);
  const shareUrl = getShareUrl();
  const poster = buildPosterElement(template, currentProfileData, shareUrl);
  container.innerHTML = '';
  container.appendChild(poster);
  const qrImg = poster.querySelector('[data-role="share-qr"]');
  if (qrImg) {
    try {
      await generatePosterQr(qrImg, shareUrl, template);
      updateShareStatus('海报已生成，点击下方按钮即可分享。', 'success');
    } catch (error) {
      console.error('二维码生成失败', error);
      handleQrGenerationError(qrImg, shareUrl, template);
    }
  }
}

function buildPosterElement(template, profile, shareUrl) {
  const poster = document.createElement('div');
  poster.className = `share-poster share-poster-${template.id}`;
  poster.style.background = template.background;

  const body = document.createElement('div');
  body.className = 'share-poster-body';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = '16px';

  const avatarWrap = document.createElement('div');
  avatarWrap.className = 'share-avatar';
  const avatarImg = document.createElement('img');
  avatarImg.src = profile.avatar || '/assets/images/default-avatar.svg';
  avatarImg.alt = profile.name || 'avatar';
  avatarImg.crossOrigin = 'anonymous';
  avatarImg.referrerPolicy = 'no-referrer';
  avatarWrap.appendChild(avatarImg);

  const titleBox = document.createElement('div');
  const kicker = document.createElement('span');
  kicker.className = 'share-kicker';
  kicker.textContent = template.kicker;
  const nameEl = document.createElement('h3');
  nameEl.className = 'share-name';
  nameEl.textContent = profile.name || cfg.appName || '联系我';
  const roleEl = document.createElement('p');
  roleEl.className = 'share-role';
  roleEl.textContent = profile.title || template.highlight;

  titleBox.appendChild(kicker);
  titleBox.appendChild(nameEl);
  titleBox.appendChild(roleEl);

  header.appendChild(avatarWrap);
  header.appendChild(titleBox);

  body.appendChild(header);

  if (profile.bio) {
    const bioEl = document.createElement('p');
    bioEl.className = 'share-bio';
    bioEl.textContent = truncateText(profile.bio, 150);
    body.appendChild(bioEl);
  }

  const badges = Array.isArray(profile.badges) ? profile.badges.filter(Boolean).slice(0, 3) : [];
  if (badges.length) {
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'share-badges';
    badges.forEach((badge) => {
      const span = document.createElement('span');
      span.className = 'share-badge';
      span.textContent = badge;
      badgeWrap.appendChild(span);
    });
    body.appendChild(badgeWrap);
  }

  const productItems = Array.isArray(profile.products)
    ? profile.products.filter(product => product && product.name).slice(0, 3)
    : [];
  if (productItems.length) {
    const productWrap = document.createElement('div');
    productWrap.className = 'share-products';

    const productsTitle = document.createElement('div');
    productsTitle.className = 'share-products-title';
    productsTitle.textContent = '主打产品';
    productWrap.appendChild(productsTitle);

    const list = document.createElement('div');
    list.className = 'share-product-list';

    productItems.forEach((product) => {
      const item = document.createElement('div');
      item.className = 'share-product-item';

      const dot = document.createElement('span');
      dot.className = 'share-product-dot';

      const box = document.createElement('div');
      box.className = 'share-product-copy';

      const name = document.createElement('span');
      name.className = 'share-product-name';
      name.textContent = product.name;
      box.appendChild(name);

      const descriptionSource = product.tagline || product.description || product.shareText;
      if (descriptionSource) {
        const text = descriptionSource.toString().trim();
        if (text) {
          const desc = document.createElement('span');
          desc.className = 'share-product-desc';
          desc.textContent = truncateText(text, 72);
          box.appendChild(desc);
        }
      }

      if (typeof product.url === 'string' && product.url.trim()) {
        const rawUrl = product.url.trim();
        const url = document.createElement('span');
        url.className = 'share-product-url';
        url.textContent = formatShareUrl(rawUrl);
        box.appendChild(url);
      }

      item.appendChild(dot);
      item.appendChild(box);
      list.appendChild(item);
    });

    productWrap.appendChild(list);
    body.appendChild(productWrap);
  }

  const highlight = document.createElement('div');
  highlight.className = 'share-highlight';
  highlight.style.background = hexToRgba(template.accent, 0.2);
  highlight.style.color = '#fff';
  const highlightIcon = document.createElement('i');
  highlightIcon.className = `bx ${template.icon}`;
  const highlightText = document.createElement('span');
  highlightText.textContent = template.highlight;
  highlight.appendChild(highlightIcon);
  highlight.appendChild(highlightText);
  body.appendChild(highlight);

  const footer = document.createElement('div');
  footer.className = 'share-poster-footer';
  if (template.footerBg) footer.style.background = template.footerBg;
  if (template.footerColor) footer.style.color = template.footerColor;

  const qrImg = document.createElement('img');
  qrImg.className = 'share-qr';
  qrImg.setAttribute('data-role', 'share-qr');
  qrImg.alt = '页面二维码';
  qrImg.crossOrigin = 'anonymous';

  const footerText = document.createElement('div');
  footerText.style.flex = '1 1 auto';

  const slogan = document.createElement('p');
  slogan.className = 'share-slogan';
  slogan.textContent = template.slogan;
  const subline = document.createElement('p');
  subline.className = 'share-subline';
  subline.textContent = template.subline.replace('{name}', profile.name || '我');
  if (template.footerSublineColor) subline.style.color = template.footerSublineColor;

  const urlEl = document.createElement('div');
  urlEl.className = 'share-url';
  urlEl.textContent = formatShareUrl(shareUrl);
  urlEl.style.background = hexToRgba(template.accent, 0.16);
  urlEl.style.color = template.accent;

  footerText.appendChild(slogan);
  footerText.appendChild(subline);
  footerText.appendChild(urlEl);

  footer.appendChild(qrImg);
  footer.appendChild(footerText);

  poster.appendChild(body);
  poster.appendChild(footer);

  return poster;
}

async function generatePosterQr(img, url, template) {
  if (!img) {
    throw new Error('QR target missing');
  }
  if (!url) {
    throw new Error('QR content missing');
  }
  if (!window.QRCode) {
    throw new Error('QRCode not available');
  }

  const colors = {
    dark: template.qrDark || '#0f172a',
    light: template.qrLight || '#ffffff'
  };

  if (typeof window.QRCode.toDataURL === 'function') {
    img.src = await window.QRCode.toDataURL(url, {
      type: 'image/png',
      margin: 1,
      width: 280,
      color: colors
    });
    return;
  }

  img.src = await generateQrDataUrlWithConstructor(url, colors);
}

async function generateQrDataUrlWithConstructor(content, colors) {
  if (typeof window.QRCode !== 'function') {
    throw new Error('QRCode renderer unavailable');
  }
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Document not ready');
  }

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '0';
  container.style.height = '0';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  let instance;
  try {
    instance = new window.QRCode(container, {
      text: content,
      width: 280,
      height: 280,
      colorDark: colors.dark,
      colorLight: colors.light,
      correctLevel: window.QRCode.CorrectLevel?.H
        ?? window.QRCode.CorrectLevel?.Q
        ?? window.QRCode.CorrectLevel?.M
        ?? window.QRCode.CorrectLevel?.L
        ?? 1
    });

    return await waitForQrOutput(container);
  } finally {
    if (instance && typeof instance.clear === 'function') {
      try {
        instance.clear();
      } catch {}
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

function waitForQrOutput(container) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 60;
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const succeed = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const inspect = () => {
      if (settled) return;

      const canvas = container.querySelector('canvas');
      if (canvas && typeof canvas.toDataURL === 'function') {
        try {
          succeed(canvas.toDataURL('image/png'));
        } catch (error) {
          fail(error);
        }
        return;
      }

      const image = container.querySelector('img');
      if (image) {
        const finalize = () => succeed(image.src);
        if (image.complete && image.naturalWidth > 0) {
          finalize();
        } else {
          image.addEventListener('load', finalize, { once: true });
          image.addEventListener('error', () => fail(new Error('QR image failed to load')), { once: true });
        }
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        fail(new Error('QR code generation timed out'));
        return;
      }
      requestAnimationFrame(inspect);
    };

    requestAnimationFrame(inspect);
  });
}

function handleQrGenerationError(qrImg, shareUrl, template) {
  const footer = qrImg?.parentElement;
  if (!footer) return;
  qrImg.remove();
  const fallback = document.createElement('div');
  fallback.className = 'text-xs font-semibold';
  fallback.style.maxWidth = '108px';
  fallback.style.marginRight = '12px';
  fallback.style.color = template.footerColor || '#0f172a';
  fallback.textContent = '二维码生成失败';
  footer.insertBefore(fallback, footer.firstChild);
  updateShareStatus('二维码生成失败，请复制链接分享。', 'error');
}

function openShareModal() {
  const modal = $('#shareModal');
  if (!modal) {
    share();
    return;
  }
  if (typeof modal.showModal === 'function') {
    if (!modal.open) modal.showModal();
  } else {
    modal.style.display = 'block';
  }
  const currentBtn = $(`#posterTemplates button[data-template="${currentShareTemplateId}"]`);
  if (currentBtn) {
    $all('#posterTemplates .share-template-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn === currentBtn);
    });
  }
  if (currentProfileData) {
    renderSharePoster(currentShareTemplateId);
  } else {
    updateShareStatus('资料加载中，请稍后再试。', 'error');
  }
}

async function downloadPoster() {
  const poster = $('#posterPreview .share-poster');
  if (!poster) {
    updateShareStatus('请先生成海报。', 'error');
    return;
  }
  if (!window.html2canvas) {
    updateShareStatus('海报导出组件加载失败，请稍后重试。', 'error');
    return;
  }
  const btn = $('#downloadPoster');
  if (btn) btn.disabled = true;
  try {
    const canvas = await window.html2canvas(poster, {
      useCORS: true,
      scale: window.devicePixelRatio > 1 ? 2 : 1.5,
      backgroundColor: null,
      logging: false,
      scrollX: 0,
      scrollY: 0
    });
    const link = document.createElement('a');
    const name = (currentProfileData?.handle || currentProfileData?.name || 'profile')
      .toString()
      .replace(/\s+/g, '-');
    link.download = `${name}-share.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    updateShareStatus('海报已保存，快去分享吧！', 'success');
  } catch (error) {
    console.error('导出海报失败', error);
    updateShareStatus('海报导出失败，请尝试更换浏览器或复制链接。', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function copyShareLink() {
  const shareUrl = getShareUrl();
  if (!shareUrl) {
    updateShareStatus('暂无可用分享链接，请稍后重试。', 'error');
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const input = document.createElement('textarea');
      input.value = shareUrl;
      input.setAttribute('readonly', '');
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(input);
      }
    }
    updateShareStatus('分享链接已复制，立即分享给你的用户吧！', 'success');
  } catch (error) {
    console.error('复制链接失败', error);
    updateShareStatus('复制失败，请手动复制下方链接。', 'error');
  }
}

function setupShareDialog() {
  const templateContainer = $('#posterTemplates');
  if (templateContainer) {
    templateContainer.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-template]');
      if (!button) return;
      $all('#posterTemplates .share-template-btn').forEach(btn => btn.classList.toggle('is-active', btn === button));
      renderSharePoster(button.dataset.template);
    });
  }
  const downloadBtn = $('#downloadPoster');
  if (downloadBtn) downloadBtn.addEventListener('click', (event) => {
    event.preventDefault();
    downloadPoster();
  });
  const copyBtn = $('#copyShareLink');
  if (copyBtn) copyBtn.addEventListener('click', (event) => {
    event.preventDefault();
    copyShareLink();
  });
  const nativeShareBtn = $('#nativeShare');
  if (nativeShareBtn) nativeShareBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    await share();
  });
  const closeBtn = $('#closeShareModal');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    const modal = $('#shareModal');
    if (modal?.open) modal.close();
  });
}

async function share(payload) {
  const data = payload || buildSharePayload();
  try {
    if (navigator.share && data.url) {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url
      });
      updateShareStatus('已调用系统分享组件，记得同步保存海报。', 'success');
    } else {
      if (!data.url) {
        updateShareStatus('暂无可用的分享链接，请稍后重试。', 'error');
        return;
      }
      const url = encodeURIComponent(data.url);
      const text = encodeURIComponent(`${data.title || ''} ${data.text || ''}`.trim());
      const links = [
        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        `https://t.me/share/url?url=${url}&text=${text}`,
        `https://www.facebook.com/sharer/sharer.php?u=${url}`
      ];
      window.open(links[0], '_blank');
      updateShareStatus('已打开分享页面，若未弹出请直接复制链接。', 'info');
    }
  } catch (e) {
    console.error('Share failed', e);
    updateShareStatus('唤起分享失败，请直接复制链接。', 'error');
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
    avatar: '/assets/images/default-avatar.svg',
    handle: 'lowcode',
    badges: ['低代码', '技术分享', '开发者'],
    bio: '专注低代码技术分享，帮助开发者快速构建应用，提升开发效率。',
    cta: { url: '#', label: '技术交流' },
    themeColor: '#0ea5e9',
    socials: [
      { name: 'WeChat', label: '个人微信', icon: 'bx-qr', qr: { url: '/assets/images/demo-wechat.jpg', note: '醒着做梦' } },
      { name: 'WeChatOfficial', label: '微信公众号', icon: 'bx-qr', qr: { url: '/assets/images/demo-wechat-official.jpg', note: '低代码分享' } },
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
  currentProfileData = {
    ...data,
    badges: Array.isArray(data.badges) ? [...data.badges] : []
  };

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

  const modal = $('#shareModal');
  if (modal?.open) {
    renderSharePoster(currentShareTemplateId);
  }
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
    handle: data.handle,
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

setupShareDialog();

const shareTrigger = $('#shareBtn');
if (shareTrigger) {
  shareTrigger.addEventListener('click', (event) => {
    event.preventDefault();
    openShareModal();
  });
}

document.addEventListener('DOMContentLoaded', loadData);


