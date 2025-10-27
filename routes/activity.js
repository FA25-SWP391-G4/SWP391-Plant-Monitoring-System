const express = require('express');
const router = express.Router();
const { getRecentActivity } = require('../controllers/activityController');

router.get('/recent', getRecentActivity);

module.exports = router;
