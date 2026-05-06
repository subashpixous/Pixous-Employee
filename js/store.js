// js/store.js
// =========================================================================
// Storage layer — wraps localStorage. All employee data lives here.
// On first run, seeds from window.SEED_DATA (loaded from the Excel sheet).
// =========================================================================

const Store = (() => {
  const KEYS = {
    EMPLOYEES: 'pixous_ems_employees_v1',
    SESSION:   'pixous_ems_session_v1',
    SEEDED:    'pixous_ems_seeded_v1',
  };

  // --- low-level helpers ---
  const read = (k, fallback) => {
    try {
      const raw = localStorage.getItem(k);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn('Store.read failed for', k, e);
      return fallback;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) {
      console.error('Store.write failed for', k, e);
      // Most likely a quota exceeded (photos are big) — surface to caller.
      throw e;
    }
  };

  // --- seed on first run ---
  const seedIfEmpty = () => {
    if (read(KEYS.SEEDED, false)) return;
    const seed = (window.SEED_DATA || []).map((e, i) => ({ ...e, id: e.id || (i + 1) }));
    write(KEYS.EMPLOYEES, seed);
    write(KEYS.SEEDED, true);
  };

  // --- employee CRUD ---
  const all = () => read(KEYS.EMPLOYEES, []);

  const byId = (id) => all().find(e => e.id === Number(id)) || null;

  const nextId = () => {
    const list = all();
    return list.length === 0 ? 1 : Math.max(...list.map(e => e.id)) + 1;
  };

  const add = (employee) => {
    const list = all();
    const newEmp = { ...employee, id: nextId(), photo: employee.photo || null };
    list.push(newEmp);
    write(KEYS.EMPLOYEES, list);
    return newEmp;
  };

  const update = (id, patch) => {
    const list = all();
    const idx = list.findIndex(e => e.id === Number(id));
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, id: Number(id) };
    write(KEYS.EMPLOYEES, list);
    return list[idx];
  };

  const remove = (id) => {
    const list = all().filter(e => e.id !== Number(id));
    write(KEYS.EMPLOYEES, list);
  };

  const setPhoto = (id, dataUrl) => update(id, { photo: dataUrl });

  // --- session ---
  const getSession = () => read(KEYS.SESSION, null);
  const setSession = (session) => write(KEYS.SESSION, session);
  const clearSession = () => localStorage.removeItem(KEYS.SESSION);

  // --- danger zone ---
  const resetAll = () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  };

  // --- export ---
  return {
    seedIfEmpty,
    all, byId, add, update, remove, setPhoto,
    getSession, setSession, clearSession,
    resetAll,
  };
})();

window.Store = Store;
