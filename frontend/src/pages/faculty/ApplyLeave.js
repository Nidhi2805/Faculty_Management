import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { leaveAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ApplyLeave = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const totalDays = () => {
    if (!form.start_date || !form.end_date) return 0;
    const diff = (new Date(form.end_date) - new Date(form.start_date)) / 86400000 + 1;
    return diff > 0 ? diff : 0;
  };

  const validate = () => {
    const e = {};
    if (!form.start_date) e.start_date = 'Start date required';
    if (!form.end_date) e.end_date = 'End date required';
    else if (form.end_date < form.start_date) e.end_date = 'End date must be after start date';
    if (!form.reason || form.reason.trim().length < 5) e.reason = 'Reason must be at least 5 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await leaveAPI.apply(form);
      toast.success('Leave request submitted successfully!');
      navigate('/faculty/my-leaves');
    } catch (err) {
      toast.error(err.message || 'Failed to submit leave request');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Apply for Leave">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Apply for Leave</h1>
            <p>Submit your leave request for HOD approval</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/faculty/my-leaves')}>← Back</button>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">📋 Leave Request Form</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select className="form-control" value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}>
                  {['casual', 'sick', 'earned', 'maternity', 'emergency', 'other'].map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Leave</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className={`form-control ${errors.start_date ? 'error' : ''}`}
                    value={form.start_date} min={today}
                    onChange={e => setForm({ ...form, start_date: e.target.value })} />
                  {errors.start_date && <p className="form-error">{errors.start_date}</p>}
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className={`form-control ${errors.end_date ? 'error' : ''}`}
                    value={form.end_date} min={form.start_date || today}
                    onChange={e => setForm({ ...form, end_date: e.target.value })} />
                  {errors.end_date && <p className="form-error">{errors.end_date}</p>}
                </div>
              </div>

              {totalDays() > 0 && (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  📅 Total leave duration: <strong>{totalDays()} day{totalDays() > 1 ? 's' : ''}</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason *</label>
                <textarea className={`form-control ${errors.reason ? 'error' : ''}`}
                  rows={4} placeholder="Provide a detailed reason for your leave..."
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                {errors.reason && <p className="form-error">{errors.reason}</p>}
                <p className="text-sm text-muted" style={{ marginTop: 4 }}>{form.reason.length} characters</p>
              </div>

              <div className="alert alert-warning">
                ⚠️ Once approved, affected lectures will be <strong>automatically rescheduled</strong> by the system.
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? '⏳ Submitting...' : '📤 Submit Leave Request'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/faculty/my-leaves')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ApplyLeave;
