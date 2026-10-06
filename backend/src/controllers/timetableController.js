const { pool } = require('../config/database');

// GET /api/timetable - view timetable (role-based)
const getTimetable = async (req, res) => {
  try {
    const { faculty_id, department_id, day } = req.query;
    let whereClause = 't.is_active = 1';
    const params = [];

    if (req.user.role === 'faculty') {
      whereClause += ' AND t.faculty_id = ?';
      params.push(req.user.id);
    } else {
      if (faculty_id) { whereClause += ' AND t.faculty_id = ?'; params.push(faculty_id); }
      if (department_id) { whereClause += ' AND t.department_id = ?'; params.push(department_id); }
      else if (req.user.role === 'hod') { whereClause += ' AND t.department_id = ?'; params.push(req.user.department_id); }
    }
    if (day) { whereClause += ' AND t.day_of_week = ?'; params.push(day); }

    const [rows] = await pool.execute(
      `SELECT t.*, u.name AS faculty_name, u.employee_id, s.name AS subject_name, s.code AS subject_code,
              d.name AS department_name
       FROM timetable t
       JOIN users u ON t.faculty_id = u.id
       JOIN subjects s ON t.subject_id = s.id
       JOIN departments d ON t.department_id = d.id
       WHERE ${whereClause}
       ORDER BY FIELD(t.day_of_week,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time`,
      params
    );

    // Group by day
    const grouped = {};
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    days.forEach(d => { grouped[d] = []; });
    rows.forEach(r => {
      if (grouped[r.day_of_week]) grouped[r.day_of_week].push(r);
    });

    res.json({ success: true, data: rows, grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/timetable - create slot (admin only)
const createTimetableSlot = async (req, res) => {
  try {
    const { faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester, academic_year } = req.body;

    // Conflict check
    const [conflicts] = await pool.execute(
      `SELECT id FROM timetable WHERE faculty_id = ? AND day_of_week = ? AND is_active = 1
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [faculty_id, day_of_week, start_time, end_time]
    );
    if (conflicts.length) {
      return res.status(409).json({ success: false, message: 'Timetable conflict: faculty already has a class at this time.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO timetable (faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester, academic_year || '2024-25']
    );

    res.status(201).json({ success: true, message: 'Timetable slot created.', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/timetable/:id
const updateTimetableSlot = async (req, res) => {
  try {
    const { faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester } = req.body;
    const id = req.params.id;

    const [existing] = await pool.execute('SELECT id FROM timetable WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Timetable slot not found.' });

    // Conflict check (exclude current slot)
    const [conflicts] = await pool.execute(
      `SELECT id FROM timetable WHERE faculty_id = ? AND day_of_week = ? AND is_active = 1 AND id != ?
       AND NOT (end_time <= ? OR start_time >= ?)`,
      [faculty_id, day_of_week, id, start_time, end_time]
    );
    if (conflicts.length) {
      return res.status(409).json({ success: false, message: 'Timetable conflict detected.' });
    }

    await pool.execute(
      `UPDATE timetable SET faculty_id=?, subject_id=?, department_id=?, day_of_week=?,
       start_time=?, end_time=?, room_number=?, semester=? WHERE id=?`,
      [faculty_id, subject_id, department_id, day_of_week, start_time, end_time, room_number, semester, id]
    );
    res.json({ success: true, message: 'Timetable slot updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/timetable/:id
const deleteTimetableSlot = async (req, res) => {
  try {
    await pool.execute('UPDATE timetable SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Timetable slot deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTimetable, createTimetableSlot, updateTimetableSlot, deleteTimetableSlot };
