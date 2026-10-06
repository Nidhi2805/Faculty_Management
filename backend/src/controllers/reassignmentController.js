const { pool } = require('../config/database');
const { manualOverride } = require('../services/reschedulingEngine');

// GET /api/reassignments
const getReassignments = async (req, res) => {
  try {
    const { leave_request_id, status, faculty_id } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (req.user.role === 'faculty') {
      whereClause += ' AND (lr2.original_faculty_id = ? OR lr2.substitute_faculty_id = ?)';
      params.push(req.user.id, req.user.id);
    } else if (req.user.role === 'hod') {
      whereClause += ' AND orig.department_id = ?';
      params.push(req.user.department_id);
    }
    if (leave_request_id) { whereClause += ' AND lr2.leave_request_id = ?'; params.push(leave_request_id); }
    if (status) { whereClause += ' AND lr2.status = ?'; params.push(status); }
    if (faculty_id && req.user.role === 'admin') { whereClause += ' AND (lr2.original_faculty_id = ? OR lr2.substitute_faculty_id = ?)'; params.push(faculty_id, faculty_id); }

    const [rows] = await pool.execute(
      `SELECT lr2.*, s.name AS subject_name, s.code AS subject_code,
              orig.name AS original_faculty_name, orig.employee_id AS orig_emp_id,
              sub.name AS substitute_faculty_name, sub.employee_id AS sub_emp_id,
              d.name AS department_name
       FROM lecture_reassignments lr2
       JOIN subjects s ON lr2.subject_id = s.id
       JOIN users orig ON lr2.original_faculty_id = orig.id
       LEFT JOIN users sub ON lr2.substitute_faculty_id = sub.id
       LEFT JOIN departments d ON orig.department_id = d.id
       WHERE ${whereClause}
       ORDER BY lr2.reassignment_date DESC, lr2.start_time`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reassignments/substitution-duties (faculty substitution duties)
const getSubstitutionDuties = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT lr2.*, s.name AS subject_name, orig.name AS original_faculty_name,
              lr.start_date AS leave_start, lr.end_date AS leave_end
       FROM lecture_reassignments lr2
       JOIN subjects s ON lr2.subject_id = s.id
       JOIN users orig ON lr2.original_faculty_id = orig.id
       JOIN leave_requests lr ON lr2.leave_request_id = lr.id
       WHERE lr2.substitute_faculty_id = ?
       ORDER BY lr2.reassignment_date DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/reassignments/:id/override - HOD manual override
const overrideReassignment = async (req, res) => {
  try {
    const { substitute_faculty_id, reason } = req.body;
    const reassignmentId = req.params.id;

    if (!substitute_faculty_id) {
      return res.status(400).json({ success: false, message: 'substitute_faculty_id is required.' });
    }

    const result = await manualOverride(reassignmentId, substitute_faculty_id, reason || 'Manual override by HOD', req.user.id);
    res.json({ success: true, message: 'Reassignment override successful.', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reassignments/available-substitutes/:reassignmentId
const getAvailableSubstitutes = async (req, res) => {
  try {
    const [reassignment] = await pool.execute(
      'SELECT * FROM lecture_reassignments WHERE id = ?', [req.params.reassignmentId]
    );
    if (!reassignment.length) return res.status(404).json({ success: false, message: 'Reassignment not found.' });

    const r = reassignment[0];

    const [candidates] = await pool.execute(
      `SELECT u.id, u.name, u.employee_id, u.designation, d.name AS department_name,
              fs.is_primary, COALESCE(wl.substitution_count, 0) AS substitution_count
       FROM users u
       JOIN faculty_subjects fs ON u.id = fs.faculty_id AND fs.subject_id = ?
       JOIN departments d ON u.department_id = d.id
       LEFT JOIN workload_logs wl ON u.id = wl.faculty_id
         AND wl.month = MONTH(?) AND wl.year = YEAR(?)
       WHERE u.role = 'faculty' AND u.is_active = 1 AND u.id != ?`,
      [r.subject_id, r.reassignment_date, r.reassignment_date, r.original_faculty_id]
    );

    // Filter by availability
    const available = [];
    for (const c of candidates) {
      const [conflicts] = await pool.execute(
        `SELECT id FROM timetable WHERE faculty_id = ? AND day_of_week = ? AND is_active = 1
         AND NOT (end_time <= ? OR start_time >= ?)`,
        [c.id, r.day_of_week, r.start_time, r.end_time]
      );
      if (!conflicts.length) available.push({ ...c, has_conflict: false });
    }

    res.json({ success: true, data: available });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReassignments, getSubstitutionDuties, overrideReassignment, getAvailableSubstitutes };
