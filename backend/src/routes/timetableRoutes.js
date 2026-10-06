const express = require('express');
const router = express.Router();
const { getTimetable, createTimetableSlot, updateTimetableSlot, deleteTimetableSlot } = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getTimetable);
router.post('/', authorize('admin'), createTimetableSlot);
router.put('/:id', authorize('admin'), updateTimetableSlot);
router.delete('/:id', authorize('admin'), deleteTimetableSlot);

module.exports = router;
