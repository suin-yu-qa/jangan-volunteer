import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// User Pages
import HomePage from '@/pages/user/HomePage'
import ServiceSelectPage from '@/pages/user/ServiceSelectPage'
import CalendarPage from '@/pages/user/CalendarPage'
import NoticePage from '@/pages/user/NoticePage'

// Admin Pages
import AdminLoginPage from '@/pages/admin/LoginPage'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminSchedulePage from '@/pages/admin/ScheduleManagePage'
import AdminUserManagePage from '@/pages/admin/UserManagePage'
import AdminNoticeManagePage from '@/pages/admin/NoticeManagePage'
import AuthCallbackPage from '@/pages/admin/AuthCallbackPage'

// Context
import { UserProvider } from '@/context/UserContext'
import { AdminProvider } from '@/context/AdminContext'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AdminProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* 사용자 라우트 */}
              <Route path="/" element={<HomePage />} />
              <Route path="/select" element={<ServiceSelectPage />} />
              <Route path="/calendar/:serviceType" element={<CalendarPage />} />
              <Route path="/notices" element={<NoticePage />} />

              {/* 관리자 라우트 */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/schedule" element={<AdminSchedulePage />} />
              <Route path="/admin/users" element={<AdminUserManagePage />} />
              <Route path="/admin/notices" element={<AdminNoticeManagePage />} />

              {/* 인증 콜백 */}
              <Route path="/auth" element={<AuthCallbackPage />} />

              {/* 기본 리다이렉트 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AdminProvider>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
