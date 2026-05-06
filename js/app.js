// js/app.js
// =========================================================================
// Router + bootstrap. Hash-based routes. Single-page app, no dependencies.
//
// Routes:
//   #/login                      Login screen
//   #/dashboard                  Employee directory (default after login)
//   #/dashboard?q=...&gender=... Filtered directory
//   #/profile/:id                Single employee profile
//   #/admin                      Admin home (manage list)
//   #/admin/new                  Admin: add new employee
//   #/admin/edit/:id             Admin: edit existing employee
// =========================================================================

const Router = (() => {

  const parseHash = () => {
    const raw = window.location.hash || '#/login';
    const [pathPart, queryPart] = raw.replace(/^#/, '').split('?');
    const segments = pathPart.split('/').filter(Boolean);
    const params = new URLSearchParams(queryPart || '');
    return { segments, params, raw };
  };

  const render = () => {
    const { segments, params } = parseHash();
    const page = segments[0] || 'login';

    // Auth gate
    if (page !== 'login' && !Auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }
    if (page === 'login' && Auth.isLoggedIn()) {
      window.location.hash = '#/dashboard';
      return;
    }

    const app = document.getElementById('app');

    switch (page) {
      case 'login': {
        app.innerHTML = Views.renderLogin();
        Views.wireLogin();
        break;
      }
      case 'dashboard': {
        const q = params.get('q') || '';
        const filters = {
          gender: params.get('gender') || 'all',
          sort: params.get('sort') || 'name',
        };
        app.innerHTML = Views.renderDashboard(q, filters);
        Views.wireDashboard(q, filters);
        break;
      }
      case 'profile': {
        const id = Number(segments[1]);
        if (!id) {
          window.location.hash = '#/dashboard';
          return;
        }
        app.innerHTML = Views.renderProfile(id);
        Views.wireProfile(id);
        break;
      }
      case 'admin': {
        // Admin gate
        if (!Auth.isAdmin()) {
          window.location.hash = '#/dashboard';
          return;
        }
        const sub = segments[1];
        if (sub === 'new') {
          app.innerHTML = Views.renderAdminForm('new');
          Views.wireAdminForm('new');
        } else if (sub === 'edit') {
          const id = Number(segments[2]);
          if (!id) {
            window.location.hash = '#/admin';
            return;
          }
          app.innerHTML = Views.renderAdminForm('edit', id);
          Views.wireAdminForm('edit', id);
        } else {
          app.innerHTML = Views.renderAdminHome();
          Views.wireAdminHome();
        }
        break;
      }
      default: {
        window.location.hash = '#/login';
      }
    }

    // scroll to top on navigation
    window.scrollTo(0, 0);
  };

  const init = () => {
    Store.seedIfEmpty();

    if (!window.location.hash) {
      window.location.hash = Auth.isLoggedIn() ? '#/dashboard' : '#/login';
    }

    window.addEventListener('hashchange', render);
    render();
  };

  return { init, render };
})();

window.Router = Router;

// Boot
document.addEventListener('DOMContentLoaded', Router.init);
