import React, { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { authAPI, facultyAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  // useAuth not needed here
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const meRes = await authAPI.getMe();
        const me = meRes.data.data;
        // Fetch subject expertise for faculty and HOD
        if (me.role !== 'admin') {
          try {
            const subRes = await facultyAPI.getProfile();
            me.subjects = subRes.data.data?.subjects || [];
          } catch (_) {
            me.subjects = [];
          }
        }
        setProfile(me);
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current_password) errs.current_password = 'Current password required';
    if (!pwForm.new_password || pwForm.new_password.length < 6) errs.new_password = 'Min 6 characters';
    if (pwForm.new_password !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;

    setPwLoading(true);
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
      setShowPwForm(false);
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const roleBadgeColor = { admin: 'badge-danger', hod: 'badge-purple', faculty: 'badge-info' };
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) return <Layout title="Profile"><div className="loading-spinner"><div className="spinner" /></div></Layout>;

  return (
    <Layout title="My Profile">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View your account information and settings</p>
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 28, fontWeight: 800, flexShrink: 0
              }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{profile?.name}</h2>
                  <span className={`badge ${roleBadgeColor[profile?.role] || 'badge-gray'}`}
                    style={{ textTransform: 'capitalize', fontSize: 12 }}>{profile?.role}</span>
                </div>
                <p style={{ color: 'var(--gray-500)', margin: '0 0 12px', fontSize: 14 }}>{profile?.designation || 'Faculty Member'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['🏛️ Department', profile?.department_name || '—'],
                    ['🆔 Employee ID', profile?.employee_id],
                    ['📧 Email', profile?.email],
                    ['📞 Phone', profile?.phone || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--gray-400)', marginRight: 6 }}>{label}:</span>
                      <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject Expertise (faculty/hod) */}
        {profile?.role !== 'admin' && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3 className="card-title">📚 Subject Expertise</h3>
              <span className="badge badge-gray">{profile?.subjects?.length || 0} subjects</span>
            </div>
            <div className="card-body">
              {!profile?.subjects?.length ? (
                <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>No subjects assigned. Contact admin to update your subject mapping.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {profile.subjects.map(s => (
                    <div key={s.id} style={{
                      border: `1.5px solid ${s.is_primary ? 'var(--primary)' : 'var(--gray-200)'}`,
                      background: s.is_primary ? 'var(--primary-light)' : 'white',
                      borderRadius: 8, padding: '8px 14px'
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: s.is_primary ? 'var(--primary)' : 'var(--gray-800)' }}>
                        {s.is_primary && '⭐ '}{s.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
                        {s.code} {s.semester ? `• Sem ${s.semester}` : ''} {s.credits ? `• ${s.credits} credits` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12 }}>
                ⭐ Primary subjects are preferred during automatic lecture reassignment scoring.
              </p>
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔑 Security</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPwForm(!showPwForm)}>
              {showPwForm ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {showPwForm && (
            <div className="card-body">
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password *</label>
                  <input type="password" className={`form-control ${pwErrors.current_password ? 'error' : ''}`}
                    value={pwForm.current_password}
                    onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })}
                    placeholder="Enter current password" />
                  {pwErrors.current_password && <p className="form-error">{pwErrors.current_password}</p>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Password *</label>
                    <input type="password" className={`form-control ${pwErrors.new_password ? 'error' : ''}`}
                      value={pwForm.new_password}
                      onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })}
                      placeholder="Min. 6 characters" />
                    {pwErrors.new_password && <p className="form-error">{pwErrors.new_password}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <input type="password" className={`form-control ${pwErrors.confirm ? 'error' : ''}`}
                      value={pwForm.confirm}
                      onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                      placeholder="Re-enter new password" />
                    {pwErrors.confirm && <p className="form-error">{pwErrors.confirm}</p>}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                  {pwLoading ? '⏳ Updating...' : '🔑 Update Password'}
                </button>
              </form>
            </div>
          )}
          {!showPwForm && (
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                Last login: {new Date().toLocaleString()} &nbsp;•&nbsp; Click "Change Password" to update your credentials.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
