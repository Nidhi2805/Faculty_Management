const { pool } = require('../config/database');

// GET /api/faculty/dashboard-stats — faculty's own stats
const getDashboardStats = async (req, res) => {
  try {
    const facultyId = req.user.id;

    const [[leaveStats]] = await pool.execute(`
      SELECT
        COUNT(*) AS total_leaves,
        SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected,
        COALESCE(SUM(CASE WHEN status='approved' THEN total_days ELSE 0 END), 0) AS total_days_taken
      FROM leave_requests WHERE faculty_id = ?`, [facultyId]);

    const [timetableSlots] = await pool.execute(
      'SELECT COUNT(*) as weekly_lectures FROM timetable WHERE faculty_id = ? AND is_active = 1',
      [facultyId]
    );

    const [substitutions] = await pool.execute(
      'SELECT COUNT(*) as total_substitutions FROM lecture_reassignments WHERE substitute_faculty_id = ?',
      [facultyId]
    );

    const [upcomingSubs] = await pool.execute(`
      SELECT lr2.*, s.name AS subject_name, u.name AS original_faculty_name
      FROM lecture_reassignments lr2
      JOIN subjects s ON lr2.subject_id = s.id
      JOIN users u ON lr2.original_faculty_id = u.id
      WHERE lr2.substitute_faculty_id = ? AND lr2.reassignment_date >= CURDATE()
      ORDER BY lr2.reassignment_date ASC LIMIT 5`, [facultyId]);

    const [recentLeaves] = await pool.execute(`
      SELECT id, leave_type, start_date, end_date, total_days, status, created_at
      FROM leave_requests WHERE faculty_id = ?
      ORDER BY created_at DESC LIMIT 5`, [facultyId]);

    res.json({
      success: true,
      data: {
        leave_stats: leaveStats,
        weekly_lectures: timetableSlots[0].weekly_lectures,
        total_substitutions: substitutions[0].total_substitutions,
        upcoming_substitutions: upcomingSubs,
        recent_leaves: recentLeaves,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/faculty/profile — current faculty profile with subjects
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.employee_id, u.name, u.email, u.phone, u.designation, u.role,
             d.name AS department_name, d.code AS department_code
      FROM users u LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?`, [req.user.id]);

    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found.' });

    const [subjects] = await pool.execute(`
      SELECT s.id, s.name, s.code, s.semester, s.credits, fs.is_primary
      FROM faculty_subjects fs JOIN subjects s ON fs.subject_id = s.id
      WHERE fs.faculty_id = ?`, [req.user.id]);

    res.json({ success: true, data: { ...rows[0], subjects } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getProfile };
