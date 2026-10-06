const express = require('express');
const router = express.Router();
const { getDashboardStats, getProfile } = require('../controllers/facultyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/dashboard-stats', authorize('faculty'), getDashboardStats);
router.get('/profile', authorize('faculty', 'hod'), getProfile);

module.exports = router;
