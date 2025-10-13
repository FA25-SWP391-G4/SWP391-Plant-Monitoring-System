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
    return { success: true, user: { id: u.id, name: u.name, email: u.email, role: u.role } };
  }
  return { success: false, error: 'Invalid email or password' };
}

export function logout() {
  localStorage.removeItem('sg_user');
}

export function getCurrentUser() {
  const data = localStorage.getItem('sg_user');
  return data ? JSON.parse(data) : null;
}

export function isLoggedIn() {
  return !!getCurrentUser();
}

export function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

export function isPremium() {
  const user = getCurrentUser();
  return user && (user.role === 'premium' || user.role === 'admin');
}