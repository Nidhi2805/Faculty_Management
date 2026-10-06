import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDepts = async () => {
    setLoading(true);
    try { const r = await adminAPI.getDepartments(); setDepartments(r.data.data || []); }
    catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDepts(); }, []);

  const openCreate = () => { setForm({ name: '', code: '' }); setEditId(null); setModal(true); };
  const openEdit = (d) => { setForm({ name: d.name, code: d.code }); setEditId(d.id); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code are required'); return; }
    setSaving(true);
    try {
      if (editId) { await adminAPI.updateDepartment(editId, form); toast.success('Department updated!'); }
      else { await adminAPI.createDepartment(form); toast.success('Department created!'); }
      setModal(null); fetchDepts();
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? Faculty assigned to it will lose their department.')) return;
    try { await adminAPI.deleteDepartment(id); toast.success('Department deleted'); fetchDepts(); }
    catch (err) { toast.error(err.message || 'Cannot delete department'); }
  };

  return (
    <Layout title="Department Management">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Departments</h1><p>Manage academic departments</p></div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Department</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div>
          : departments.map(d => (
            <div className="card" key={d.id}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>{d.name}</div>
                    <span className="badge badge-info" style={{ marginTop: 4 }}>{d.code}</span>
                  </div>
                  <div style={{ fontSize: 32 }}>🏛️</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14 }}>
                  👥 {d.faculty_count || 0} faculty members
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Department' : 'Add Department'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Department Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Computer Science" /></div>
              <div className="form-group"><label className="form-label">Code *</label>
                <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', department_id: '', semester: '', credits: 3 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const params = deptFilter ? { department_id: deptFilter } : {};
      const [sRes, dRes] = await Promise.all([adminAPI.getSubjects(params), adminAPI.getDepartments()]);
      setSubjects(sRes.data.data || []); setDepartments(dRes.data.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadSubjects(); }, [deptFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setForm({ name: '', code: '', department_id: '', semester: '', credits: 3 }); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ name: s.name, code: s.code, department_id: s.department_id || '', semester: s.semester || '', credits: s.credits || 3 }); setEditId(s.id); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error('Name and code required'); return; }
    setSaving(true);
    try {
      if (editId) { await adminAPI.updateSubject(editId, form); toast.success('Subject updated!'); }
      else { await adminAPI.createSubject(form); toast.success('Subject created!'); }
      setModal(null); fetch();
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await adminAPI.deleteSubject(id); toast.success('Subject deleted'); loadSubjects(); }
    catch (err) { toast.error(err.message || 'Cannot delete'); }
  };

  return (
    <Layout title="Subject Management">
      <div className="page-header">
        <div className="page-header-row">
          <div><h1>Subjects</h1><p>Manage all academic subjects</p></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="form-control" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Subject</button>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-spinner"><div className="spinner" /></div>
          : subjects.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📚</div><h3>No subjects found</h3></div>
          : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Semester</th><th>Credits</th><th>Actions</th></tr></thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id}>
                      <td><span className="badge badge-gray">{s.code}</span></td>
                      <td><strong>{s.name}</strong></td>
                      <td><span className="badge badge-purple">{s.department_name || '—'}</span></td>
                      <td>{s.semester ? `Sem ${s.semester}` : '—'}</td>
                      <td><span className="badge badge-info">{s.credits} credits</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Subject' : 'Add Subject'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Subject Name *</label>
                <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Data Structures" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Code *</label>
                  <input className="form-control" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="CS301" /></div>
                <div className="form-group"><label className="form-label">Credits</label>
                  <input type="number" className="form-control" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} min={1} max={6} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Department</label>
                  <select className="form-control" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Semester</label>
                  <select className="form-control" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '⏳...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
