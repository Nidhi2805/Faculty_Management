const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ─── FACULTY / USER MANAGEMENT ───────────────────────────────────────────────

const getAllFaculty = async (req, res) => {
  try {
    const { department_id, role, search } = req.query;
    let where = '1=1';
    const params = [];

    if (department_id) { where += ' AND u.department_id = ?'; params.push(department_id); }
    if (role) { where += ' AND u.role = ?'; params.push(role); }
    else { where += ' AND u.role != "admin"'; }
    if (search) { where += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.employee_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [rows] = await pool.execute(
      `SELECT u.id, u.employee_id, u.name, u.email, u.role, u.phone, u.designation, u.is_active,
              d.name AS department_name, d.code AS department_code,
              (SELECT COUNT(*) FROM leave_requests WHERE faculty_id = u.id) AS total_leaves,
              (SELECT COUNT(*) FROM leave_requests WHERE faculty_id = u.id AND status='approved') AS approved_leaves
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE ${where} ORDER BY u.name`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.employee_id, u.name, u.email, u.role, u.phone, u.designation, u.is_active,
              d.name AS department_name, d.id AS department_id
       FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const [subjects] = await pool.execute(
      `SELECT s.id, s.name, s.code, fs.is_primary FROM faculty_subjects fs
       JOIN subjects s ON fs.subject_id = s.id WHERE fs.faculty_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], subjects } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { employee_id, name, email, password, role, department_id, phone, designation } = req.body;
    const [exists] = await pool.execute('SELECT id FROM users WHERE email=? OR employee_id=?', [email, employee_id]);
    if (exists.length) return res.status(409).json({ success: false, message: 'Email or Employee ID already exists.' });

    const hashed = await bcrypt.hash(password || 'Password@123', 10);
    const [result] = await pool.execute(
      'INSERT INTO users (employee_id,name,email,password,role,department_id,phone,designation) VALUES(?,?,?,?,?,?,?,?)',
      [employee_id, name, email, hashed, role || 'faculty', department_id || null, phone || null, designation || null]
    );
    res.status(201).json({ success: true, message: 'User created successfully.', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { name, email, role, department_id, phone, designation, is_active } = req.body;
    const id = req.params.id;
    await pool.execute(
      'UPDATE users SET name=?,email=?,role=?,department_id=?,phone=?,designation=?,is_active=? WHERE id=?',
      [name, email, role, department_id || null, phone || null, designation || null, is_active !== undefined ? is_active : 1, id]
    );
    res.json({ success: true, message: 'User updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    const hashed = await bcrypt.hash(new_password || 'Password@123', 10);
    await pool.execute('UPDATE users SET password=? WHERE id=?', [hashed, req.params.id]);
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── FACULTY SUBJECT MAPPING ──────────────────────────────────────────────────

const updateFacultySubjects = async (req, res) => {
  try {
    const { subjects } = req.body; // [{subject_id, is_primary}]
    const facultyId = req.params.id;

    await pool.execute('DELETE FROM faculty_subjects WHERE faculty_id = ?', [facultyId]);
    for (const s of subjects) {
      await pool.execute('INSERT INTO faculty_subjects (faculty_id,subject_id,is_primary) VALUES(?,?,?)',
        [facultyId, s.subject_id, s.is_primary || false]);
    }
    res.json({ success: true, message: 'Faculty subjects updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DEPARTMENT MANAGEMENT ────────────────────────────────────────────────────

const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT d.*, COUNT(DISTINCT u.id) AS faculty_count
       FROM departments d LEFT JOIN users u ON d.id = u.department_id AND u.role='faculty'
       GROUP BY d.id ORDER BY d.name`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const [result] = await pool.execute('INSERT INTO departments (name,code) VALUES(?,?)', [name, code]);
    res.status(201).json({ success: true, message: 'Department created.', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    await pool.execute('UPDATE departments SET name=?,code=? WHERE id=?', [name, code, req.params.id]);
    res.json({ success: true, message: 'Department updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await pool.execute('DELETE FROM departments WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SUBJECT MANAGEMENT ───────────────────────────────────────────────────────

const getSubjects = async (req, res) => {
  try {
    const { department_id } = req.query;
    let where = '1=1';
    const params = [];
    if (department_id) { where += ' AND s.department_id=?'; params.push(department_id); }

    const [rows] = await pool.execute(
      `SELECT s.*, d.name AS department_name FROM subjects s
       LEFT JOIN departments d ON s.department_id = d.id WHERE ${where} ORDER BY s.name`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code, department_id, semester, credits } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO subjects (name,code,department_id,semester,credits) VALUES(?,?,?,?,?)',
      [name, code, department_id || null, semester || null, credits || 3]
    );
    res.status(201).json({ success: true, message: 'Subject created.', data: { id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { name, code, department_id, semester, credits } = req.body;
    await pool.execute(
      'UPDATE subjects SET name=?,code=?,department_id=?,semester=?,credits=? WHERE id=?',
      [name, code, department_id || null, semester || null, credits || 3, req.params.id]
    );
    res.json({ success: true, message: 'Subject updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    await pool.execute('DELETE FROM subjects WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Subject deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllFaculty, getFacultyById, createFaculty, updateFaculty, resetPassword,
  updateFacultySubjects,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSubjects, createSubject, updateSubject, deleteSubject
};
