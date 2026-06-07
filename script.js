const ADMIN_PASSWORD = '663666';
const SUPABASE_URL = 'https://kbiwuphjvejhogxhzdug.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HYSdxuODVwR6GKlla7fcMg_o0h8-aJ6';
const TABLE_NAME = 'resources';
const ADMIN_KEY = 'novel_admin_unlocked';
const SEARCH_DEBOUNCE_MS = 220;

let selectedIds = [];
let supabaseClient = null;
let books = [];
let searchTimer = null;
let searchSeq = 0;
let lastQuery = '';

const els = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  searchStatus: document.getElementById('searchStatus'),
  bookList: document.getElementById('bookList'),
  unlockAdminBtn: document.getElementById('unlockAdminBtn'),
  admin: document.getElementById('admin'),
  adminLocked: document.getElementById('adminLocked'),
  adminPanel: document.getElementById('adminPanel'),
  adminPasswordInput: document.getElementById('dialogPasswordInput'),
  dialogSubmitBtn: document.getElementById('dialogSubmitBtn'),
  dialogCancelBtn: document.getElementById('dialogCancelBtn'),
  passwordDialog: document.getElementById('passwordDialog'),
  lockAdminBtn: document.getElementById('lockAdminBtn'),
  newTitle: document.getElementById('newTitle'),
  newAuthor: document.getElementById('newAuthor'),
  newResourceUrl: document.getElementById('newResourceUrl'),
  newResourceLabel: document.getElementById('newResourceLabel'),
  addBookBtn: document.getElementById('addBookBtn'),
  saveJsonBtn: document.getElementById('saveJsonBtn'),
  downloadJsonBtn: document.getElementById('downloadJsonBtn'),
  selectAllAdminBtn: document.getElementById('selectAllAdminBtn'),
  clearSelectionBtn: document.getElementById('clearSelectionBtn'),
  deleteSelectedBtn: document.getElementById('deleteSelectedBtn'),
  adminBookList: document.getElementById('adminBookList'),
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  if (!window.supabase) throw new Error('Supabase 客户端未加载');
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

function normalizeBook(item) {
  return {
    id: item.id,
    title: item.title || '',
    author: item.author || '',
    resourceUrl: item.resource_url || item.resourceUrl || '',
    resourceLabel: item.resource_label || item.resourceLabel || '蓝奏云链接填写',
  };
}

async function loadBooksFromSupabase(query = '') {
  const client = getSupabaseClient();
  let request = client.from(TABLE_NAME).select('*').order('created_at', { ascending: false });

  const q = query.trim();
  if (q) {
    const pattern = `%${q}%`;
    request = request.or([
      `title.ilike.${pattern}`,
      `author.ilike.${pattern}`,
      `resource_url.ilike.${pattern}`,
      `resource_label.ilike.${pattern}`,
    ].join(','));
  }

  const { data, error } = await request;
  if (error) throw error;
  books = (data || []).map(normalizeBook);
  return books;
}

function setSearchStatus(message) {
  if (els.searchStatus) els.searchStatus.textContent = message;
}

function currentQuery() {
  return els.searchInput.value.trim();
}

function renderBooks(list, query = '') {
  const q = query.trim();
  els.bookList.innerHTML = list.length
    ? list.map((book) => {
        const title = escapeHtml(book.title);
        const author = escapeHtml(book.author);
        const label = escapeHtml(book.resourceLabel || '蓝奏云链接填写');
        const href = escapeHtml(book.resourceUrl || '');
        return `<article class="result-item" data-id="${escapeHtml(book.id)}"><h3>${title}</h3><p>作者 / ${author}</p>${href ? `<p><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></p>` : ''}${q ? `<p class="hint">匹配词：${escapeHtml(q)}</p>` : ''}</article>`;
      }).join('')
    : '<article class="result-item"><p>没有找到内容</p></article>';
}

async function runLiveSearch() {
  const query = currentQuery();
  const seq = ++searchSeq;
  lastQuery = query;
  setSearchStatus(query ? '正在实时搜索…' : '显示全部资源');

  try {
    await loadBooksFromSupabase(query);
    if (seq !== searchSeq) return;
    renderBooks(books, query);
    setSearchStatus(query ? `已找到 ${books.length} 条结果` : `共 ${books.length} 条资源`);
  } catch (error) {
    if (seq !== searchSeq) return;
    console.error(error);
    setSearchStatus('搜索失败，已切换为空结果');
    books = [];
    renderBooks([]);
  }
}

function scheduleSearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(runLiveSearch, SEARCH_DEBOUNCE_MS);
}

function showAdminPanel() {
  els.admin.classList.remove('hidden');
  els.admin.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openPasswordDialog() {
  showAdminPanel();
  if (els.passwordDialog?.showModal) {
    els.adminPasswordInput.value = '';
    els.passwordDialog.showModal();
    els.adminPasswordInput.focus();
  }
}

function unlockAdmin(password) {
  if ((password || '').trim() !== ADMIN_PASSWORD) {
    alert('密码错误');
    return false;
  }
  localStorage.setItem(ADMIN_KEY, '1');
  els.adminLocked.classList.add('hidden');
  els.adminPanel.classList.remove('hidden');
  renderAdminBooks();
  return true;
}

function lockAdmin() {
  localStorage.removeItem(ADMIN_KEY);
  selectedIds = [];
  els.admin.classList.add('hidden');
  els.adminPanel.classList.add('hidden');
  els.adminLocked.classList.remove('hidden');
}

function renderAdminBooks() {
  els.adminBookList.innerHTML = books.length
    ? books.map((book) => {
        const selected = selectedIds.includes(book.id) ? 'selected' : '';
        const title = escapeHtml(book.title);
        const author = escapeHtml(book.author);
        const label = escapeHtml(book.resourceLabel || '蓝奏云链接填写');
        const href = escapeHtml(book.resourceUrl || '');
        return `<article class="result-item ${selected}" data-id="${escapeHtml(book.id)}"><h3>${title}</h3><p>作者 / ${author}</p>${href ? `<p><a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a></p>` : ''}<div class="actions"><button type="button" data-action="select">选择</button><button type="button" data-action="edit">编辑</button><button type="button" data-action="delete">删除</button></div></article>`;
      }).join('')
    : '<article class="result-item"><p>暂无资源</p></article>';

  els.adminBookList.querySelectorAll('[data-action="select"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      selectedIds = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
      renderAdminBooks();
    });
  });

  els.adminBookList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const title = prompt('书名', book.title);
      const author = prompt('作者', book.author);
      const resourceUrl = prompt('链接', book.resourceUrl || '');
      const resourceLabel = prompt('按钮文字', book.resourceLabel || '蓝奏云链接填写');
      const client = getSupabaseClient();
      const payload = {
        title: title ?? book.title,
        author: author ?? book.author,
        resource_url: resourceUrl ?? book.resourceUrl,
        resource_label: resourceLabel ?? book.resourceLabel,
      };
      const { error } = await client.from(TABLE_NAME).update(payload).eq('id', id);
      if (error) return alert(`更新失败：${error.message}`);
      await refreshBooks();
    });
  });

  els.adminBookList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      const client = getSupabaseClient();
      const { error } = await client.from(TABLE_NAME).delete().eq('id', id);
      if (error) return alert(`删除失败：${error.message}`);
      selectedIds = selectedIds.filter((x) => x !== id);
      await refreshBooks();
    });
  });
}

async function addBook() {
  const title = els.newTitle.value.trim();
  const author = els.newAuthor.value.trim();
  const resourceUrl = els.newResourceUrl.value.trim();
  const resourceLabel = els.newResourceLabel.value.trim() || '蓝奏云链接填写';
  if (!title || !author) return alert('书名和作者不能为空');
  const client = getSupabaseClient();
  const { error } = await client.from(TABLE_NAME).insert([{ title, author, resource_url: resourceUrl, resource_label: resourceLabel }]);
  if (error) return alert(`添加失败：${error.message}`);
  els.newTitle.value = '';
  els.newAuthor.value = '';
  els.newResourceUrl.value = '';
  els.newResourceLabel.value = '';
  await refreshBooks();
}

async function saveJson() {
  alert('数据已直接保存到 Supabase，无需再导出 JSON。');
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json;charset=UTF-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'books.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function deleteSelectedBooks() {
  if (!selectedIds.length) return alert('请先选择要删除的作品');
  const client = getSupabaseClient();
  const { error } = await client.from(TABLE_NAME).delete().in('id', selectedIds);
  if (error) return alert(`删除失败：${error.message}`);
  selectedIds = [];
  await refreshBooks();
}

async function refreshBooks() {
  await loadBooksFromSupabase(lastQuery);
  renderBooks(books, lastQuery);
  setSearchStatus(lastQuery ? `已找到 ${books.length} 条结果` : `共 ${books.length} 条资源`);
  if (localStorage.getItem(ADMIN_KEY) === '1') renderAdminBooks();
}

els.searchInput.addEventListener('input', scheduleSearch);
els.searchBtn.addEventListener('click', runLiveSearch);
els.searchInput.addEventListener('search', runLiveSearch);
els.unlockAdminBtn.addEventListener('click', openPasswordDialog);
els.dialogCancelBtn.addEventListener('click', () => els.passwordDialog?.close());
els.dialogSubmitBtn.addEventListener('click', () => {
  const ok = unlockAdmin(els.adminPasswordInput.value);
  if (ok && els.passwordDialog?.open) els.passwordDialog.close();
});
els.lockAdminBtn.addEventListener('click', lockAdmin);
els.addBookBtn.addEventListener('click', addBook);
els.saveJsonBtn.addEventListener('click', saveJson);
els.downloadJsonBtn.addEventListener('click', downloadJson);
els.selectAllAdminBtn.addEventListener('click', () => {
  selectedIds = books.map((book) => book.id);
  renderAdminBooks();
});
els.clearSelectionBtn.addEventListener('click', () => {
  selectedIds = [];
  renderAdminBooks();
});
els.deleteSelectedBtn.addEventListener('click', deleteSelectedBooks);

(async () => {
  try {
    await refreshBooks();
  } catch (error) {
    console.error(error);
    books = [];
    renderBooks([]);
    setSearchStatus('资源加载失败');
  }
  if (localStorage.getItem(ADMIN_KEY) === '1') {
    els.admin.classList.remove('hidden');
    els.adminLocked.classList.add('hidden');
    els.adminPanel.classList.remove('hidden');
    renderAdminBooks();
  }
})();
