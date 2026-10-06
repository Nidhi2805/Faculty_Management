const { pool } = require('../config/database');

// Safe department filter helper - uses parameterized queries
const getDeptParams = (user) => {
  if (user.role === 'hod' && user.department_id) {
    return { clause: 'AND u.department_id = ?', params: [user.department_id] };
  }
  return { clause: '', params: [] };
};

// GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const { clause, params } = getDeptParams(req.user);

    const [[leaveStats]] = await pool.execute(
      `SELECT
        COUNT(*) AS total_leaves,
        SUM(CASE WHEN lr.status='approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN lr.status='rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN lr.status='pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN lr.status='cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM leave_requests lr JOIN users u ON lr.faculty_id = u.id WHERE 1=1 ${clause}`,
      params
    );

    const [[reassignStats]] = await pool.execute(
      `SELECT
        COUNT(*) AS total_reassignments,
        SUM(CASE WHEN lr2.status IN ('assigned','completed') THEN 1 ELSE 0 END) AS covered,
        SUM(CASE WHEN lr2.substitute_faculty_id IS NULL THEN 1 ELSE 0 END) AS uncovered,
        SUM(CASE WHEN lr2.assignment_method='manual' THEN 1 ELSE 0 END) AS manual_assignments
       FROM lecture_reassignments lr2 JOIN users u ON lr2.original_faculty_id = u.id WHERE 1=1 ${clause}`,
      params
    );

    const deptClause = req.user.role === 'hod' && req.user.department_id
      ? 'AND department_id = ?' : '';
    const deptParams = req.user.role === 'hod' && req.user.department_id
      ? [req.user.department_id] : [];

    const [[facultyStats]] = await pool.execute(
      `SELECT COUNT(*) AS total_faculty FROM users WHERE role='faculty' AND is_active=1 ${deptClause}`,
      deptParams
    );

    res.json({ success: true, data: { ...leaveStats, ...reassignStats, ...facultyStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load overview stats.' });
  }
};

// GET /api/analytics/leave-trends
const getLeaveTrends = async (req, res) => {
  try {
    const { clause, params } = getDeptParams(req.user);

    const [monthly] = await pool.execute(
      `SELECT YEAR(lr.created_at) AS year, MONTH(lr.created_at) AS month,
              MONTHNAME(MIN(lr.created_at)) AS month_name,
              COUNT(*) AS total,
              SUM(CASE WHEN lr.status='approved' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN lr.status='rejected' THEN 1 ELSE 0 END) AS rejected
       FROM leave_requests lr JOIN users u ON lr.faculty_id = u.id
       WHERE lr.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${clause}
       GROUP BY YEAR(lr.created_at), MONTH(lr.created_at)
       ORDER BY year ASC, month ASC`,
      params
    );

    const [byType] = await pool.execute(
      `SELECT lr.leave_type, COUNT(*) AS count
       FROM leave_requests lr JOIN users u ON lr.faculty_id = u.id
       WHERE 1=1 ${clause}
       GROUP BY lr.leave_type ORDER BY count DESC`,
      params
    );

    res.json({ success: true, data: { monthly, byType } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load leave trends.' });
  }
};

// GET /api/analytics/faculty-workload
const getFacultyWorkload = async (req, res) => {
  try {
    const { clause, params } = getDeptParams(req.user);

    const [workload] = await pool.execute(
      `SELECT u.id, u.name, u.employee_id, d.name AS department_name,
              COUNT(DISTINCT t.id) AS regular_lectures_per_week,
              COALESCE(SUM(wl.substitution_count), 0) AS total_substitutions,
              COALESCE(lr_count.total, 0) AS total_leaves_taken
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN timetable t ON u.id = t.faculty_id AND t.is_active = 1
       LEFT JOIN workload_logs wl ON u.id = wl.faculty_id
       LEFT JOIN (
         SELECT faculty_id, COUNT(*) AS total FROM leave_requests
         WHERE status='approved' GROUP BY faculty_id
       ) lr_count ON u.id = lr_count.faculty_id
       WHERE u.role = 'faculty' AND u.is_active = 1 ${clause}
       GROUP BY u.id, d.name, lr_count.total
       ORDER BY total_substitutions DESC`,
      params
    );

    res.json({ success: true, data: workload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load faculty workload.' });
  }
};

// GET /api/analytics/department-stats
const getDepartmentStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(
      `SELECT d.id, d.name, d.code,
              COUNT(DISTINCT u.id) AS faculty_count,
              COUNT(DISTINCT lr.id) AS total_leaves,
              SUM(CASE WHEN lr.status='approved' THEN 1 ELSE 0 END) AS approved_leaves,
              SUM(CASE WHEN lr.status='pending' THEN 1 ELSE 0 END) AS pending_leaves,
              COUNT(DISTINCT lr2.id) AS total_reassignments
       FROM departments d
       LEFT JOIN users u ON d.id = u.department_id AND u.role = 'faculty'
       LEFT JOIN leave_requests lr ON u.id = lr.faculty_id
       LEFT JOIN lecture_reassignments lr2 ON u.id = lr2.original_faculty_id
       GROUP BY d.id, d.name, d.code
       ORDER BY d.name`
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load department stats.' });
  }
};

// GET /api/analytics/faculty-leave-counts
const getFacultyLeaveCounts = async (req, res) => {
  try {
    const { clause, params } = getDeptParams(req.user);

    const [data] = await pool.execute(
      `SELECT u.id, u.name, u.employee_id, d.name AS department_name,
              COUNT(lr.id) AS total_leaves,
              SUM(CASE WHEN lr.status='approved' THEN 1 ELSE 0 END) AS approved,
              SUM(CASE WHEN lr.status='rejected' THEN 1 ELSE 0 END) AS rejected,
              SUM(CASE WHEN lr.status='pending' THEN 1 ELSE 0 END) AS pending
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN leave_requests lr ON u.id = lr.faculty_id
       WHERE u.role='faculty' AND u.is_active=1 ${clause}
       GROUP BY u.id, d.name
       ORDER BY total_leaves DESC`,
      params
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load faculty leave counts.' });
  }
};

// GET /api/analytics/substitution-patterns
const getSubstitutionPatterns = async (req, res) => {
  try {
    const origClause = req.user.role === 'hod' && req.user.department_id
      ? 'AND orig.department_id = ?' : '';
    const origParams = req.user.role === 'hod' && req.user.department_id
      ? [req.user.department_id] : [];

    const [mostSubstituted] = await pool.execute(
      `SELECT u.id, u.name, u.employee_id, d.name AS department_name,
              COUNT(lr2.id) AS times_substituted
       FROM users u
       JOIN departments d ON u.department_id = d.id
       JOIN lecture_reassignments lr2 ON u.id = lr2.substitute_faculty_id
       JOIN users orig ON lr2.original_faculty_id = orig.id
       WHERE 1=1 ${origClause}
       GROUP BY u.id, d.name
       ORDER BY times_substituted DESC LIMIT 10`,
      origParams
    );

    const [[coverageRate]] = await pool.execute(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN substitute_faculty_id IS NOT NULL THEN 1 ELSE 0 END) AS covered,
        ROUND(
          SUM(CASE WHEN substitute_faculty_id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0),
          2
        ) AS coverage_percent
       FROM lecture_reassignments lr2
       JOIN users orig ON lr2.original_faculty_id = orig.id
       WHERE 1=1 ${origClause}`,
      origParams
    );

    const [bySubject] = await pool.execute(
      `SELECT s.name AS subject_name, COUNT(lr2.id) AS reassignment_count
       FROM lecture_reassignments lr2
       JOIN subjects s ON lr2.subject_id = s.id
       JOIN users orig ON lr2.original_faculty_id = orig.id
       WHERE 1=1 ${origClause}
       GROUP BY s.id, s.name
       ORDER BY reassignment_count DESC LIMIT 10`,
      origParams
    );

    res.json({ success: true, data: { mostSubstituted, coverageRate, bySubject } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load substitution patterns.' });
  }
};

module.exports = {
  getOverview, getLeaveTrends, getFacultyWorkload,
  getDepartmentStats, getFacultyLeaveCounts, getSubstitutionPatterns
};
