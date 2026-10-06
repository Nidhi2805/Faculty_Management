import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject({ ...error, message });
  }
);

// AUTH
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// FACULTY
export const facultyAPI = {
  getDashboardStats: () => api.get('/faculty/dashboard-stats'),
  getProfile: () => api.get('/faculty/profile'),
};

// LEAVES
export const leaveAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getById: (id) => api.get(`/leaves/${id}`),
  apply: (data) => api.post('/leaves', data),
  review: (id, data) => api.put(`/leaves/${id}/review`, data),
  cancel: (id) => api.put(`/leaves/${id}/cancel`),
};

// TIMETABLE
export const timetableAPI = {
  getAll: (params) => api.get('/timetable', { params }),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// REASSIGNMENTS
export const reassignmentAPI = {
  getAll: (params) => api.get('/reassignments', { params }),
  getSubstitutionDuties: () => api.get('/reassignments/substitution-duties'),
  getAvailableSubstitutes: (id) => api.get(`/reassignments/available-substitutes/${id}`),
  override: (id, data) => api.put(`/reassignments/${id}/override`, data),
};

// NOTIFICATIONS
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ADMIN
export const adminAPI = {
  getFaculty: (params) => api.get('/admin/faculty', { params }),
  getFacultyById: (id) => api.get(`/admin/faculty/${id}`),
  createFaculty: (data) => api.post('/admin/faculty', data),
  updateFaculty: (id, data) => api.put(`/admin/faculty/${id}`, data),
  resetPassword: (id, data) => api.put(`/admin/faculty/${id}/reset-password`, data),
  updateFacultySubjects: (id, data) => api.put(`/admin/faculty/${id}/subjects`, data),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  getSubjects: (params) => api.get('/admin/subjects', { params }),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),
};

// ANALYTICS
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getLeaveTrends: () => api.get('/analytics/leave-trends'),
  getFacultyWorkload: () => api.get('/analytics/faculty-workload'),
  getDepartmentStats: () => api.get('/analytics/department-stats'),
  getFacultyLeaveCounts: () => api.get('/analytics/faculty-leave-counts'),
  getSubstitutionPatterns: () => api.get('/analytics/substitution-patterns'),
};

export default api;
