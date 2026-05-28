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
 *
 * 전역 컨텍스트:
 * - UserProvider: 사용자 인증 상태 관리
 * - AdminProvider: 관리자 인증 상태 관리
 * ============================================================================
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// User Pages — 즉시 로드
import HomePage from '@/pages/user/HomePage'
import ServiceSelectPage from '@/pages/user/ServiceSelectPage'
import CalendarPage from '@/pages/user/CalendarPage'
import NoticePage from '@/pages/user/NoticePage'

// Admin Pages — 지연 로드 (xlsx 등 무거운 의존성 분리)
const AdminLoginPage = lazy(() => import('@/pages/admin/LoginPage'))
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const AdminSchedulePage = lazy(() => import('@/pages/admin/ScheduleManagePage'))
const AdminUserManagePage = lazy(() => import('@/pages/admin/UserManagePage'))
const AdminNoticeManagePage = lazy(() => import('@/pages/admin/NoticeManagePage'))
const AuthCallbackPage = lazy(() => import('@/pages/admin/AuthCallbackPage'))

// Context
import { UserProvider } from '@/context/UserContext'
import { AdminProvider } from '@/context/AdminContext'

// 접속 로그
import AccessLogger from '@/components/AccessLogger'

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AdminProvider>
          <div className="min-h-screen bg-gray-50">
            <AccessLogger />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* 사용자 라우트 */}
                <Route path="/" element={<HomePage />} />
                <Route path="/select" element={<ServiceSelectPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
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
            </Suspense>
          </div>
        </AdminProvider>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
