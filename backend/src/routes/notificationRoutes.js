const express = require('express');
const router = express.Router();
const { getNotifications, markAllRead, markOneRead, deleteNotification } = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getNotifications);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markOneRead);
router.delete('/:id', deleteNotification);

module.exports = router;
