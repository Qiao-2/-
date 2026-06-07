const ADMIN_PASSWORD = '663666';
const BOOKS_URL = 'books.json';
const LIBRARY_KEY = 'novel_library_data';
const ADMIN_KEY = 'novel_admin_unlocked';

let books = [];
let selectedIds = [];

const els = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  bookList: document.getElementById('bookList'),
  unlockAdminBtn: document.getElementById('unlockAdminBtn'),
  admin: document.getElementById('admin'),
  adminLocked: document.getElementById('adminLocked'),
  adminPanel: document.getElementById('adminPanel'),
  adminPasswordInput: document.getElementById('adminPasswordInput'),
  submitAdminPasswordBtn: document.getElementById('submitAdminPasswordBtn'),
  passwordDialog: document.getElementById('passwordDialog'),
  dialogPasswordInput: document.getElementById('dialogPasswordInput'),
  dialogSubmitBtn: document.getElementById('dialogSubmitBtn'),
  dialogCancelBtn: document.getElementById('dialogCancelBtn'),
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

function persistBooks() {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
}

function loadBooksFromSource() {
  return fetch(BOOKS_URL, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

function searchQuery() {
  return els.searchInput.value.trim().toLowerCase();
}

function renderBooks(list) {
  els.bookList.innerHTML = list.length
    ? list.map((book) => `
      <article class="result-item" data-id="${book.id}">
        <h3>${book.title}</h3>
        <p>作者 / ${book.author}</p>
        ${book.resourceUrl ? `<p><a href="${book.resourceUrl}" target="_blank" rel="noopener noreferrer">${book.resourceLabel || '蓝奏云链接填写'}</a></p>` : ''}
      </article>`).join('')
    : '<div class="result-item"><p>没有找到内容</p></div>';
}

function filterBooks() {
  const q = searchQuery();
  const filtered = books.filter((book) => [book.title, book.author, book.resourceUrl || '', book.resourceLabel || ''].join(' ').toLowerCase().includes(q));
  renderBooks(filtered);
}

function showAdminPanel() {
  els.admin.classList.remove('hidden');
  els.admin.scrollIntoView({ behavior: 'smooth', block: 'start' });
  els.adminLocked.classList.remove('hidden');
  els.adminPanel.classList.add('hidden');
}

function openPasswordDialog() {
  showAdminPanel();
  if (els.passwordDialog?.showModal) {
    els.dialogPasswordInput.value = '';
    els.passwordDialog.showModal();
    els.dialogPasswordInput.focus();
  } else {
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
  els.adminPanel.classList.add('hidden');
  els.adminLocked.classList.remove('hidden');
}

function renderAdminBooks() {
  els.adminBookList.innerHTML = books.length
    ? books.map((book) => `
      <article class="result-item ${selectedIds.includes(book.id) ? 'selected' : ''}" data-id="${book.id}">
        <h3>${book.title}</h3>
        <p>作者 / ${book.author}</p>
        ${book.resourceUrl ? `<p><a href="${book.resourceUrl}" target="_blank" rel="noopener noreferrer">${book.resourceLabel || '蓝奏云链接填写'}</a></p>` : ''}
        <div class="actions">
          <button type="button" data-action="select">选择</button>
          <button type="button" data-action="edit">编辑</button>
          <button type="button" data-action="delete">删除</button>
        </div>
      </article>`).join('')
    : '<div class="result-item"><p>暂无资源</p></div>';

  els.adminBookList.querySelectorAll('[data-action="select"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      selectedIds = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
      renderAdminBooks();
    });
  });

  els.adminBookList.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const title = prompt('书名', book.title);
      const author = prompt('作者', book.author);
      const resourceUrl = prompt('蓝奏云链接', book.resourceUrl || '');
      const resourceLabel = prompt('按钮文字', book.resourceLabel || '蓝奏云链接填写');
      if (title !== null) book.title = title;
      if (author !== null) book.author = author;
      if (resourceUrl !== null) book.resourceUrl = resourceUrl;
      if (resourceLabel !== null) book.resourceLabel = resourceLabel;
      persistBooks();
      filterBooks();
      renderAdminBooks();
    });
  });

  els.adminBookList.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.closest('[data-id]').dataset.id);
      books = books.filter((b) => b.id !== id);
      selectedIds = selectedIds.filter((x) => x !== id);
      persistBooks();
      filterBooks();
      renderAdminBooks();
    });
  });
}

function addBook() {
  const book = {
    id: Date.now(),
    title: els.newTitle.value.trim(),
    author: els.newAuthor.value.trim(),
    resourceUrl: els.newResourceUrl.value.trim(),
    resourceLabel: els.newResourceLabel.value.trim() || '蓝奏云链接填写',
  };
  if (!book.title || !book.author) return alert('书名和作者不能为空');
  books.unshift(book);
  persistBooks();
  filterBooks();
  renderAdminBooks();
}

function saveJson() {
  persistBooks();
  filterBooks();
  renderAdminBooks();
  alert('已保存');
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

function deleteSelectedBooks() {
  if (!selectedIds.length) return alert('请先选择要删除的作品');
  books = books.filter((book) => !selectedIds.includes(book.id));
  selectedIds = [];
  persistBooks();
  filterBooks();
  renderAdminBooks();
}

els.searchInput.addEventListener('input', filterBooks);
els.searchBtn.addEventListener('click', filterBooks);
els.unlockAdminBtn.addEventListener('click', openPasswordDialog);
els.dialogCancelBtn.addEventListener('click', () => els.passwordDialog?.close());
els.dialogSubmitBtn.addEventListener('click', () => {
  const ok = unlockAdmin(els.dialogPasswordInput.value);
  if (ok && els.passwordDialog?.open) els.passwordDialog.close();
});
els.adminPasswordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const ok = unlockAdmin(els.adminPasswordInput.value);
    if (ok) els.adminPasswordInput.value = '';
  }
});
els.lockAdminBtn.addEventListener('click', lockAdmin);
els.addBookBtn.addEventListener('click', addBook);
els.saveJsonBtn.addEventListener('click', saveJson);
els.downloadJsonBtn.addEventListener('click', downloadJson);
els.selectAllAdminBtn.addEventListener('click', () => { selectedIds = books.map((book) => book.id); renderAdminBooks(); });
els.clearSelectionBtn.addEventListener('click', () => { selectedIds = []; renderAdminBooks(); });
els.deleteSelectedBtn.addEventListener('click', deleteSelectedBooks);

(async () => {
  books = await loadBooksFromSource();
  if (!books.length) {
    const cached = localStorage.getItem(LIBRARY_KEY);
    books = cached ? JSON.parse(cached) : [];
  }
  if (!books.length) {
    books = [
      { id: 1, title: '示例资源', author: '示例作者', resourceUrl: 'https://example.com', resourceLabel: '蓝奏云链接填写' },
    ];
  }
  persistBooks();
  filterBooks();
  if (localStorage.getItem(ADMIN_KEY) === '1') {
    els.admin.classList.remove('hidden');
    els.adminLocked.classList.add('hidden');
    els.adminPanel.classList.remove('hidden');
    renderAdminBooks();
  }
})();
