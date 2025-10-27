const SUPABASE_CONFIG = Object.freeze({
  url: 'https://zmuaawzjscrexezgencu.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWFhd3pqc2NyZXhlemdlbmN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNjczODQsImV4cCI6MjA3NTg0MzM4NH0.mNb3-SLgGIalH1szlpETInmpnoPHlMlg1Cbowe-wB0o',
  bucket: 'images',
  defaultDirectory: 'shared-tabs'
});

const FALLBACK_FAVICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="%230ea5e9"/><path d="M6 10.5L9 13.5L14 6.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const tabListEl = document.querySelector('#tabList');
const tabCounterEl = document.querySelector('#tabCounter');
const selectAllEl = document.querySelector('#selectAll');
const refreshBtn = document.querySelector('#refreshBtn');
const uploadBtn = document.querySelector('#uploadBtn');
const statusEl = document.querySelector('#status');
const template = document.querySelector('#tab-item-template');
const siteTitleInput = document.querySelector('#siteTitleInput');
const slugInput = document.querySelector('#slugInput');
const directoryInput = document.querySelector('#directoryInput');

let currentTabs = [];

initPopup().catch((error) => {
  console.error('初始化插件失败:', error);
  setStatus('插件初始化失败，请刷新页面后重试。', 'error');
});

async function initPopup() {
  setDefaultFormValues();
  bindEvents();
  await refreshTabs();
}

function setDefaultFormValues() {
  const now = new Date();
  siteTitleInput.value = `我的浏览器收藏 - ${formatDate(now)}`;
  slugInput.value = 'shared-tabs';
  directoryInput.value = SUPABASE_CONFIG.defaultDirectory;
}

function bindEvents() {
  selectAllEl.addEventListener('change', onToggleSelectAll);
  refreshBtn.addEventListener('click', () => refreshTabs());
  uploadBtn.addEventListener('click', () => handleUpload());
}

async function refreshTabs() {
  try {
    setLoadingState(true, '正在加载当前窗口标签页...');
    const tabsAPI = getTabsAPI();
    const tabs = await tabsAPI.query({ currentWindow: true });
    currentTabs = (tabs || []).filter((tab) => isShareableTab(tab));
    renderTabs(currentTabs);
    setStatus(`${currentTabs.length ? '已加载标签页列表' : '没有可用的标签页。'}`, currentTabs.length ? 'info' : 'error');
  } catch (error) {
    console.error('加载标签页失败:', error);
    renderTabs([]);
    setStatus('无法读取浏览器标签页，请检查权限设置。', 'error');
  } finally {
    setLoadingState(false);
  }
}

function renderTabs(tabs) {
  tabListEl.innerHTML = '';
  if (!tabs.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '当前窗口没有可上传的标签页。';
    tabListEl.appendChild(empty);
    tabCounterEl.textContent = '0 个标签页';
    selectAllEl.checked = false;
    return;
  }

  if (!template || !template.content || !template.content.firstElementChild) {
    console.warn('标签模板未找到，无法渲染列表。');
    return;
  }

  const fragment = document.createDocumentFragment();
  tabs.forEach((tab) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const checkbox = node.querySelector('.tab-checkbox');
    const favicon = node.querySelector('.tab-favicon');
    const title = node.querySelector('.tab-title');
    const url = node.querySelector('.tab-url');

    checkbox.value = String(tab.id);
    checkbox.checked = true;
    checkbox.dataset.tabId = String(tab.id);

    favicon.src = tab.favIconUrl || FALLBACK_FAVICON;
    favicon.alt = tab.title || 'Tab';

    title.textContent = tab.title || '未命名标签页';
    url.textContent = truncate(tab.url, 80);

    checkbox.addEventListener('change', () => updateSelectAllState());
    fragment.appendChild(node);
  });

  tabListEl.appendChild(fragment);
  selectAllEl.checked = true;
  updateTabCounter();
}

function onToggleSelectAll() {
  const checkboxes = tabListEl.querySelectorAll('.tab-checkbox');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAllEl.checked;
  });
  selectAllEl.indeterminate = false;
  updateTabCounter();
}

function updateSelectAllState() {
  const checkboxes = Array.from(tabListEl.querySelectorAll('.tab-checkbox'));
  const allChecked = checkboxes.every((checkbox) => checkbox.checked);
  const anyChecked = checkboxes.some((checkbox) => checkbox.checked);
  if (!checkboxes.length) {
    selectAllEl.checked = false;
    tabCounterEl.textContent = '0 个标签页';
    return;
  }
  selectAllEl.checked = allChecked;
  selectAllEl.indeterminate = !allChecked && anyChecked;
  updateTabCounter();
}

function updateTabCounter() {
  const selectedCount = getSelectedTabIds().length;
  const total = currentTabs.length;
  tabCounterEl.textContent = `${selectedCount} / ${total} 个标签页`;
}

function getSelectedTabIds() {
  const checked = tabListEl.querySelectorAll('.tab-checkbox:checked');
  return Array.from(checked).map((el) => Number(el.dataset.tabId));
}

async function handleUpload() {
  try {
    setLoadingState(true, '正在生成共享站 HTML...');
    const selectedIds = getSelectedTabIds();
    if (!selectedIds.length) {
      setStatus('请选择至少一个标签页。', 'error');
      return;
    }

    const directory = sanitizeDirectory(directoryInput.value) || SUPABASE_CONFIG.defaultDirectory;
    const slug = sanitizeSlug(slugInput.value) || 'shared-tabs';
    const title = siteTitleInput.value.trim() || '我的浏览器收藏';

    const selectedTabs = currentTabs.filter((tab) => selectedIds.includes(tab.id));
    if (!selectedTabs.length) {
      setStatus('选择的标签页已失效，请刷新后重试。', 'error');
      return;
    }

    const now = new Date();
    const timestamp = formatDate(now, 'compact');
    const filePath = buildFilePath(directory, `${slug}-${timestamp}.html`);
    const html = buildSharedSiteHtml({
      title,
      tabs: selectedTabs,
      generatedAt: now.toISOString(),
      sourceSlug: slug,
      directory
    });

    setStatus('正在上传到 Supabase Storage...', 'info');
    const { publicUrl } = await uploadHtmlToSupabase(filePath, html);
    showSuccessStatus(publicUrl);
  } catch (error) {
    console.error('上传共享站失败:', error);
    setStatus(error?.message || '上传失败，请稍后再试。', 'error');
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(loading, message) {
  uploadBtn.disabled = loading;
  refreshBtn.disabled = loading;
  selectAllEl.disabled = loading;
  if (loading && message) {
    setStatus(message, 'info');
  }
}

function setStatus(message, type = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.dataset.status = type;
}

function showSuccessStatus(publicUrl) {
  if (!statusEl) return;
  const safeUrl = escapeHtml(publicUrl);
  statusEl.innerHTML = `✅ 上传成功！<a href="${safeUrl}" target="_blank" rel="noopener">打开共享站</a>`;
  statusEl.dataset.status = 'success';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = '复制链接';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      copyBtn.textContent = '已复制';
      setTimeout(() => { copyBtn.textContent = '复制链接'; }, 2000);
    } catch (error) {
      console.error('复制失败', error);
      setStatus('复制失败，请手动复制链接。', 'error');
    }
  });
  statusEl.appendChild(copyBtn);
}

function sanitizeDirectory(input) {
  if (!input) return '';
  return input
    .split('/')
    .map((segment) => sanitizeSlug(segment))
    .filter(Boolean)
    .join('/');
}

function sanitizeSlug(input) {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function buildFilePath(directory, filename) {
  const safeDirectory = directory ? directory.replace(/(^\/|\/$)/g, '') : '';
  const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, '-');
  return [safeDirectory, safeFilename].filter(Boolean).join('/');
}

function buildSharedSiteHtml({ title, tabs, generatedAt, sourceSlug, directory }) {
  const generatedTime = new Date(generatedAt).toLocaleString('zh-CN', { hour12: false });
  const tabItems = tabs.map((tab, index) => {
    const safeTitle = escapeHtml(tab.title || `标签页 ${index + 1}`);
    const safeUrl = escapeHtml(tab.url || '#');
    const favicon = tab.favIconUrl ? `<img src="${escapeHtml(tab.favIconUrl)}" alt="">` : '';
    return `
      <li class="item" data-index="${index + 1}">
        <div class="item-card">
          <div class="item-header">
            <span class="index">${index + 1}</span>
            ${favicon}
            <h3>${safeTitle}</h3>
          </div>
          <div class="item-body">
            <a class="item-link" href="${safeUrl}" target="_blank" rel="noopener">${safeUrl}</a>
          </div>
        </div>
      </li>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="通过浏览器插件生成的共享站，包含 ${tabs.length} 个精选标签页链接。">
  <style>
    :root {
      color-scheme: light dark;
      font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: #0f172a;
    }
    body {
      margin: 0;
      padding: 48px 16px 64px;
      background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.25), rgba(15, 23, 42, 0.92));
      color: #e2e8f0;
      min-height: 100vh;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: 36px 32px 40px;
      box-shadow: 0 30px 60px rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    header {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 32px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: #f8fafc;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 13px;
      color: #cbd5f5;
    }
    .meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(14, 165, 233, 0.12);
    }
    .meta strong {
      font-size: 13px;
      color: #bae6fd;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 18px;
    }
    .item {
      opacity: 0;
      transform: translateY(12px);
      animation: fadeIn 0.4s ease forwards;
    }
    .item:nth-child(n) { animation-delay: calc(0.05s * var(--i, 1)); }
    .item-card {
      border-radius: 20px;
      padding: 20px 22px;
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }
    .item-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .item-header img {
      width: 20px;
      height: 20px;
      border-radius: 6px;
    }
    .index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(14, 165, 233, 0.18);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
    }
    .item-header h3 {
      margin: 0;
      font-size: 17px;
      color: #f1f5f9;
      font-weight: 600;
    }
    .item-body {
      font-size: 13px;
      color: #cbd5f5;
    }
    .item-link {
      color: #38bdf8;
      text-decoration: none;
      word-break: break-all;
    }
    .item-link:hover {
      text-decoration: underline;
    }
    footer {
      margin-top: 36px;
      font-size: 12px;
      color: rgba(148, 163, 184, 0.8);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    footer a {
      color: #38bdf8;
    }
    @keyframes fadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @media (max-width: 600px) {
      body { padding: 24px 12px 36px; }
      .container { padding: 28px 20px; border-radius: 20px; }
      .title { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1 class="title">${escapeHtml(title)}</h1>
      <div class="meta">
        <span><strong>标签页数：</strong>${tabs.length} 个</span>
        <span><strong>生成时间：</strong>${escapeHtml(generatedTime)}</span>
        <span><strong>来源插件：</strong>浏览器共享站上传</span>
        <span><strong>目录：</strong>${escapeHtml(directory || SUPABASE_CONFIG.defaultDirectory)}</span>
      </div>
    </header>
    <ol class="list">
      ${tabItems}
    </ol>
    <footer>
      <span>此页面由共享站浏览器插件自动生成，slug：${escapeHtml(sourceSlug)}。</span>
      <span>可将此页面分享给同事或好友，方便快速访问这些链接。</span>
    </footer>
  </div>
</body>
</html>`;
}

async function uploadHtmlToSupabase(path, htmlContent) {
  const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.bucket}/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_CONFIG.key,
      Authorization: `Bearer ${SUPABASE_CONFIG.key}`,
      'Content-Type': 'text/html; charset=utf-8',
      'x-upsert': 'true'
    },
    body: new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Supabase 上传失败(${response.status})`);
  }

  let result;
  try {
    result = await response.json();
  } catch (error) {
    result = {};
  }
  const keyPath = typeof result.Key === 'string' ? result.Key.replace(`${SUPABASE_CONFIG.bucket}/`, '') : path;
  const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${keyPath}`;
  return { keyPath, publicUrl };
}

function getTabsAPI() {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    return chrome.tabs;
  }
  if (typeof browser !== 'undefined' && browser.tabs && browser.tabs.query) {
    return browser.tabs;
  }
  throw new Error('当前环境不支持 tabs API');
}

function isShareableTab(tab) {
  if (!tab || !tab.url) return false;
  const blockedPrefixes = ['chrome://', 'edge://', 'chrome-extension://', 'about:', 'chromewebdata:'];
  return !tab.discarded && blockedPrefixes.every((prefix) => !tab.url.startsWith(prefix));
}

function formatDate(date, mode = 'default') {
  if (!(date instanceof Date)) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  if (mode === 'compact') {
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
  }
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function truncate(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
