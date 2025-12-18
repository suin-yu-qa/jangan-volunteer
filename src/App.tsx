/**
 * ============================================================================
 * 메인 애플리케이션 컴포넌트
 * ============================================================================
 *
 * React Router를 사용한 SPA 라우팅 및 전역 컨텍스트 설정을 담당합니다.
 *
 * 라우트 구조:
 *
 * [사용자 라우트]
 * - /              : 홈 페이지 (로그인)
 * - /select        : 봉사 유형 선택
 * - /calendar/:type: 봉사 일정 캘린더
 * - /notices       : 공지사항 목록
 *
 * [관리자 라우트]
 * - /admin          : 관리자 로그인
 * - /admin/dashboard: 대시보드
 * - /admin/schedule : 일정 관리
 * - /admin/users    : 사용자 관리
 * - /admin/notices  : 공지사항 관리
 *
 * 전역 컨텍스트:
 * - UserProvider: 사용자 인증 상태 관리
 * - AdminProvider: 관리자 인증 상태 관리
 * ============================================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// User Pages
import HomePage from '@/pages/user/HomePage'
import ServiceSelectPage from '@/pages/user/ServiceSelectPage'
import CalendarPage from '@/pages/user/CalendarPage'
import NoticePage from '@/pages/user/NoticePage'
import TopicPage from '@/pages/user/TopicPage'

// Admin Pages
import AdminLoginPage from '@/pages/admin/LoginPage'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminSchedulePage from '@/pages/admin/ScheduleManagePage'
import AdminUserManagePage from '@/pages/admin/UserManagePage'
import AdminNoticeManagePage from '@/pages/admin/NoticeManagePage'
import AdminTopicManagePage from '@/pages/admin/TopicManagePage'
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
              <Route path="/topics" element={<TopicPage />} />

              {/* 관리자 라우트 */}
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/schedule" element={<AdminSchedulePage />} />
              <Route path="/admin/users" element={<AdminUserManagePage />} />
              <Route path="/admin/notices" element={<AdminNoticeManagePage />} />
              <Route path="/admin/topics" element={<AdminTopicManagePage />} />

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
