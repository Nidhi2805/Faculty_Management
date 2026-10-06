const { pool } = require('../config/database');

const createNotification = async (userId, title, message, type, relatedId = null, relatedType = null) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, title, message, type, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, message, type, relatedId, relatedType]
    );
  } catch (error) {
    console.error('Notification creation error:', error.message);
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'user_id = ?';
    const params = [req.user.id];
    if (unread_only === 'true') { whereClause += ' AND is_read = FALSE'; }

    const [rows] = await pool.execute(
      `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) as unread FROM notifications WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows,
      meta: { total: countRows[0].total, unread: countRows[0].unread || 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/mark-read
const markAllRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/:id/read
const markOneRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
  try {
    await pool.execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createNotification, getNotifications, markAllRead, markOneRead, deleteNotification };
