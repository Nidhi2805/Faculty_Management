const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getLeaves, getLeaveById, applyLeave, reviewLeave, cancelLeave } = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate);

router.get('/', getLeaves);
router.get('/:id', getLeaveById);

router.post('/', authorize('faculty'), [
  body('leave_type').isIn(['sick','casual','earned','maternity','emergency','other']).withMessage('Invalid leave type'),
  body('start_date').isDate().withMessage('Valid start date required'),
  body('end_date').isDate().withMessage('Valid end date required'),
  body('reason').notEmpty().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters'),
  validate
], applyLeave);

router.put('/:id/review', authorize('hod','admin'), [
  body('status').isIn(['approved','rejected']).withMessage('Status must be approved or rejected'),
  validate
], reviewLeave);

router.put('/:id/cancel', authorize('faculty'), cancelLeave);

module.exports = router;
