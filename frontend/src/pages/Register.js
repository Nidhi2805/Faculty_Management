import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employee_id: '', name: '', email: '', password: '', confirm_password: '',
    role: 'faculty', department_id: '', phone: '', designation: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    adminAPI.getDepartments()
      .then(r => setDepartments(r.data.data || []))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.employee_id.trim()) e.employee_id = 'Employee ID is required';
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    if (!form.department_id) e.department_id = 'Please select a department';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      // Register via auth API
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast.success('Registration successful! Logging you in...');
      await login(form.email, form.password);

      const role = data.data.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'hod') navigate('/hod/dashboard');
      else navigate('/faculty/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 28, color: 'white' }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Create Account</h1>
          <p style={{ opacity: 0.85, fontSize: 14 }}>Faculty Leave Management System</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee ID *</label>
                <input className={`form-control ${errors.employee_id ? 'error' : ''}`}
                  placeholder="FAC008" value={form.employee_id}
                  onChange={e => setForm({ ...form, employee_id: e.target.value })} />
                {errors.employee_id && <p className="form-error">{errors.employee_id}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="form-control" value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className={`form-control ${errors.name ? 'error' : ''}`}
                placeholder="Prof. John Doe" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="john.doe@college.edu" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input type="password" className={`form-control ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Re-enter password" value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
                {errors.confirm_password && <p className="form-error">{errors.confirm_password}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className={`form-control ${errors.department_id ? 'error' : ''}`}
                value={form.department_id}
                onChange={e => setForm({ ...form, department_id: e.target.value })}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {errors.department_id && <p className="form-error">{errors.department_id}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="9000000000"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-control" placeholder="Assistant Professor"
                  value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg"
              disabled={loading} style={{ marginTop: 8 }}>
              {loading ? '⏳ Creating account...' : '→ Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-500)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
