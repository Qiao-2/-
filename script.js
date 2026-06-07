const books = [
  {
    id: 1,
    title: '春夜归人',
    author: '林知夏',
    category: '现代',
    tags: ['爱情', '都市', '完结'],
    summary: '一部关于重逢、成长与选择的温柔故事。',
    color: 'linear-gradient(135deg, #fb7185, #a855f7)',
    chapters: [
      { title: '第一章 旧雨初晴', content: '雨停之后，街角的咖啡店重新亮起灯。她望着窗外，仿佛一切都还来得及。\n\n有些相遇，像一封迟到的信，最终还是落进了命运的手里。\n\n她轻轻合上书页，忽然听见门铃响了。' },
      { title: '第二章 风穿过站台', content: '列车缓缓进站，风吹起她的发梢。那些没说完的话，终于在这一刻有了答案。\n\n站台很长，长到足以容纳一次迟来的拥抱。' },
      { title: '第三章 余温', content: '他把手里的伞递给她，像把一个安静的承诺交给了夜色。\n\n原来，最好的结局不是轰轰烈烈，而是有人愿意陪你把日子过完。' },
      { title: '第四章 回声', content: '多年以后，她仍会想起那个雨天。只是这一次，心里不再只剩遗憾。' },
    ],
  },
  {
    id: 2,
    title: '长安灯火',
    author: '沈砚',
    category: '古风',
    tags: ['历史', '权谋', '公版风格'],
    summary: '以古城为背景的悬疑与人情故事。',
    color: 'linear-gradient(135deg, #f97316, #f43f5e)',
    chapters: [
      { title: '第一章 夜入长安', content: '城门落下时，夜色正浓。她提着一盏灯，走进了这座传闻里最难看清真相的城。\n\n灯火一路延展，像一条沉默的河。' },
      { title: '第二章 纸上春秋', content: '案卷一页页翻过，真相藏在墨迹未干的字里。每个人都说了实话，可没有一个人说完。\n\n她在字缝里看见了第二种命运。' },
      { title: '第三章 风起朱雀街', content: '朱雀街的风吹灭了灯，却吹不散人们心里的执念。\n\n所有的秘密都在等一个合适的时辰被看见。' },
      { title: '第四章 旧事如潮', content: '旧案重提，满城皆惊。可最惊人的，从来不是案子本身，而是人心。' },
    ],
  },
  {
    id: 3,
    title: '星海邮差',
    author: '顾北',
    category: '科幻',
    tags: ['冒险', '未来', '连载'],
    summary: '在星际航路上递送信件的人，见证了无数人的告别与希望。',
    color: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    chapters: [
      { title: '第一章 失重来信', content: '他收到一封没有地址的信，只写着一句话：如果你看见这行字，请替我把明天带来。\n\n信纸边缘微微卷起，像来自很远很远的地方。' },
      { title: '第二章 漂浮的港口', content: '港口悬浮在云层之上，等待每一次返航。远处的星光像被打碎的玻璃，安静而锋利。\n\n每一艘船都有要抵达的终点。' },
      { title: '第三章 轨道之外', content: '他终于明白，所谓邮差，不只是送信的人，更是替别人把未说出口的心意送达的人。' },
      { title: '第四章 远方回信', content: '星海很大，大到足够装下所有人的离别；星海也很小，小到一封信就能把两个世界连在一起。' },
    ],
  },
  {
    id: 4,
    title: '雨落图书馆',
    author: '南栀',
    category: '治愈',
    tags: ['成长', '校园', '短篇'],
    summary: '一部温暖安静的治愈向作品。',
    color: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    chapters: [
      { title: '第一章 旧书架', content: '在那间总是下雨的图书馆里，时间像慢慢翻页。她把心事夹在书里，也把愿望写在了封面背面。\n\n窗外的雨声像远方的鼓点。' },
      { title: '第二章 午后阳光', content: '阳光从窗格里落下，照亮了落灰的字母。她终于明白，温柔不是没有答案，而是愿意继续往前。' },
      { title: '第三章 最后一页', content: '她合上书，发现自己早已不是那个躲在角落里的人。\n\n故事结束的时候，真正的生活才刚刚开始。' },
      { title: '第四章 新书签', content: '她在新书上夹上书签，像给未来留下一点温柔的标记。' },
    ],
  },
];

const STORAGE_KEY = 'novel_site_favorites';
const THEME_KEY = 'novel_site_theme';
const PROGRESS_PREFIX = 'novel_progress_';
const RECENT_KEY = 'novel_recent_books';
const FONT_SIZE_KEY = 'novel_font_size';
const LINE_HEIGHT_KEY = 'novel_line_height';

const state = {
  currentBookId: books[0].id,
  currentChapterIndex: 0,
  currentPageIndex: 0,
  filteredBooks: books,
  favorites: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  recent: JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'),
};

const els = {
  bookList: document.getElementById('bookList'),
  searchInput: document.getElementById('searchInput'),
  categoryFilter: document.getElementById('categoryFilter'),
  readerTitle: document.getElementById('readerTitle'),
  readerMeta: document.getElementById('readerMeta'),
  readerPanel: document.getElementById('readerPanel'),
  readerCategory: document.getElementById('readerCategory'),
  chapterSelect: document.getElementById('chapterSelect'),
  tocList: document.getElementById('tocList'),
  downloadBtn: document.getElementById('downloadBtn'),
  favBtn: document.getElementById('favBtn'),
  favoriteList: document.getElementById('favoriteList'),
  favoriteCount: document.getElementById('favoriteCount'),
  bookCount: document.getElementById('bookCount'),
  chapterCount: document.getElementById('chapterCount'),
  featuredCard: document.getElementById('featuredCard'),
  featuredCover: document.getElementById('featuredCover'),
  themeToggle: document.getElementById('themeToggle'),
  carouselPrev: document.getElementById('carouselPrev'),
  carouselNext: document.getElementById('carouselNext'),
  pagePrev: document.getElementById('pagePrev'),
  pageNext: document.getElementById('pageNext'),
  pageIndicator: document.getElementById('pageIndicator'),
  recentList: document.getElementById('recentList'),
  fontSizeRange: document.getElementById('fontSizeRange'),
  lineHeightRange: document.getElementById('lineHeightRange'),
  progressBar: document.getElementById('progressBar'),
};

function getCurrentBook() { return books.find((book) => book.id === state.currentBookId) || books[0]; }
function getProgressKey(bookId) { return `${PROGRESS_PREFIX}${bookId}`; }
function loadProgress(bookId) { try { return JSON.parse(localStorage.getItem(getProgressKey(bookId)) || '{}'); } catch { return {}; } }
function saveProgress(bookId, data) { localStorage.setItem(getProgressKey(bookId), JSON.stringify(data)); }
function saveFavorites() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites)); }
function isFavorite(bookId) { return state.favorites.includes(bookId); }
function updateStats() { els.bookCount.textContent = books.length; els.chapterCount.textContent = books.reduce((sum, book) => sum + book.chapters.length, 0); els.favoriteCount.textContent = state.favorites.length; }
function renderCategoryFilter() { const categories = ['all', ...new Set(books.map((book) => book.category))]; els.categoryFilter.innerHTML = categories.map((category) => `<option value="${category}">${category === 'all' ? '全部分类' : category}</option>`).join(''); }
function pushRecent(bookId) { state.recent = [bookId, ...state.recent.filter((id) => id !== bookId)].slice(0, 4); localStorage.setItem(RECENT_KEY, JSON.stringify(state.recent)); }
function renderRecent() { const list = state.recent.map((id) => books.find((book) => book.id === id)).filter(Boolean); els.recentList.innerHTML = list.length ? list.map((book) => `<div class="recent-item" data-id="${book.id}"><strong>${book.title}</strong><p>${book.author}</p></div>`).join('') : '<div class="recent-item"><p>还没有最近阅读记录。</p></div>'; els.recentList.querySelectorAll('.recent-item[data-id]').forEach((item) => { item.addEventListener('click', () => { state.currentBookId = Number(item.dataset.id); const progress = loadProgress(state.currentBookId); state.currentChapterIndex = progress.chapterIndex ?? 0; state.currentPageIndex = progress.pageIndex ?? 0; renderAll(); }); }); }
function renderBooks(list) { els.bookList.innerHTML = list.map((book) => { const active = book.id === state.currentBookId ? 'active' : ''; return `
        <article class="library-item ${active}" data-id="${book.id}">
          <div class="card-head">
            <div>
              <span class="chip">${book.category}</span>
              <h4>${book.title}</h4>
              <p>${book.author}</p>
            </div>
            <div class="book-cover" style="background:${book.color}"></div>
          </div>
          <p>${book.summary}</p>
          <div class="meta-row">${book.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
        </article>`; }).join(''); els.bookList.querySelectorAll('.library-item').forEach((item) => { item.addEventListener('click', () => { state.currentBookId = Number(item.dataset.id); const progress = loadProgress(state.currentBookId); state.currentChapterIndex = progress.chapterIndex ?? 0; state.currentPageIndex = progress.pageIndex ?? 0; pushRecent(state.currentBookId); renderAll(); }); }); }
function renderFeatured() { const book = getCurrentBook(); els.featuredCard.querySelector('h3').textContent = book.title; els.featuredCard.querySelector('p').textContent = book.summary; els.featuredCover.style.background = book.color; }
function paginateText(text, maxLength = 160) { const paragraphs = text.split('\n\n'); const pages = []; let buffer = ''; paragraphs.forEach((para) => { if ((buffer + '\n\n' + para).trim().length > maxLength && buffer) { pages.push(buffer.trim()); buffer = para; } else { buffer = buffer ? `${buffer}\n\n${para}` : para; } }); if (buffer.trim()) pages.push(buffer.trim()); return pages.length ? pages : [text]; }
function persistCurrentProgress() { const book = getCurrentBook(); saveProgress(book.id, { chapterIndex: state.currentChapterIndex, pageIndex: state.currentPageIndex }); pushRecent(book.id); }
function renderReader() { const book = getCurrentBook(); const chapter = book.chapters[state.currentChapterIndex] || book.chapters[0]; const pages = paginateText(chapter.content, 165); if (state.currentPageIndex >= pages.length) state.currentPageIndex = 0; els.readerTitle.textContent = `${book.title} · 在线阅读`; els.readerMeta.textContent = `${book.author} · ${book.category} · 共 ${book.chapters.length} 章`; els.readerCategory.textContent = book.category; els.chapterSelect.innerHTML = book.chapters.map((item, index) => `<option value="${index}">${item.title}</option>`).join(''); els.chapterSelect.value = String(state.currentChapterIndex); els.tocList.innerHTML = book.chapters.map((item, index) => `<div class="toc-item ${index === state.currentChapterIndex ? 'active' : ''}" data-index="${index}"><strong>${item.title}</strong></div>`).join(''); els.tocList.querySelectorAll('.toc-item').forEach((node) => { node.addEventListener('click', () => { state.currentChapterIndex = Number(node.dataset.index); state.currentPageIndex = 0; persistCurrentProgress(); renderReader(); }); }); els.readerPanel.innerHTML = `
    <h4>${chapter.title}</h4>
    ${pages[state.currentPageIndex].split('\n\n').map((paragraph) => `<p>${paragraph}</p>`).join('')}
    <div class="page-footer">
      <button class="btn secondary small" id="pagePrev" type="button">上一页</button>
      <span id="pageIndicator">${state.currentPageIndex + 1} / ${pages.length}</span>
      <button class="btn secondary small" id="pageNext" type="button">下一页</button>
    </div>`; document.getElementById('pagePrev').onclick = () => { state.currentPageIndex = Math.max(0, state.currentPageIndex - 1); persistCurrentProgress(); renderReader(); }; document.getElementById('pageNext').onclick = () => { state.currentPageIndex = Math.min(pages.length - 1, state.currentPageIndex + 1); persistCurrentProgress(); renderReader(); }; els.favBtn.textContent = isFavorite(book.id) ? '已收藏' : '收藏'; els.pageIndicator.textContent = `${state.currentPageIndex + 1} / ${pages.length}`; els.progressBar.style.width = `${Math.round(((state.currentChapterIndex + 1) / book.chapters.length) * 100)}%`; }
function renderFavorites() { const list = books.filter((book) => isFavorite(book.id)); els.favoriteList.innerHTML = list.length ? list.map((book) => `<div class="favorite-item" data-id="${book.id}"><strong>${book.title}</strong><p>${book.author}</p><div class="favorite-tags">${book.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div></div>`).join('') : '<div class="favorite-item"><p>还没有收藏任何作品。</p></div>'; els.favoriteList.querySelectorAll('.favorite-item[data-id]').forEach((item) => { item.addEventListener('click', () => { state.currentBookId = Number(item.dataset.id); const progress = loadProgress(state.currentBookId); state.currentChapterIndex = progress.chapterIndex ?? 0; state.currentPageIndex = progress.pageIndex ?? 0; renderAll(); }); }); }
function filterBooks() { const keyword = els.searchInput.value.trim().toLowerCase(); const category = els.categoryFilter.value; state.filteredBooks = books.filter((book) => { const haystack = [book.title, book.author, book.category, ...book.tags, book.summary].join(' ').toLowerCase(); return haystack.includes(keyword) && (category === 'all' || book.category === category); }); if (!state.filteredBooks.some((book) => book.id === state.currentBookId)) { state.currentBookId = state.filteredBooks[0]?.id || books[0].id; state.currentChapterIndex = 0; state.currentPageIndex = 0; } renderBooks(state.filteredBooks); renderReader(); renderFavorites(); renderFeatured(); }
function downloadCurrentBook() { const book = getCurrentBook(); const txt = [book.title, `作者：${book.author}`, `分类：${book.category}`, '', ...book.chapters.flatMap((chapter) => [chapter.title, chapter.content, ''])].join('\n'); const blob = new Blob([txt], { type: 'text/plain;charset=UTF-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${book.title}.txt`; a.click(); URL.revokeObjectURL(url); }
function toggleFavorite() { const book = getCurrentBook(); if (isFavorite(book.id)) { state.favorites = state.favorites.filter((id) => id !== book.id); } else { state.favorites.unshift(book.id); } saveFavorites(); renderAll(); }
function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme); els.themeToggle.querySelector('span').textContent = theme === 'light' ? '☀️' : '🌙'; }
function initTheme() { const saved = localStorage.getItem(THEME_KEY) || 'dark'; applyTheme(saved); }
function applyReaderPrefs() { const fontSize = Number(localStorage.getItem(FONT_SIZE_KEY) || 16); const lineHeight = Number(localStorage.getItem(LINE_HEIGHT_KEY) || 1.95); document.documentElement.style.setProperty('--reader-font-size', `${fontSize}px`); document.documentElement.style.setProperty('--reader-line-height', String(lineHeight)); els.fontSizeRange.value = String(fontSize); els.lineHeightRange.value = String(lineHeight); }
function renderAll() { updateStats(); renderCategoryFilter(); renderBooks(state.filteredBooks); renderReader(); renderFavorites(); renderFeatured(); renderRecent(); }
function switchFeatured(step) { const currentIndex = books.findIndex((book) => book.id === state.currentBookId); const nextIndex = (currentIndex + step + books.length) % books.length; state.currentBookId = books[nextIndex].id; const progress = loadProgress(state.currentBookId); state.currentChapterIndex = progress.chapterIndex ?? 0; state.currentPageIndex = progress.pageIndex ?? 0; pushRecent(state.currentBookId); renderAll(); }
els.searchInput.addEventListener('input', filterBooks); els.categoryFilter.addEventListener('change', filterBooks); els.downloadBtn.addEventListener('click', downloadCurrentBook); els.favBtn.addEventListener('click', toggleFavorite); els.themeToggle.addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; applyTheme(next); }); els.carouselPrev.addEventListener('click', () => switchFeatured(-1)); els.carouselNext.addEventListener('click', () => switchFeatured(1)); els.fontSizeRange.addEventListener('input', (e) => { const size = Number(e.target.value); document.documentElement.style.setProperty('--reader-font-size', `${size}px`); localStorage.setItem(FONT_SIZE_KEY, String(size)); }); els.lineHeightRange.addEventListener('input', (e) => { const lineHeight = Number(e.target.value); document.documentElement.style.setProperty('--reader-line-height', String(lineHeight)); localStorage.setItem(LINE_HEIGHT_KEY, String(lineHeight)); }); initTheme(); applyReaderPrefs(); renderAll();
