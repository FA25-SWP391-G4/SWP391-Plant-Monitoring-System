const DEFAULT_USERS = [
  { id: 'u1', name: 'Regular User', email: 'user@smartgarden.test', role: 'regular', password: '123456' },
  { id: 'u2', name: 'Premium User', email: 'premium@smartgarden.test', role: 'premium', password: '123456' },
  { id: 'u3', name: 'Admin User', email: 'admin@smartgarden.test', role: 'admin', password: '123456' }
];

function ensureSeed() {
  if (!localStorage.getItem('sg_users')) {
    localStorage.setItem('sg_users', JSON.stringify(DEFAULT_USERS));
  }
}
export function getUsers() { ensureSeed(); return JSON.parse(localStorage.getItem('sg_users') || '[]'); }
export function setUsers(list) { localStorage.setItem('sg_users', JSON.stringify(list)); }
export function findUserByEmail(email) { return getUsers().find(u => u.email === email); }

export function login(email, password) {
  ensureSeed();
  const u = findUserByEmail(email);
  if (u && u.password === password) {
    localStorage.setItem('sg_user', JSON.stringify({ id: u.id, name: u.name, email: u.email, role: u.role }));
    return { ok: true, user: u };
  }
  return { ok: false, error: 'Invalid email or password' };
}
export function logout() { localStorage.removeItem('sg_user'); }

/* Device setup mock store */
export function saveDeviceWifi({ ssid, pass }) {
  localStorage.setItem('sg_device_wifi', JSON.stringify({ ssid, pass, savedAt: new Date().toISOString() }));
}
export function getDeviceWifi() {
  return JSON.parse(localStorage.getItem('sg_device_wifi') || 'null');
}

/* Utilities */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
