import React, { useState, useEffect } from 'react';
import Layout from '../../components/common/Layout';
import { timetableAPI, adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AdminTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [form, setForm] = useState({
    faculty_id: '', subject_id: '', department_id: '',
    day_of_week: 'Monday', start_time: '09:00', end_time: '10:00',
    room_number: '', semester: '', academic_year: '2024-25'
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFaculty) params.faculty_id = filterFaculty;
      if (filterDay) params.day = filterDay;
      const [ttRes, fRes, sRes, dRes] = await Promise.all([
        timetableAPI.getAll(params),
        adminAPI.getFaculty({}),
        adminAPI.getSubjects({}),
        adminAPI.getDepartments(),
      ]);
      setTimetable(ttRes.data.data || []);
      setFaculty(fRes.data.data || []);
      setSubjects(sRes.data.data || []);
      setDepartments(dRes.data.data || []);
    } catch { toast.error('Failed to load timetable data'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, [filterFaculty, filterDay]);

  const openCreate = () => {
    setEditData(null);
    setForm({ faculty_id: '', subject_id: '', department_id: '', day_of_week: 'Monday', start_time: '09:00', end_time: '10:00', room_number: '', semester: '', academic_year: '2024-25' });
    setModal(true);
  };

  const openEdit = (slot) => {
    setEditData(slot);
    setForm({
      faculty_id: slot.faculty_id, subject_id: slot.subject_id, department_id: slot.department_id,
      day_of_week: slot.day_of_week, start_time: slot.start_time?.slice(0, 5),
      end_time: slot.end_time?.slice(0, 5), room_number: slot.room_number || '',
      semester: slot.semester || '', academic_year: slot.academic_year || '2024-25'
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.faculty_id || !form.subject_id || !form.department_id || !form.start_time || !form.end_time) {
      toast.error('Faculty, Subject, Department, and Times are required');
      return;
    }
    if (form.start_time >= form.end_time) {
      toast.error('End time must be after start time');
      return;
    }
    setSaving(true);
    try {
      if (editData) {
        await timetableAPI.update(editData.id, form);
        toast.success('Timetable slot updated!');
      } else {
        await timetableAPI.create(form);
        toast.success('Timetable slot created!');
      }
      setModal(false);
      loadAll();
    } catch (err) { toast.error(err.message || 'Save failed — check for conflicts'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this timetable slot?')) return;
    try {
      await timetableAPI.delete(id);
      toast.success('Slot removed');
      loadAll();
    } catch (err) { toast.error(err.message); }
  };

  const autoSetDept = (facultyId) => {
    const f = faculty.find(f => f.id === parseInt(facultyId));
    if (f?.department_id) setForm(prev => ({ ...prev, faculty_id: facultyId, department_id: String(f.department_id) }));
    else setForm(prev => ({ ...prev, faculty_id: facultyId }));
  };

  // Group by day for display
  const byDay = {};
  DAYS.forEach(d => { byDay[d] = []; });
  timetable.forEach(t => { if (byDay[t.day_of_week]) byDay[t.day_of_week].push(t); });

  return (
    <Layout title="Timetable Management">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Timetable Management</h1>
            <p>Create and manage faculty lecture schedules</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add Slot</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)' }}>Filter:</span>
            <select className="form-control" style={{ width: 200 }} value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
              <option value="">All Faculty</option>
              {faculty.filter(f => f.role === 'faculty').map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select className="form-control" style={{ width: 150 }} value={filterDay} onChange={e => setFilterDay(e.target.value)}>
              <option value="">All Days</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(filterFaculty || filterDay) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterFaculty(''); setFilterDay(''); }}>✕ Clear</button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gray-500)' }}>{timetable.length} slots</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {DAYS.filter(d => !filterDay || d === filterDay).map(day => {
            const slots = byDay[day] || [];
            if (slots.length === 0 && filterDay !== day) return null;
            return (
              <div className="card" key={day}>
                <div className="card-header">
                  <h3 className="card-title">📅 {day}</h3>
                  <span className="badge badge-info">{slots.length} slots</span>
                </div>
                {slots.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--gray-400)', fontSize: 13, textAlign: 'center' }}>No slots scheduled</div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Time</th><th>Faculty</th><th>Subject</th><th>Department</th><th>Room</th><th>Semester</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {slots.sort((a, b) => a.start_time > b.start_time ? 1 : -1).map(slot => (
                          <tr key={slot.id}>
                            <td>
                              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{slot.faculty_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{slot.employee_id}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{slot.subject_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{slot.subject_code}</div>
                            </td>
                            <td><span className="badge badge-purple">{slot.department_name}</span></td>
                            <td>{slot.room_number || '—'}</td>
                            <td>{slot.semester ? `Sem ${slot.semester}` : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(slot)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(slot.id)}>Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editData ? '✏️ Edit Slot' : '➕ Add Timetable Slot'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                🔍 The system will automatically detect conflicts with existing slots for the selected faculty.
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select className="form-control" value={form.faculty_id} onChange={e => autoSetDept(e.target.value)}>
                    <option value="">Select Faculty</option>
                    {faculty.filter(f => f.role === 'faculty' || f.role === 'hod').map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select className="form-control" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-control" value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Day *</label>
                  <select className="form-control" value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input type="time" className="form-control" value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input type="time" className="form-control" value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input className="form-control" value={form.room_number}
                    onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="CS-101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-control" value={form.semester}
                    onChange={e => setForm({ ...form, semester: e.target.value })}>
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>Semester {n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : editData ? 'Update Slot' : 'Create Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminTimetable;
