import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'hod') navigate('/hod/dashboard');
      else navigate('/faculty/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email) => setForm({ email, password: 'Password@123' });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32, color: 'white' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Faculty Leave System</h1>
          <p style={{ opacity: 0.85, fontSize: 14 }}>Academic Workflow Automation Platform</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--gray-900)' }}>Sign In</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" className={`form-control ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className={`form-control ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? '⏳ Signing in...' : '→ Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Demo Login</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '🔑 Admin', email: 'admin@college.edu' },
                { label: '👨‍💼 HOD (CS)', email: 'hod.cs@college.edu' },
                { label: '👩‍🏫 Faculty', email: 'amit.sharma@college.edu' },
              ].map(item => (
                <button key={item.email} className="btn btn-secondary btn-sm" onClick={() => quickLogin(item.email)} style={{ justifyContent: 'flex-start' }}>
                  {item.label} — <span style={{ fontSize: 11, color: 'var(--gray-500)', marginLeft: 4 }}>{item.email}</span>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 8 }}>All demo accounts use: Password@123</p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--gray-500)' }}>
            New faculty member?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
