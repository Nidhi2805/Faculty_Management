const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, register, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate
], login);

router.post('/register', [
  body('employee_id').notEmpty().withMessage('Employee ID required'),
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], register);

router.get('/me', authenticate, getMe);

router.put('/change-password', authenticate, [
  body('current_password').notEmpty().withMessage('Current password required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], changePassword);

module.exports = router;
