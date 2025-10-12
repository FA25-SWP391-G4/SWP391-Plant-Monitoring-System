/**
 * Admin Router Mock
 */

const express = require('express');
const router = express.Router();
const adminController = require('./adminController');

// Mock route handlers
const dummyHandler = (req, res) => {
    res.status(200).json({ success: true, message: "Mock admin endpoint" });
};

// UC24: User Management
router.get('/users', dummyHandler);
router.post('/users', dummyHandler);
router.get('/users/:userId', dummyHandler);
router.put('/users/:userId', dummyHandler);
router.delete('/users/:userId', dummyHandler);

// UC25: System Logs
router.get('/logs', dummyHandler);
router.get('/logs/:logId', dummyHandler);
router.delete('/logs/:logId', dummyHandler);

// UC26: System Backup & Restore
router.post('/backup', dummyHandler);
router.get('/backup/list', dummyHandler);
router.post('/backup/:backupId/restore', dummyHandler);

// UC27: System Configuration
router.get('/config', dummyHandler);
router.put('/config', dummyHandler);
router.post('/config/reset', dummyHandler);

// UC28: System Analytics
router.get('/analytics/users', dummyHandler);
router.get('/analytics/plants', dummyHandler);
router.get('/analytics/sensors', dummyHandler);

module.exports = router;