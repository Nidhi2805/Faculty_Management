const { pool } = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { runReschedulingEngine } = require('../services/reschedulingEngine');
const moment = require('moment');

// GET /api/leaves - get leaves (role-based)
const getLeaves = async (req, res) => {
  try {
    const { status, faculty_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    if (req.user.role === 'faculty') {
      whereClause += ' AND lr.faculty_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'hod') {
      whereClause += ' AND d.id = ?';
      params.push(req.user.department_id);
    }
    if (status) { whereClause += ' AND lr.status = ?'; params.push(status); }
    if (faculty_id && req.user.role !== 'faculty') { whereClause += ' AND lr.faculty_id = ?'; params.push(faculty_id); }

    const [rows] = await pool.execute(
      `SELECT lr.*, u.name AS faculty_name, u.employee_id, d.name AS department_name,
              h.name AS hod_name
       FROM leave_requests lr
       JOIN users u ON lr.faculty_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN users h ON lr.hod_id = h.id
       WHERE ${whereClause}
       ORDER BY lr.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      params
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM leave_requests lr
       JOIN users u ON lr.faculty_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: countRows[0].total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/leaves/:id
const getLeaveById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT lr.*, u.name AS faculty_name, u.employee_id, u.email AS faculty_email,
              d.name AS department_name, h.name AS hod_name
       FROM leave_requests lr
       JOIN users u ON lr.faculty_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN users h ON lr.hod_id = h.id
       WHERE lr.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (req.user.role === 'faculty' && rows[0].faculty_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Get reassignments for this leave
    const [reassignments] = await pool.execute(
      `SELECT lr2.*, s.name AS subject_name, u.name AS substitute_name, u.employee_id AS sub_emp_id
       FROM lecture_reassignments lr2
       JOIN subjects s ON lr2.subject_id = s.id
       LEFT JOIN users u ON lr2.substitute_faculty_id = u.id
       WHERE lr2.leave_request_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], reassignments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/leaves - apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const faculty_id = req.user.id;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Reason must be at least 5 characters.' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }
    const start = moment(start_date);
    const end = moment(end_date);
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    if (end.isBefore(start)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date.' });
    }
    const total_days = end.diff(start, 'days') + 1;

    // Check overlapping leaves
    const [overlapping] = await pool.execute(
      `SELECT id FROM leave_requests WHERE faculty_id = ? AND status IN ('pending','approved')
       AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))`,
      [faculty_id, end_date, start_date, end_date, start_date]
    );
    if (overlapping.length) {
      return res.status(409).json({ success: false, message: 'You already have a leave request for overlapping dates.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO leave_requests (faculty_id, leave_type, start_date, end_date, total_days, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [faculty_id, leave_type, start_date, end_date, total_days, reason]
    );

    const leaveId = result.insertId;

    // Notify HOD
    const [hods] = await pool.execute(
      'SELECT id FROM users WHERE role = "hod" AND department_id = ?', [req.user.department_id]
    );
    for (const hod of hods) {
      await createNotification(hod.id, 'New Leave Request',
        `${req.user.name} has applied for ${leave_type} leave from ${start_date} to ${end_date}.`,
        'leave_applied', leaveId, 'leave_request');
    }
    await createNotification(faculty_id, 'Leave Applied Successfully',
      `Your ${leave_type} leave request from ${start_date} to ${end_date} has been submitted and is pending approval.`,
      'leave_applied', leaveId, 'leave_request');

    res.status(201).json({ success: true, message: 'Leave request submitted successfully.', data: { id: leaveId, total_days } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/leaves/:id/review - HOD approve/reject
const reviewLeave = async (req, res) => {
  try {
    const { status, hod_remarks } = req.body;
    const leaveId = req.params.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const [rows] = await pool.execute('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (rows[0].status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave request is already reviewed.' });
    }

    const leave = rows[0];

    // HOD can only review leaves from their department
    if (req.user.role === 'hod') {
      const [facultyDept] = await pool.execute('SELECT department_id FROM users WHERE id = ?', [leave.faculty_id]);
      if (facultyDept[0].department_id !== req.user.department_id) {
        return res.status(403).json({ success: false, message: 'You can only review leaves from your department.' });
      }
    }

    await pool.execute(
      'UPDATE leave_requests SET status = ?, hod_id = ?, hod_remarks = ?, reviewed_at = NOW() WHERE id = ?',
      [status, req.user.id, hod_remarks || null, leaveId]
    );

    // Notify faculty
    const notifType = status === 'approved' ? 'leave_approved' : 'leave_rejected';
    const notifMsg = status === 'approved'
      ? `Your leave request from ${leave.start_date} to ${leave.end_date} has been approved. ${hod_remarks || ''}`
      : `Your leave request from ${leave.start_date} to ${leave.end_date} has been rejected. Reason: ${hod_remarks || 'No reason provided.'}`;

    await createNotification(leave.faculty_id, `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`, notifMsg, notifType, leaveId, 'leave_request');

    let reassignments = [];
    if (status === 'approved') {
      reassignments = await runReschedulingEngine(leaveId, leave.faculty_id, leave.start_date, leave.end_date, req.user.id);
    }

    res.json({
      success: true,
      message: `Leave ${status} successfully.`,
      data: { status, reassignments_created: reassignments.length, reassignments }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/leaves/:id/cancel - Faculty cancel pending leave
const cancelLeave = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM leave_requests WHERE id = ? AND faculty_id = ?', [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Leave request not found.' });
    if (rows[0].status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled.' });

    await pool.execute('UPDATE leave_requests SET status = "cancelled" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Leave request cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getLeaves, getLeaveById, applyLeave, reviewLeave, cancelLeave };
