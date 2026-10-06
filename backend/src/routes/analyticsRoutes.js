const express = require('express');
const router = express.Router();
const { getOverview, getLeaveTrends, getFacultyWorkload, getDepartmentStats, getFacultyLeaveCounts, getSubstitutionPatterns } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin', 'hod'));
router.get('/overview', getOverview);
router.get('/leave-trends', getLeaveTrends);
router.get('/faculty-workload', getFacultyWorkload);
router.get('/department-stats', getDepartmentStats);
router.get('/faculty-leave-counts', getFacultyLeaveCounts);
router.get('/substitution-patterns', getSubstitutionPatterns);

module.exports = router;
