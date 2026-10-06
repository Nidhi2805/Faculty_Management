const express = require('express');
const router = express.Router();
const { getReassignments, getSubstitutionDuties, overrideReassignment, getAvailableSubstitutes } = require('../controllers/reassignmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getReassignments);
router.get('/substitution-duties', authorize('faculty'), getSubstitutionDuties);
router.get('/available-substitutes/:reassignmentId', authorize('hod','admin'), getAvailableSubstitutes);
router.put('/:id/override', authorize('hod','admin'), overrideReassignment);

module.exports = router;
