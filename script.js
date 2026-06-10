const state = window.__AUTH__ || { loggedIn: false, username: '', role: '', status: '' };

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

async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

function renderAuthCard() {
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
        onclick: async () => {
          await api('/api/logout', 'POST');
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
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    try {
      await api('/api/login', 'POST', { username: fd.get('username'), password: fd.get('password') });
      location.reload();
    } catch (err) {
      loginForm.querySelector('.notice')?.remove();
      loginForm.append(showMessage(err.message, 'error'));
    }
  });

  const regForm = el('form', { className: 'panel' });
  regForm.append(
    el('h3', { text: '注册' }),
    el('input', { placeholder: '用户名', name: 'username', required: 'required' }),
    el('input', { placeholder: '密码', name: 'password', type: 'password', required: 'required' }),
    el('button', { text: '提交注册', className: 'primary', type: 'submit' })
  );
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(regForm);
    try {
      const result = await api('/api/register', 'POST', { username: fd.get('username'), password: fd.get('password') });
      regForm.querySelector('.notice')?.remove();
      regForm.append(showMessage(result.message, 'success'));
    } catch (err) {
      regForm.querySelector('.notice')?.remove();
      regForm.append(showMessage(err.message, 'error'));
    }
  });

  formWrap.append(loginForm, regForm);
  card.append(title, formWrap);
}

async function renderDashboard() {
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
      await renderAdmin();
    };
    card.append(btn);
  }
}

async function renderAdmin() {
  const card = document.getElementById('adminCard');
  card.innerHTML = '';
  card.append(el('h2', { text: '管理员审核后台' }));
  const list = el('div', { className: 'user-list', text: '加载中…' });
  card.append(list);
  const data = await api('/api/admin/users');
  list.innerHTML = '';
  if (!data.users.length) {
    list.append(el('p', { text: '暂无待审核用户。' }));
    return;
  }
  data.users.forEach((u) => {
    const row = el('div', { className: 'user-row' });
    row.append(
      el('div', {}, [el('strong', { text: u.username }), el('div', { text: `${u.status} · ${new Date(u.createdAt).toLocaleString()}` })]),
      el('div', { className: 'row-actions' }, [
        el('button', {
          text: '通过',
          className: 'primary',
          onclick: async () => {
            await api('/api/admin/review', 'POST', { userId: u.id, status: 'approved' });
            renderAdmin();
          },
        }),
        el('button', {
          text: '拒绝',
          className: 'ghost',
          onclick: async () => {
            await api('/api/admin/review', 'POST', { userId: u.id, status: 'rejected' });
            renderAdmin();
          },
        }),
      ])
    );
    list.append(row);
  });
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

injectStyles();
renderAuthCard();
if (state.loggedIn) renderDashboard();
