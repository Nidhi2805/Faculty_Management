import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editData, setEditData] = useState(null);
  const [form, setForm] = useState({ employee_id: '', name: '', email: '', password: '', role: 'faculty', department_id: '', phone: '', designation: '' });
  const [saving, setSaving] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (deptFilter) params.department_id = deptFilter;
      const [fRes, dRes] = await Promise.all([adminAPI.getFaculty(params), adminAPI.getDepartments()]);
      setFaculty(fRes.data.data || []);
      setDepartments(dRes.data.data || []);
    } catch { toast.error('Failed to load faculty'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchFaculty(); }, [search, deptFilter]);

  const openCreate = () => {
    setForm({ employee_id: '', name: '', email: '', password: 'Password@123', role: 'faculty', department_id: '', phone: '', designation: '' });
    setEditData(null);
    setModal('create');
  };

  const openEdit = (f) => {
    setForm({ employee_id: f.employee_id, name: f.name, email: f.email, password: '', role: f.role, department_id: f.department_id || '', phone: f.phone || '', designation: f.designation || '' });
    setEditData(f);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.employee_id) { toast.error('Name, email, and Employee ID are required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminAPI.createFaculty(form);
        toast.success('Faculty created successfully!');
      } else {
        await adminAPI.updateFaculty(editData.id, form);
        toast.success('Faculty updated successfully!');
      }
      setModal(null);
      fetchFaculty();
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async (f) => {
    try {
      await adminAPI.updateFaculty(f.id, { ...f, department_id: f.department_id, is_active: !f.is_active });
      toast.success(`User ${f.is_active ? 'deactivated' : 'activated'}`);
      fetchFaculty();
    } catch (err) { toast.error(err.message); }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Reset password to Password@123?')) return;
    try {
      await adminAPI.resetPassword(id, { new_password: 'Password@123' });
      toast.success('Password reset to Password@123');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <Layout title="Faculty Management">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Faculty Management</h1><p>Manage all faculty, HODs, and their profiles</p></div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Faculty</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Users ({faculty.length})</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="form-control" placeholder="🔍 Search..." style={{ width: 200 }} value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-control" style={{ width: 160 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : faculty.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No faculty found</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Designation</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f.id}>
                    <td><span className="badge badge-gray">{f.employee_id}</span></td>
                    <td><strong>{f.name}</strong></td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{f.email}</td>
                    <td>
                      <span className={`badge ${f.role === 'admin' ? 'badge-danger' : f.role === 'hod' ? 'badge-purple' : 'badge-info'}`} style={{ textTransform: 'capitalize' }}>{f.role}</span>
                    </td>
                    <td>{f.department_name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{f.designation || '—'}</td>
                    <td>
                      <span className={`badge ${f.is_active ? 'badge-success' : 'badge-danger'}`}>{f.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>Edit</button>
                        <button className={`btn btn-sm ${f.is_active ? 'btn-warning' : 'btn-success'}`} onClick={() => handleToggleActive(f)}>
                          {f.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleResetPassword(f.id)} title="Reset password">🔑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'create' ? '➕ Add Faculty' : '✏️ Edit Faculty'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Employee ID *</label>
                  <input className="form-control" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} placeholder="FAC001" disabled={modal === 'edit'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="faculty">Faculty</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prof. John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john.doe@college.edu" />
              </div>
              {modal === 'create' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Default: Password@123" />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9000000000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-control" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="Assistant Professor" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : modal === 'create' ? 'Create Faculty' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FacultyManagement;
