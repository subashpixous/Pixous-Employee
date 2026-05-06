// js/auth.js
// =========================================================================
// Authentication — simple username/password with two roles: admin & user.
//
// IMPORTANT NOTE FOR PRODUCTION:
//   This is a CLIENT-SIDE only auth implementation suitable for demos,
//   internal tools, or single-tenant deployments where the data lives in
//   the user's own browser. For a real multi-user product, replace this
//   with a proper backend API + hashed passwords + sessions/JWT.
//
// Default credentials are intentionally visible on the login screen so
// the system is easy to use out of the box. Change them in CREDENTIALS
// below before deploying anywhere shared.
// =========================================================================

const Auth = (() => {
  const CREDENTIALS = {
    admin: { username: 'admin', password: 'admin123', role: 'admin', displayName: 'Administrator' },
    user:  { username: 'user',  password: 'user123',  role: 'user',  displayName: 'Staff' },
  };

  const login = (username, password, role) => {
    const u = String(username || '').trim().toLowerCase();
    const p = String(password || '');
    const cred = CREDENTIALS[role];
    if (!cred) return { ok: false, error: 'Unknown role.' };
    if (cred.username !== u || cred.password !== p) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    const session = {
      username: cred.username,
      role: cred.role,
      displayName: cred.displayName,
      loggedInAt: new Date().toISOString(),
    };
    Store.setSession(session);
    return { ok: true, session };
  };

  const logout = () => Store.clearSession();

  const current = () => Store.getSession();

  const isLoggedIn = () => current() !== null;

  const isAdmin = () => {
    const s = current();
    return s != null && s.role === 'admin';
  };

  return { login, logout, current, isLoggedIn, isAdmin, CREDENTIALS };
})();

window.Auth = Auth;
