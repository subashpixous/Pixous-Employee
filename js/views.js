// js/views.js
// =========================================================================
// View renderers. Each renderXxx() returns an HTML string the router
// drops into #app. wireXxx() runs after mount to attach event handlers.
// =========================================================================

const Views = (() => {

  // ---------- shared helpers ----------
  const esc = (s) => {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const initials = (name) => {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    // accept yyyy-mm-dd or any other string
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return iso;
  };

  const photoBg = (emp) => emp.photo
    ? `background-image: url('${emp.photo.replace(/'/g, "\\'")}');`
    : `background-image: url('assets/default-avatar.svg');`;

  // ---------- LOGIN ----------
  const renderLogin = () => `
    <div class="login-screen">
      <div class="login-screen__panel login-screen__panel--brand">
        <div class="login-screen__brand-content">
          <div class="login-screen__brand-mark">
            <span class="login-screen__brand-dot"></span>
            <span>Pixous EMS · Live</span>
          </div>
          <h1>Employee records, <em>refined.</em></h1>
          <p>A focused workspace for managing personnel, ESI &amp; PF details, and statutory paperwork — built for HR teams who want clarity over clutter.</p>
        </div>
        <div class="login-screen__brand-meta">
          <span>Perundurai · Tamil Nadu</span>
          <span>v 1.0</span>
        </div>
      </div>

      <div class="login-screen__panel">
        <form class="login-form" id="login-form" autocomplete="off">
          <div class="login-form__eyebrow">Sign in</div>
          <h2>Welcome back</h2>
          <p class="login-form__sub">Choose your role and enter your credentials to continue.</p>

          <div class="role-tabs" role="tablist">
            <button type="button" class="role-tab is-active" data-role="admin">Administrator</button>
            <button type="button" class="role-tab" data-role="user">Staff</button>
          </div>

          <div class="field">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" name="username" required autocomplete="username">
          </div>
          <div class="field">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required autocomplete="current-password">
          </div>

          <button type="submit" class="btn btn--full btn--accent">Sign in</button>

          <div id="login-error-slot"></div>

          <div class="login-hint">
            <strong>Demo credentials</strong><br>
            Admin · <code>admin</code> / <code>admin123</code><br>
            Staff · <code>user</code> / <code>user123</code><br>
            <span style="color: var(--ink-3);">Change these in <code>js/auth.js</code> before deploying.</span>
          </div>
        </form>
      </div>
    </div>
  `;

  const wireLogin = () => {
    const form = document.getElementById('login-form');
    let role = 'admin';

    form.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        form.querySelectorAll('.role-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        role = tab.dataset.role;
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = form.username.value;
      const password = form.password.value;
      const result = Auth.login(username, password, role);
      const slot = document.getElementById('login-error-slot');
      if (!result.ok) {
        slot.innerHTML = `<div class="login-error">${esc(result.error)}</div>`;
        return;
      }
      slot.innerHTML = '';
      Toast.show(`Signed in as ${result.session.displayName}`, 'success');
      // route to dashboard
      window.location.hash = '#/dashboard';
    });
  };

  // ---------- SHELL (topbar) ----------
  const renderShell = (innerHtml, opts = {}) => {
    const session = Auth.current();
    const activePage = opts.active || '';

    const adminLink = Auth.isAdmin()
      ? `<a href="#/admin" class="nav-link ${activePage === 'admin' ? 'is-active' : ''}">Admin</a>`
      : '';

    return `
      <div class="shell">
        <header class="topbar">
          <div class="topbar__inner">
            <a href="#/dashboard" class="brand">
              <span class="brand__mark">P</span>
              <span>Pixous EMS</span>
              <span class="brand__sub">Perundurai</span>
            </a>

            <div class="search">
              <svg class="search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input id="global-search" type="search"
                     placeholder="Search by name, Aadhaar, PAN, mobile, bank…"
                     autocomplete="off">
              <span class="search__shortcut">Ctrl + K</span>
            </div>

            <nav class="nav-links">
              <a href="#/dashboard" class="nav-link ${activePage === 'dashboard' ? 'is-active' : ''}">Employees</a>
              ${adminLink}
            </nav>

            <div class="user-chip">
              <span>${esc(session ? session.displayName : '')}</span>
              <span class="user-chip__role ${session && session.role === 'admin' ? 'user-chip__role--admin' : ''}">
                ${esc(session ? session.role : '')}
              </span>
              <button id="logout-btn" class="btn btn--ghost btn--sm">Sign out</button>
            </div>
          </div>
        </header>
        <main class="main">${innerHtml}</main>
      </div>
      <div id="modal-root"></div>
      <div id="toast-root" class="toast-wrap"></div>
    `;
  };

  const wireShell = () => {
    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.logout();
      Toast.show('Signed out.');
      window.location.hash = '#/login';
    });

    const search = document.getElementById('global-search');
    if (search) {
      // Restore current query if present
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      search.value = params.get('q') || '';

      let debounce;
      search.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          const q = search.value.trim();
          const newHash = q ? `#/dashboard?q=${encodeURIComponent(q)}` : '#/dashboard';
          // Preserve scroll for live filtering on dashboard
          if (window.location.hash.startsWith('#/dashboard')) {
            history.replaceState(null, '', newHash);
            // Trigger re-render of just the list
            window.dispatchEvent(new CustomEvent('search:update', { detail: q }));
          } else {
            window.location.hash = newHash;
          }
        }, 120);
      });

      // Ctrl/Cmd + K to focus
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          search.focus();
          search.select();
        }
      });
    }
  };

  // ---------- DASHBOARD (employee list) ----------
  const renderDashboard = (query = '', filters = {}) => {
    const all = Store.all();
    const q = (query || '').toLowerCase().trim();

    let list = all;

    // apply text search across many fields
    if (q) {
      list = list.filter(e => {
        const hay = [
          e.name, e.fatherHusbandName, e.gender, e.maritalStatus, e.address,
          e.qualification, e.experience, e.dob, e.doj, e.pan, e.aadhar, e.uan,
          e.mobile, e.email, e.esiRegNo, e.nomineeName, e.nomineeRelation,
          e.bankName, e.accountNo, e.ifsc, e.familyMember, e.familyRelation,
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    // gender filter
    if (filters.gender && filters.gender !== 'all') {
      list = list.filter(e => (e.gender || '').toLowerCase() === filters.gender);
    }

    // sort
    const sort = filters.sort || 'name';
    list = [...list].sort((a, b) => {
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sort === 'recent') return (b.id || 0) - (a.id || 0);
      return 0;
    });

    // stats from full set
    const total = all.length;
    const males = all.filter(e => (e.gender || '').toLowerCase() === 'male').length;
    const females = all.filter(e => (e.gender || '').toLowerCase() === 'female').length;
    const married = all.filter(e => (e.maritalStatus || '').toLowerCase() === 'married').length;

    const adminAddBtn = Auth.isAdmin()
      ? `<a href="#/admin/new" class="btn btn--accent">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
             <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
           </svg>
           Add employee
         </a>`
      : '';

    const exportBtn = `<button id="export-csv" class="btn btn--ghost">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
           <polyline points="7 10 12 15 17 10"/>
           <line x1="12" y1="15" x2="12" y2="3"/>
         </svg>
         Export CSV
       </button>`;

    const inner = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">Employees <em>directory</em></h1>
          <p class="page-head__sub">${total} records on file</p>
        </div>
        <div class="page-head__actions">
          ${exportBtn}
          ${adminAddBtn}
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat__label">Total staff</div>
          <div class="stat__value">${total}</div>
        </div>
        <div class="stat">
          <div class="stat__label">Male</div>
          <div class="stat__value">${males}<span class="stat__value-sub">/ ${total}</span></div>
        </div>
        <div class="stat">
          <div class="stat__label">Female</div>
          <div class="stat__value">${females}<span class="stat__value-sub">/ ${total}</span></div>
        </div>
        <div class="stat">
          <div class="stat__label">Married</div>
          <div class="stat__value">${married}<span class="stat__value-sub">/ ${total}</span></div>
        </div>
      </div>

      <div class="filter-bar">
        <span class="filter-bar__count"><strong id="filter-count">${list.length}</strong> shown${q ? ` for "${esc(q)}"` : ''}</span>
        <button class="filter-pill ${(filters.gender || 'all') === 'all' ? 'is-active' : ''}" data-filter-gender="all">All</button>
        <button class="filter-pill ${filters.gender === 'male' ? 'is-active' : ''}" data-filter-gender="male">Male</button>
        <button class="filter-pill ${filters.gender === 'female' ? 'is-active' : ''}" data-filter-gender="female">Female</button>
        <select class="filter-select" id="sort-select">
          <option value="name" ${sort === 'name' ? 'selected' : ''}>Sort: Name (A→Z)</option>
          <option value="recent" ${sort === 'recent' ? 'selected' : ''}>Sort: Recently added</option>
        </select>
      </div>

      <div id="emp-list-wrap">
        ${renderEmployeeList(list)}
      </div>
    `;

    return renderShell(inner, { active: 'dashboard' });
  };

  const renderEmployeeList = (list) => {
    if (list.length === 0) {
      return `
        <div class="emp-list">
          <div class="empty-state">
            <h3 class="empty-state__title">No employees match your search.</h3>
            <p class="empty-state__sub">Try a different name, Aadhaar, PAN, or mobile number.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="emp-list">
        <div class="emp-list__head">
          <span></span>
          <span>Name</span>
          <span>Mobile</span>
          <span>PAN</span>
          <span></span>
        </div>
        ${list.map(e => `
          <a class="emp-row" href="#/profile/${e.id}">
            <div class="emp-row__avatar"
                 style="${e.photo ? photoBg(e) : ''}"
                 aria-hidden="true">
              ${e.photo ? '' : esc(initials(e.name))}
            </div>
            <div>
              <div class="emp-row__name">${esc(e.name || 'Unnamed')}</div>
              <div class="emp-row__name-sub">${esc(e.qualification || '—')} · ${esc(e.gender || '')}</div>
            </div>
            <div class="emp-row__cell emp-row__cell--mono">${esc(e.mobile || '—')}</div>
            <div class="emp-row__cell emp-row__cell--mono">${esc(e.pan || '—')}</div>
            <div class="emp-row__chev">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  };

  const wireDashboard = (query, filters) => {
    wireShell();

    // Read the live query from the search input each time, so filter pills
    // and sort don't capture a stale closure value after the user has typed.
    const liveQuery = () => {
      const input = document.getElementById('global-search');
      return (input ? input.value : query).trim();
    };

    // gender filter pills
    document.querySelectorAll('[data-filter-gender]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = btn.dataset.filterGender;
        const params = buildHashParams({ q: liveQuery(), gender: g === 'all' ? '' : g, sort: filters.sort });
        window.location.hash = `#/dashboard${params}`;
      });
    });

    // sort
    const sortSel = document.getElementById('sort-select');
    if (sortSel) {
      sortSel.addEventListener('change', () => {
        const params = buildHashParams({ q: liveQuery(), gender: filters.gender, sort: sortSel.value });
        window.location.hash = `#/dashboard${params}`;
      });
    }

    // export csv
    const exportBtn = document.getElementById('export-csv');
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);

    // live search updates list without re-rendering whole page
    window.addEventListener('search:update', (e) => {
      const newQ = e.detail || '';
      const all = Store.all();
      let list = all;
      if (newQ) {
        const q = newQ.toLowerCase();
        list = list.filter(e2 => {
          const hay = [
            e2.name, e2.fatherHusbandName, e2.gender, e2.maritalStatus, e2.address,
            e2.qualification, e2.experience, e2.dob, e2.doj, e2.pan, e2.aadhar, e2.uan,
            e2.mobile, e2.email, e2.esiRegNo, e2.nomineeName, e2.nomineeRelation,
            e2.bankName, e2.accountNo, e2.ifsc, e2.familyMember, e2.familyRelation,
          ].filter(Boolean).join(' ').toLowerCase();
          return hay.includes(q);
        });
      }
      if (filters.gender && filters.gender !== 'all') {
        list = list.filter(em => (em.gender || '').toLowerCase() === filters.gender);
      }
      const sort = filters.sort || 'name';
      list = [...list].sort((a, b) => {
        if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sort === 'recent') return (b.id || 0) - (a.id || 0);
        return 0;
      });
      const wrap = document.getElementById('emp-list-wrap');
      if (wrap) wrap.innerHTML = renderEmployeeList(list);
      const cnt = document.getElementById('filter-count');
      if (cnt) cnt.textContent = list.length;
    });
  };

  const buildHashParams = ({ q, gender, sort }) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (gender && gender !== 'all') sp.set('gender', gender);
    if (sort && sort !== 'name') sp.set('sort', sort);
    const s = sp.toString();
    return s ? `?${s}` : '';
  };

  // ---------- PROFILE ----------
  const renderProfile = (id) => {
    const emp = Store.byId(id);
    if (!emp) {
      return renderShell(`
        <div class="page-head"><h1 class="page-head__title">Not found</h1></div>
        <p>That employee record could not be located.
           <a href="#/dashboard">Back to directory →</a></p>
      `, { active: 'dashboard' });
    }

    const isAdmin = Auth.isAdmin();
    const editBtn = isAdmin
      ? `<a class="btn btn--ghost" href="#/admin/edit/${emp.id}">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
             <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
           </svg>
           Edit details
         </a>`
      : '';
    const deleteBtn = isAdmin
      ? `<button id="delete-emp" class="btn btn--danger">Delete</button>`
      : '';
    const photoBtn = isAdmin
      ? `<label class="profile__photo-edit file-btn">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
             <circle cx="12" cy="13" r="4"/>
           </svg>
           Change photo
           <input type="file" accept="image/*" id="photo-input">
         </label>`
      : '';

    const detail = (label, value, opts = {}) => {
      const cls = [
        'detail',
        opts.full ? 'detail--full' : '',
      ].join(' ');
      const valClass = [
        'detail__value',
        opts.mono ? 'detail__value--mono' : '',
        !value ? 'detail__value--empty' : '',
      ].join(' ');
      const display = value
        ? esc(opts.format ? opts.format(value) : value)
        : 'Not on record';
      return `
        <div class="${cls}">
          <div class="detail__label">${label}</div>
          <div class="${valClass}">${display}</div>
        </div>
      `;
    };

    const inner = `
      <a class="profile__back" href="#/dashboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to directory
      </a>

      <div class="page-head">
        <div>
          <h1 class="page-head__title"><em>${esc(emp.name)}</em></h1>
          <p class="page-head__sub">Employee · ID #${emp.id}</p>
        </div>
        <div class="page-head__actions">
          <button id="print-profile" class="btn btn--ghost">Print</button>
          ${editBtn}
          ${deleteBtn}
        </div>
      </div>

      <div class="profile">
        <aside class="profile__aside">
          <div class="profile__photo-wrap" style="${photoBg(emp)}">
            ${photoBtn}
          </div>
          <h2 class="profile__name">${esc(emp.name)}</h2>
          <div class="profile__role">${esc(emp.qualification || 'Staff')} · ${esc(emp.gender || '')}</div>

          <div class="profile__quick">
            <div class="profile__quick-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>${esc(emp.mobile || '—')}</span>
            </div>
            <div class="profile__quick-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              ${emp.email
                ? `<a href="mailto:${esc(emp.email)}">${esc(emp.email)}</a>`
                : '<span style="color: var(--ink-soft); font-style: italic;">No email</span>'}
            </div>
            <div class="profile__quick-row">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style="font-size: 12.5px;">${esc(emp.address || '—')}</span>
            </div>
          </div>
        </aside>

        <div class="profile__main">
          <section class="section">
            <div class="section__head">
              <h3 class="section__title">Personal information</h3>
              <span class="section__num">01 / 05</span>
            </div>
            <div class="detail-grid">
              ${detail('Full name', emp.name)}
              ${detail('Father / husband', emp.fatherHusbandName)}
              ${detail('Gender', emp.gender)}
              ${detail('Marital status', emp.maritalStatus)}
              ${detail('Date of birth', emp.dob, { format: formatDate })}
              ${detail('Qualification', emp.qualification)}
              ${detail('Experience', emp.experience)}
              ${detail('Date of joining', emp.doj)}
              ${detail('Address', emp.address, { full: true })}
            </div>
          </section>

          <section class="section">
            <div class="section__head">
              <h3 class="section__title">Identity &amp; statutory</h3>
              <span class="section__num">02 / 05</span>
            </div>
            <div class="detail-grid">
              ${detail('PAN', emp.pan, { mono: true })}
              ${detail('Aadhaar number', emp.aadhar, { mono: true })}
              ${detail('UAN', emp.uan, { mono: true })}
              ${detail('ESI registration', emp.esiRegNo, { mono: true })}
            </div>
          </section>

          <section class="section">
            <div class="section__head">
              <h3 class="section__title">Contact</h3>
              <span class="section__num">03 / 05</span>
            </div>
            <div class="detail-grid">
              ${detail('Mobile', emp.mobile, { mono: true })}
              ${detail('Email', emp.email)}
            </div>
          </section>

          <section class="section">
            <div class="section__head">
              <h3 class="section__title">Nominee &amp; family</h3>
              <span class="section__num">04 / 05</span>
            </div>
            <div class="detail-grid">
              ${detail('Nominee name', emp.nomineeName)}
              ${detail('Relationship', emp.nomineeRelation)}
              ${detail('Nominee DOB', emp.nomineeDob, { format: formatDate })}
              ${detail('Nominee address', emp.nomineeAddress, { full: true })}
              ${detail('Family member', emp.familyMember)}
              ${detail('Family relationship', emp.familyRelation)}
              ${detail('Family member DOB', emp.familyDob, { format: formatDate })}
              ${detail('Family address', emp.familyAddress, { full: true })}
            </div>
          </section>

          <section class="section">
            <div class="section__head">
              <h3 class="section__title">Bank details</h3>
              <span class="section__num">05 / 05</span>
            </div>
            <div class="detail-grid">
              ${detail('Bank name', emp.bankName)}
              ${detail('Account number', emp.accountNo, { mono: true })}
              ${detail('IFSC code', emp.ifsc, { mono: true })}
            </div>
          </section>
        </div>
      </div>
    `;

    return renderShell(inner, { active: 'dashboard' });
  };

  const wireProfile = (id) => {
    wireShell();

    const printBtn = document.getElementById('print-profile');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    const photoInput = document.getElementById('photo-input');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          Toast.show('Please choose an image file.', 'error');
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          Toast.show('Image too large (max 2MB).', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            Store.setPhoto(id, reader.result);
            Toast.show('Photo updated.', 'success');
            Router.render();
          } catch (err) {
            Toast.show('Could not save photo (storage full).', 'error');
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const delBtn = document.getElementById('delete-emp');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        const emp = Store.byId(id);
        Modal.confirm({
          title: `Delete ${emp.name}?`,
          body: 'This will permanently remove the record from this device. This action cannot be undone.',
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: () => {
            Store.remove(id);
            Toast.show('Employee record deleted.', 'success');
            window.location.hash = '#/dashboard';
          },
        });
      });
    }
  };

  // ---------- ADMIN — add / edit form ----------
  const renderAdminForm = (mode, id) => {
    if (!Auth.isAdmin()) {
      return renderShell(`<p>Admin access required.</p>`, {});
    }
    const isEdit = mode === 'edit';
    const emp = isEdit ? Store.byId(id) : {};
    if (isEdit && !emp) {
      return renderShell(`<p>Record not found. <a href="#/admin">Back to admin</a>.</p>`, { active: 'admin' });
    }

    const v = (k) => esc(emp[k] || '');

    const inner = `
      <a class="profile__back" href="${isEdit ? `#/profile/${id}` : '#/admin'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back
      </a>

      <div class="page-head">
        <div>
          <h1 class="page-head__title">${isEdit ? 'Edit' : 'New'} <em>${isEdit ? esc(emp.name) : 'employee'}</em></h1>
          <p class="page-head__sub">${isEdit ? `Updating record #${id}` : 'Fill in the details below'}</p>
        </div>
      </div>

      <form id="emp-form" class="form-card" autocomplete="off">
        <div class="photo-uploader">
          <div class="photo-uploader__preview" id="photo-preview"
               style="${emp.photo ? photoBg(emp) : `background-image: url('assets/default-avatar.svg');`}"></div>
          <div>
            <div class="photo-uploader__actions">
              <label class="btn btn--ghost btn--sm file-btn">
                Choose photo
                <input type="file" accept="image/*" id="form-photo">
              </label>
              ${emp.photo ? `<button type="button" id="remove-photo" class="btn btn--ghost btn--sm">Remove</button>` : ''}
            </div>
            <div class="photo-uploader__hint">JPG or PNG, up to 2MB. Optional — a default avatar is used if none.</div>
          </div>
        </div>

        <div class="form-grid" style="margin-top: 24px;">

          <h4 class="form-section-title">Personal information</h4>

          <div class="field">
            <label>Full name *</label>
            <input name="name" value="${v('name')}" required>
          </div>
          <div class="field">
            <label>Father / husband name</label>
            <input name="fatherHusbandName" value="${v('fatherHusbandName')}">
          </div>
          <div class="field">
            <label>Gender</label>
            <select name="gender">
              <option value="">—</option>
              <option ${emp.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option ${emp.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option ${emp.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="field">
            <label>Marital status</label>
            <select name="maritalStatus">
              <option value="">—</option>
              <option ${emp.maritalStatus === 'Married' ? 'selected' : ''}>Married</option>
              <option ${emp.maritalStatus === 'Unmarried' ? 'selected' : ''}>Unmarried</option>
            </select>
          </div>
          <div class="field">
            <label>Date of birth</label>
            <input type="date" name="dob" value="${v('dob')}">
          </div>
          <div class="field">
            <label>Qualification</label>
            <input name="qualification" value="${v('qualification')}">
          </div>
          <div class="field">
            <label>Experience</label>
            <input name="experience" value="${v('experience')}" placeholder="e.g. 5 years">
          </div>
          <div class="field">
            <label>Date of joining</label>
            <input name="doj" value="${v('doj')}" placeholder="e.g. 6 Apr, Monday">
          </div>
          <div class="field field--full">
            <label>Address</label>
            <textarea name="address">${v('address')}</textarea>
          </div>

          <h4 class="form-section-title">Identity &amp; statutory</h4>

          <div class="field">
            <label>PAN</label>
            <input name="pan" value="${v('pan')}" style="font-family: var(--mono); text-transform: uppercase;">
          </div>
          <div class="field">
            <label>Aadhaar number</label>
            <input name="aadhar" value="${v('aadhar')}" style="font-family: var(--mono);">
          </div>
          <div class="field">
            <label>UAN</label>
            <input name="uan" value="${v('uan')}" style="font-family: var(--mono);">
          </div>
          <div class="field">
            <label>ESI registration number</label>
            <input name="esiRegNo" value="${v('esiRegNo')}" style="font-family: var(--mono);">
          </div>

          <h4 class="form-section-title">Contact</h4>

          <div class="field">
            <label>Mobile</label>
            <input name="mobile" value="${v('mobile')}" style="font-family: var(--mono);">
          </div>
          <div class="field">
            <label>Email</label>
            <input type="email" name="email" value="${v('email')}">
          </div>

          <h4 class="form-section-title">Nominee details</h4>

          <div class="field">
            <label>Nominee name</label>
            <input name="nomineeName" value="${v('nomineeName')}">
          </div>
          <div class="field">
            <label>Relationship</label>
            <input name="nomineeRelation" value="${v('nomineeRelation')}">
          </div>
          <div class="field">
            <label>Nominee DOB</label>
            <input type="date" name="nomineeDob" value="${v('nomineeDob')}">
          </div>
          <div class="field">
            <label>Nominee address</label>
            <textarea name="nomineeAddress">${v('nomineeAddress')}</textarea>
          </div>

          <h4 class="form-section-title">Family member</h4>

          <div class="field">
            <label>Family member name</label>
            <input name="familyMember" value="${v('familyMember')}">
          </div>
          <div class="field">
            <label>Relationship</label>
            <input name="familyRelation" value="${v('familyRelation')}">
          </div>
          <div class="field">
            <label>Family member DOB</label>
            <input type="date" name="familyDob" value="${v('familyDob')}">
          </div>
          <div class="field">
            <label>Family member address</label>
            <textarea name="familyAddress">${v('familyAddress')}</textarea>
          </div>

          <h4 class="form-section-title">Bank details</h4>

          <div class="field">
            <label>Bank name</label>
            <input name="bankName" value="${v('bankName')}">
          </div>
          <div class="field">
            <label>Account number</label>
            <input name="accountNo" value="${v('accountNo')}" style="font-family: var(--mono);">
          </div>
          <div class="field field--full">
            <label>IFSC code</label>
            <input name="ifsc" value="${v('ifsc')}" style="font-family: var(--mono); text-transform: uppercase; max-width: 280px;">
          </div>
        </div>

        <div class="form-actions">
          <a class="btn btn--ghost" href="${isEdit ? `#/profile/${id}` : '#/dashboard'}">Cancel</a>
          <button type="submit" class="btn btn--accent">${isEdit ? 'Save changes' : 'Create employee'}</button>
        </div>
      </form>
    `;

    return renderShell(inner, { active: 'admin' });
  };

  const wireAdminForm = (mode, id) => {
    wireShell();

    let pendingPhoto = undefined; // undefined = no change, null = remove, string = new dataUrl

    const photoInput = document.getElementById('form-photo');
    const preview = document.getElementById('photo-preview');

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          Toast.show('Please choose an image file.', 'error');
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          Toast.show('Image too large (max 2MB).', 'error');
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          pendingPhoto = reader.result;
          preview.style.backgroundImage = `url('${reader.result}')`;
        };
        reader.readAsDataURL(file);
      });
    }

    const removeBtn = document.getElementById('remove-photo');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        pendingPhoto = null;
        preview.style.backgroundImage = `url('assets/default-avatar.svg')`;
        removeBtn.style.display = 'none';
      });
    }

    const form = document.getElementById('emp-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {};
      [...form.elements].forEach(el => {
        if (el.name) data[el.name] = el.value.trim();
      });

      // Light validation
      if (!data.name) {
        Toast.show('Name is required.', 'error');
        return;
      }
      if (data.pan && !/^[A-Z0-9]{8,12}$/i.test(data.pan)) {
        Toast.show('PAN looks unusual — please double-check.', 'error');
        // Don't block, just warn
      }

      try {
        if (mode === 'edit') {
          const patch = { ...data };
          if (pendingPhoto !== undefined) patch.photo = pendingPhoto;
          Store.update(id, patch);
          Toast.show('Saved.', 'success');
          window.location.hash = `#/profile/${id}`;
        } else {
          const newEmp = Store.add({ ...data, photo: pendingPhoto || null });
          Toast.show('Employee added.', 'success');
          window.location.hash = `#/profile/${newEmp.id}`;
        }
      } catch (err) {
        Toast.show('Could not save (storage full or photo too large).', 'error');
      }
    });
  };

  // ---------- ADMIN home (manage list) ----------
  const renderAdminHome = () => {
    if (!Auth.isAdmin()) {
      return renderShell(`<p>Admin access required.</p>`, {});
    }
    const list = [...Store.all()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const inner = `
      <div class="page-head">
        <div>
          <h1 class="page-head__title">Admin <em>panel</em></h1>
          <p class="page-head__sub">Add, edit, or remove employee records · ${list.length} on file</p>
        </div>
        <div class="page-head__actions">
          <button id="reset-data" class="btn btn--ghost">Reset to seed</button>
          <a class="btn btn--accent" href="#/admin/new">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add employee
          </a>
        </div>
      </div>

      <div class="emp-list">
        <div class="emp-list__head">
          <span></span>
          <span>Name</span>
          <span>PAN</span>
          <span>Mobile</span>
          <span></span>
        </div>
        ${list.map(e => `
          <div class="emp-row" style="cursor: default;">
            <div class="emp-row__avatar"
                 style="${e.photo ? photoBg(e) : ''}"
                 aria-hidden="true">
              ${e.photo ? '' : esc(initials(e.name))}
            </div>
            <div>
              <div class="emp-row__name">
                <a href="#/profile/${e.id}" style="color: inherit;">${esc(e.name)}</a>
              </div>
              <div class="emp-row__name-sub">${esc(e.qualification || '—')}</div>
            </div>
            <div class="emp-row__cell emp-row__cell--mono">${esc(e.pan || '—')}</div>
            <div class="emp-row__cell emp-row__cell--mono">${esc(e.mobile || '—')}</div>
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <a class="btn btn--ghost btn--sm" href="#/admin/edit/${e.id}">Edit</a>
              <button class="btn btn--ghost btn--sm" data-delete="${e.id}" data-name="${esc(e.name)}"
                      style="color: var(--danger);">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    return renderShell(inner, { active: 'admin' });
  };

  const wireAdminHome = () => {
    wireShell();

    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.delete);
        const name = btn.dataset.name;
        Modal.confirm({
          title: `Delete ${name}?`,
          body: 'This will permanently remove the record from this device. This action cannot be undone.',
          confirmLabel: 'Delete',
          danger: true,
          onConfirm: () => {
            Store.remove(id);
            Toast.show('Employee record deleted.', 'success');
            Router.render();
          },
        });
      });
    });

    const reset = document.getElementById('reset-data');
    if (reset) reset.addEventListener('click', () => {
      Modal.confirm({
        title: 'Reset all data?',
        body: 'This wipes every change you have made and reloads the original 20 records from the spreadsheet. Custom photos will also be removed.',
        confirmLabel: 'Reset everything',
        danger: true,
        onConfirm: () => {
          Store.resetAll();
          Auth.logout();
          Toast.show('Data reset. Please sign in again.', 'success');
          window.location.hash = '#/login';
        },
      });
    });
  };

  // ---------- CSV export ----------
  const exportCsv = () => {
    const list = Store.all();
    const fields = [
      'id','name','fatherHusbandName','gender','maritalStatus','address',
      'qualification','experience','dob','doj','pan','aadhar','uan',
      'mobile','email','esiRegNo','nomineeName','nomineeAddress',
      'nomineeRelation','nomineeDob','familyMember','familyRelation',
      'familyDob','familyAddress','bankName','accountNo','ifsc',
    ];
    const escapeCsv = (v) => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const header = fields.join(',');
    const rows = list.map(e => fields.map(f => escapeCsv(e[f])).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixous-employees-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('CSV downloaded.', 'success');
  };

  return {
    renderLogin, wireLogin,
    renderDashboard, wireDashboard,
    renderProfile, wireProfile,
    renderAdminHome, wireAdminHome,
    renderAdminForm, wireAdminForm,
  };
})();

window.Views = Views;

// =========================================================================
// Modal helper
// =========================================================================
const Modal = {
  confirm({ title, body, confirmLabel = 'Confirm', danger = false, onConfirm }) {
    const root = document.getElementById('modal-root');
    if (!root) return;
    root.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal" role="dialog" aria-modal="true">
          <h3 class="modal__title">${title}</h3>
          <p class="modal__body">${body}</p>
          <div class="modal__actions">
            <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
            <button class="btn ${danger ? 'btn--danger' : 'btn--accent'}" id="modal-ok">${confirmLabel}</button>
          </div>
        </div>
      </div>
    `;
    const close = () => { root.innerHTML = ''; };
    document.getElementById('modal-cancel').addEventListener('click', close);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modal-backdrop') close();
    });
    document.getElementById('modal-ok').addEventListener('click', () => {
      close();
      onConfirm && onConfirm();
    });
  },
};
window.Modal = Modal;

// =========================================================================
// Toast helper
// =========================================================================
const Toast = {
  show(message, kind = '') {
    const root = document.getElementById('toast-root');
    if (!root) {
      // Create one if shell not yet mounted (e.g. on login)
      const wrap = document.createElement('div');
      wrap.id = 'toast-root';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const wrap = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast ${kind ? 'toast--' + kind : ''}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 200ms, transform 200ms';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 220);
    }, 2400);
  },
};
window.Toast = Toast;
