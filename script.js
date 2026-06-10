const STORAGE_KEYS = {
  users: 'fk_site_users',
  session: 'fk_site_session',
};

function loadUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
    return session && typeof session === 'object' ? session : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function ensureSeedData() {
  const users = loadUsers();
  if (!users.some((u) => u.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      username: 'admin',
      password: '123456',
      role: 'admin',
      status: 'approved',
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
  }
}

function getState() {
  const session = loadSession();
  const users = loadUsers();
  const user = session ? users.find((u) => u.id === session.userId) : null;
  return {
    loggedIn: Boolean(user),
    username: user?.username || '',
    role: user?.role || '',
    status: user?.status || '',
  };
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function showMessage(text, type = 'info') {
  return el('div', { className: `msg ${type}`, text });
}

function renderAuthCard() {
  const state = getState();
  const card = document.getElementById('authCard');
  card.innerHTML = '';

  if (state.loggedIn) {
    card.append(
      el('h2', { text: `欢迎，${state.username}` }),
      el('p', { text: state.role === 'admin' ? '你已进入管理员模式。' : `账号状态：${state.status}` }),
      el('button', {
        text: '进入内部页面',
        className: 'primary',
        onclick: () => {
          document.getElementById('dashboardCard').classList.remove('hidden');
          document.getElementById('dashboardCard').scrollIntoView({ behavior: 'smooth' });
          renderDashboard();
        },
      }),
      el('button', {
        text: '退出登录',
        className: 'ghost',
        onclick: () => {
          clearSession();
          location.reload();
        },
      })
    );
    return;
  }

  const title = el('h2', { text: '登录 / 注册' });
  const formWrap = el('div', { className: 'auth-grid' });

  const loginForm = el('form', { className: 'panel' });
  loginForm.append(
    el('h3', { text: '登录' }),
    el('input', { placeholder: '用户名', name: 'username', required: 'required' }),
    el('input', { placeholder: '密码', name: 'password', type: 'password', required: 'required' }),
    el('button', { text: '登录', className: 'primary', type: 'submit' })
  );
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginForm.querySelectorAll('.msg').forEach((n) => n.remove());
    const fd = new FormData(loginForm);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '').trim();
    const users = loadUsers();
    const user = users.find((u) => u.username === username);
    if (!user) return loginForm.append(showMessage('账号不存在', 'error'));
    if (user.password !== password) return loginForm.append(showMessage('密码错误', 'error'));
    if (user.status !== 'approved' && user.role !== 'admin') return loginForm.append(showMessage('账号未通过审核，请等待管理员处理', 'error'));
    saveSession({ userId: user.id });
    location.reload();
  });

  const regForm = el('form', { className: 'panel' });
  regForm.append(
    el('h3', { text: '注册' }),
    el('input', { placeholder: '用户名', name: 'username', required: 'required' }),
    el('input', { placeholder: '密码', name: 'password', type: 'password', required: 'required' }),
    el('button', { text: '提交注册', className: 'primary', type: 'submit' })
  );
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    regForm.querySelectorAll('.msg').forEach((n) => n.remove());
    const fd = new FormData(regForm);
    const username = String(fd.get('username') || '').trim();
    const password = String(fd.get('password') || '').trim();
    if (!username || !password) return regForm.append(showMessage('用户名和密码不能为空', 'error'));
    const users = loadUsers();
    if (users.some((u) => u.username === username)) return regForm.append(showMessage('用户名已存在', 'error'));
    users.push({
      id: crypto.randomUUID(),
      username,
      password,
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    saveUsers(users);
    regForm.reset();
    regForm.append(showMessage('注册成功，请等待管理员审核', 'success'));
  });

  formWrap.append(loginForm, regForm);
  card.append(title, formWrap);
}

function renderDashboard() {
  const state = getState();
  const card = document.getElementById('dashboardCard');
  card.innerHTML = '';
  card.append(el('h2', { text: '内部页面' }));
  card.append(el('p', { text: '只有审核通过的账号才能看到这里。' }));
  card.append(el('p', { text: `当前账号：${state.username || '未登录'}` }));
  card.classList.remove('hidden');

  if (state.role === 'admin') {
    card.append(el('p', { text: '你是管理员，可以进入审核后台。' }));
    const btn = el('button', { text: '打开审核后台', className: 'primary' });
    btn.onclick = async () => {
      document.getElementById('adminCard').classList.remove('hidden');
      renderAdmin();
    };
    card.append(btn);
  }
}

function renderAdmin() {
  const state = getState();
  const card = document.getElementById('adminCard');
  card.innerHTML = '';
  card.append(el('h2', { text: '管理员审核后台' }));

  if (state.role !== 'admin') {
    card.append(el('p', { text: '你没有权限访问后台。' }));
    return;
  }

  const list = el('div', { className: 'user-list' });
  const users = loadUsers().filter((u) => u.role !== 'admin');

  if (!users.length) {
    list.append(el('p', { text: '暂无待审核用户。' }));
  } else {
    users.forEach((u) => {
      const row = el('div', { className: 'user-row' });
      row.append(
        el('div', {}, [el('strong', { text: u.username }), el('div', { text: `${u.status} · ${new Date(u.createdAt).toLocaleString()}` })]),
        el('div', { className: 'row-actions' }, [
          el('button', {
            text: '通过',
            className: 'primary',
            onclick: () => {
              const all = loadUsers();
              const target = all.find((x) => x.id === u.id);
              if (target) target.status = 'approved';
              saveUsers(all);
              renderAdmin();
            },
          }),
          el('button', {
            text: '拒绝',
            className: 'ghost',
            onclick: () => {
              const all = loadUsers();
              const target = all.find((x) => x.id === u.id);
              if (target) target.status = 'rejected';
              saveUsers(all);
              renderAdmin();
            },
          }),
        ])
      );
      list.append(row);
    });
  }

  card.append(list);
}

function injectStyles() {
  const css = `
    *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#f7e7ef,#e9f5ff);color:#24324a}
    .wrap{max-width:1100px;margin:0 auto;padding:24px} .hero,.card{background:rgba(255,255,255,.78);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.7);border-radius:20px;padding:20px;box-shadow:0 10px 30px rgba(57,78,106,.08);margin-bottom:16px}
    .hero{display:flex;justify-content:space-between;align-items:center;gap:16px} .badge{padding:10px 14px;border-radius:999px;background:#1f7ae0;color:#fff;font-weight:700}
    .auth-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px} .panel{display:grid;gap:10px;padding:14px;border:1px solid #e5ebf3;border-radius:16px;background:#fff}
    input,button{padding:12px 14px;border-radius:12px;border:1px solid #d6dde8;font:inherit} button{cursor:pointer} .primary{background:#1f7ae0;color:#fff;border-color:#1f7ae0} .ghost{background:#fff;color:#1f7ae0}
    .msg{padding:10px 12px;border-radius:12px}.msg.error{background:#ffe8e8;color:#b42318}.msg.success{background:#e9fbe9;color:#137333}.msg.info{background:#edf4ff;color:#1d4ed8}
    .user-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #eef2f7;align-items:center}.row-actions{display:flex;gap:10px}.hidden{display:none}
    @media (max-width: 760px){ .auth-grid,.hero{grid-template-columns:1fr;display:grid}.hero{justify-content:stretch} .user-row{flex-direction:column;align-items:flex-start} }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

ensureSeedData();
injectStyles();
renderAuthCard();
const state = getState();
if (state.loggedIn) renderDashboard();
