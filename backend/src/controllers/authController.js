const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, employee_id, name, email, password, role, department_id, phone, designation, is_active FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Fetch department
    let department = null;
    if (user.department_id) {
      const [depts] = await pool.execute('SELECT id, name, code FROM departments WHERE id = ?', [user.department_id]);
      if (depts.length) department = depts[0];
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { ...userWithoutPassword, department } },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { employee_id, name, email, password, role = 'faculty', department_id, phone, designation } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? OR employee_id = ?', [email, employee_id]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email or Employee ID already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (employee_id, name, email, password, role, department_id, phone, designation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [employee_id, name, email, hashedPassword, role, department_id || null, phone || null, designation || null]
    );

    const [newUser] = await pool.execute(
      'SELECT id, employee_id, name, email, role, department_id, phone, designation FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = generateToken(newUser[0]);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user: newUser[0] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.employee_id, u.name, u.email, u.role, u.department_id, u.phone, u.designation, u.is_active,
              d.name AS department_name, d.code AS department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const user = rows[0];
    res.json({
      success: true,
      data: {
        ...user,
        department: user.department_id ? { id: user.department_id, name: user.department_name, code: user.department_code } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(current_password, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { login, register, getMe, changePassword };
