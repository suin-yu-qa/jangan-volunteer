import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import VolunteerPlan from './pages/VolunteerPlan';
import Notice from './pages/Notice';
import NoticeDetail from './pages/NoticeDetail';
import Settings from './pages/Settings';
import Timeline from './pages/Timeline';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminScheduleForm from './pages/admin/AdminScheduleForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRegister from './pages/admin/AdminRegister';
import AdminNotices from './pages/admin/AdminNotices';
import AdminNoticeForm from './pages/admin/AdminNoticeForm';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/volunteer-plan"
          element={
            <ProtectedRoute>
              <VolunteerPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notice"
          element={
            <ProtectedRoute>
              <Notice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notice/:id"
          element={
            <ProtectedRoute>
              <NoticeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <ProtectedRoute>
              <Timeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/schedules"
          element={
            <AdminRoute>
              <AdminSchedules />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/schedules/new"
          element={
            <AdminRoute>
              <AdminScheduleForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/schedules/:id/edit"
          element={
            <AdminRoute>
              <AdminScheduleForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/register"
          element={
            <AdminRoute>
              <AdminRegister />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notices"
          element={
            <AdminRoute>
              <AdminNotices />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notices/new"
          element={
            <AdminRoute>
              <AdminNoticeForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notices/:id/edit"
          element={
            <AdminRoute>
              <AdminNoticeForm />
            </AdminRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
