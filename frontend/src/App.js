import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ApplyLeave from './pages/faculty/ApplyLeave';
import MyLeaves from './pages/faculty/MyLeaves';
import SubstitutionDuties from './pages/faculty/SubstitutionDuties';

// HOD Pages
import HODDashboard from './pages/hod/HODDashboard';
import LeaveApprovals from './pages/hod/LeaveApprovals';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyManagement from './pages/admin/FacultyManagement';
import { DepartmentManagement, SubjectManagement } from './pages/admin/DeptSubjectManagement';
import AdminTimetable from './pages/admin/AdminTimetable';

// Shared Pages
import TimetablePage from './pages/TimetablePage';
import ReassignmentsPage from './pages/ReassignmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import AllLeaves from './pages/AllLeaves';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';

// Loading spinner
const Spinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
    <div>
      <div className="spinner" style={{ margin: '0 auto 12px' }} />
      <p style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>Loading...</p>
    </div>
  </div>
);

// Role-based route guard
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDefaultPath(user.role)} replace />;
  return children;
};

// Redirect logged-in users to their dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={getDefaultPath(user.role)} replace />;
  return children;
};

const getDefaultPath = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'hod') return '/hod/dashboard';
  return '/faculty/dashboard';
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getDefaultPath(user.role)} replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Shared protected routes (any role) */}
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* ── FACULTY ROUTES ── */}
        <Route path="/faculty/dashboard"
          element={<ProtectedRoute roles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/faculty/apply-leave"
          element={<ProtectedRoute roles={['faculty']}><ApplyLeave /></ProtectedRoute>} />
        <Route path="/faculty/my-leaves"
          element={<ProtectedRoute roles={['faculty']}><MyLeaves /></ProtectedRoute>} />
        <Route path="/faculty/timetable"
          element={<ProtectedRoute roles={['faculty']}><TimetablePage /></ProtectedRoute>} />
        <Route path="/faculty/substitutions"
          element={<ProtectedRoute roles={['faculty']}><SubstitutionDuties /></ProtectedRoute>} />

        {/* ── HOD ROUTES ── */}
        <Route path="/hod/dashboard"
          element={<ProtectedRoute roles={['hod']}><HODDashboard /></ProtectedRoute>} />
        <Route path="/hod/leave-approvals"
          element={<ProtectedRoute roles={['hod']}><LeaveApprovals /></ProtectedRoute>} />
        <Route path="/hod/reassignments"
          element={<ProtectedRoute roles={['hod']}><ReassignmentsPage /></ProtectedRoute>} />
        <Route path="/hod/timetable"
          element={<ProtectedRoute roles={['hod']}><TimetablePage /></ProtectedRoute>} />
        <Route path="/hod/analytics"
          element={<ProtectedRoute roles={['hod']}><AnalyticsDashboard /></ProtectedRoute>} />

        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin/dashboard"
          element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/faculty"
          element={<ProtectedRoute roles={['admin']}><FacultyManagement /></ProtectedRoute>} />
        <Route path="/admin/departments"
          element={<ProtectedRoute roles={['admin']}><DepartmentManagement /></ProtectedRoute>} />
        <Route path="/admin/subjects"
          element={<ProtectedRoute roles={['admin']}><SubjectManagement /></ProtectedRoute>} />
        <Route path="/admin/timetable"
          element={<ProtectedRoute roles={['admin']}><AdminTimetable /></ProtectedRoute>} />
        <Route path="/admin/leaves"
          element={<ProtectedRoute roles={['admin']}><AllLeaves /></ProtectedRoute>} />
        <Route path="/admin/reassignments"
          element={<ProtectedRoute roles={['admin']}><ReassignmentsPage /></ProtectedRoute>} />
        <Route path="/admin/analytics"
          element={<ProtectedRoute roles={['admin']}><AnalyticsDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
