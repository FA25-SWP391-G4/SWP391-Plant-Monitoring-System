const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock models used by controller and auth middleware
jest.mock('../models/User', () => {
  const users = new Map();
  const api = {
    __setUser(id, data) {
      users.set(id, { user_id: id, ...data });
    },
    __reset() {
      users.clear();
    },
    findById: jest.fn(async (id) => {
      const data = users.get(id);
      if (!data) return null;
      return {
        ...data,
        save: jest.fn(async function () {
          users.set(this.user_id, { ...this });
        })
      };
    }),
    findAll: jest.fn(async () => Array.from(users.values()).map(u => ({ ...u })))
  };
  return api;
});

jest.mock('../models/Alert', () => {
  let alerts = [];
  let nextId = 1;

  const makeInstance = (alert) => ({
    ...alert,
    save: jest.fn(async function () {
      const idx = alerts.findIndex(a => a.alert_id === this.alert_id);
      if (idx >= 0) alerts[idx] = { ...alerts[idx], ...this };
    }),
    delete: jest.fn(async function () {
      alerts = alerts.filter(a => a.alert_id !== this.alert_id);
    })
  });

  return {
    __reset() {
      alerts = [];
      nextId = 1;
    },
    create: jest.fn(async (data) => {
      const alert = {
        alert_id: nextId++,
        is_read: false,
        ...data
      };
      alerts.push(alert);
      return makeInstance(alert);
    }),
    findByUserId: jest.fn(async (userId) =>
      alerts.filter(a => a.user_id === userId).map(a => ({ ...a }))
    ),
    findUnreadByUserId: jest.fn(async (userId) =>
      alerts.filter(a => a.user_id === userId && !a.is_read).map(a => ({ ...a }))
    ),
    findById: jest.fn(async (id) => {
      const alert = alerts.find(a => String(a.alert_id) === String(id));
      return alert ? makeInstance(alert) : null;
    }),
    markAllAsReadForUser: jest.fn(async (userId) => {
      alerts = alerts.map(a => a.user_id === userId ? { ...a, is_read: true } : a);
    })
  };
});

jest.mock('../models/SystemLog', () => ({
  create: jest.fn(async () => {})
}));

// Build an isolated express app with the notifications router
const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', require('../routes/notifications'));
  return app;
};

describe('NotificationController API', () => {
  const userId = 101;
  let token;
  let app;
  let User;
  let Alert;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
  });

  beforeEach(() => {
    // Grab mocked modules
    User = require('../models/User');
    Alert = require('../models/Alert');

    // Reset mock stores
    User.__reset();
    Alert.__reset();

    // Seed user and token
    User.__setUser(userId, { email: 'test@example.com', role: 'Regular', full_name: 'Test User' });
    token = jwt.sign({ user_id: userId, role: 'Regular', full_name: 'Test User' }, process.env.JWT_SECRET);

    // Fresh app for each test
    app = buildApp();
  });

  test('GET /api/notifications returns all user notifications', async () => {
    await Alert.create({ user_id: userId, title: 'A', message: 'm1', type: 'lowMoisture', details: '{}' });
    await Alert.create({ user_id: userId, title: 'B', message: 'm2', type: 'pumpActivation', details: '{}', is_read: true });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('GET /api/notifications/unread returns only unread notifications', async () => {
    await Alert.create({ user_id: userId, title: 'Unread 1', message: 'u1', type: 'lowMoisture', details: '{}' });
    const read = await Alert.create({ user_id: userId, title: 'Read', message: 'r1', type: 'pumpActivation', details: '{}' });
    // Mark one as read using instance save
    read.is_read = true;
    await read.save();

    const res = await request(app)
      .get('/api/notifications/unread')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].is_read).toBe(false);
  });

  test('PUT /api/notifications/:id/read marks a notification as read', async () => {
    const alert = await Alert.create({ user_id: userId, title: 'To Read', message: 'm', type: 'lowMoisture', details: '{}' });

    const res = await request(app)
      .put(`/api/notifications/${alert.alert_id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/marked as read/i);
    expect(res.body.data.is_read).toBe(true);

    // Verify unread list is now empty
    const unread = await request(app)
      .get('/api/notifications/unread')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unread.body.data.length).toBe(0);
  });

  test('PUT /api/notifications/read-all marks all notifications as read', async () => {
    await Alert.create({ user_id: userId, title: 'U1', message: 'u1', type: 'lowMoisture', details: '{}' });
    await Alert.create({ user_id: userId, title: 'U2', message: 'u2', type: 'highTemperature', details: '{}' });

    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/marked as read/i);

    const unread = await request(app)
      .get('/api/notifications/unread')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unread.body.data.length).toBe(0);
  });

  test('DELETE /api/notifications/:id deletes a notification', async () => {
    const alert = await Alert.create({ user_id: userId, title: 'Del', message: 'm', type: 'deviceOffline', details: '{}' });

    const res = await request(app)
      .delete(`/api/notifications/${alert.alert_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);

    const all = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(all.body.data.length).toBe(0);
  });

  test('GET /api/notifications/preferences returns defaults when unset', async () => {
    const res = await request(app)
      .get('/api/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const prefs = res.body.data;
    expect(prefs.email).toBe(true);
    expect(prefs.push).toBe(true);
    expect(prefs.lowMoisture).toBe(true);
    expect(prefs.highTemperature).toBe(true);
    expect(prefs.deviceOffline).toBe(true);
    expect(prefs.pumpActivation).toBe(true);
  });

  test('PUT /api/notifications/preferences updates and merges preferences', async () => {
    // Seed existing prefs
    const user = await User.findById(userId);
    user.notification_prefs = { email: true, push: true, lowMoisture: true };
    await user.save();

    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferences: { email: false, lowMoisture: false, newType: true } })
      .expect(200);

    expect(res.body.success).toBe(true);
    const prefs = res.body.data;
    expect(prefs.email).toBe(false);
    expect(prefs.push).toBe(true);
    expect(prefs.lowMoisture).toBe(false);
    expect(prefs.newType).toBe(true);

    // Confirm persisted on user
    const updated = await User.findById(userId);
    expect(updated.notification_prefs.email).toBe(false);
    expect(updated.notification_prefs.lowMoisture).toBe(false);
    expect(updated.notification_prefs.push).toBe(true);
    expect(updated.notification_prefs.newType).toBe(true);
  });

  test('PUT /api/notifications/preferences rejects invalid payload', async () => {
    const res = await request(app)
      .put('/api/notifications/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferences: null })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid preferences/i);
  });

  test('Authorization prevents operations on other users\' notifications', async () => {
    const otherUserId = 202;
    // Seed other user and alert
    User.__setUser(otherUserId, { email: 'other@example.com', role: 'Regular' });
    const otherAlert = await Alert.create({ user_id: otherUserId, title: 'Other', message: 'o', type: 'lowMoisture', details: '{}' });

    const resRead = await request(app)
      .put(`/api/notifications/${otherAlert.alert_id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(resRead.body.success).toBe(false);
    expect(resRead.body.error).toMatch(/permission/i);

    const resDelete = await request(app)
      .delete(`/api/notifications/${otherAlert.alert_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(resDelete.body.success).toBe(false);
    expect(resDelete.body.error).toMatch(/permission/i);
  });
});