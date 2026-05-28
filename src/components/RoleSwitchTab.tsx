/**
 * ============================================================================
 * 역할 전환 탭 컴포넌트
 * ============================================================================
 *
 * 관리자 권한이 있는 사용자에게 "봉사 신청"과 "관리자" 화면 간
 * 전환 탭을 표시하는 공통 컴포넌트입니다.
 *
 * 주요 기능:
 * - 관리자 여부 확인 (AdminContext 기반)
 * - 현재 경로에 따른 활성 탭 표시
 * - 봉사 신청 ↔ 관리자 화면 간 전환
 *
 * 사용 위치:
 * - 사용자 페이지: ServiceSelectPage, CalendarPage, NoticePage
 * - 관리자 페이지: DashboardPage, ScheduleManagePage 등
 *
 * Props:
 * - maxWidth: 탭 컨테이너 최대 너비 (사용자: 'max-w-lg', 관리자: 'max-w-4xl')
 * ============================================================================
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'

interface RoleSwitchTabProps {
  /** 탭 컨테이너의 최대 너비 클래스 (기본값: 'max-w-lg') */
  maxWidth?: string
}

export default function RoleSwitchTab({ maxWidth = 'max-w-lg' }: RoleSwitchTabProps) {
  const { admin } = useAdmin()
  const location = useLocation()
  const navigate = useNavigate()

  // 관리자가 아니면 탭을 표시하지 않음
  if (!admin) return null

  // 현재 경로가 관리자 페이지인지 판별
  const isAdminPage = location.pathname.startsWith('/admin')

  return (
    <div className="bg-white border-b border-gray-200">
      <div className={`${maxWidth} mx-auto px-4`}>
        <div className="flex">
          {/* 봉사 신청 탭 - 사용자 화면으로 이동 */}
          <button
            onClick={() => navigate('/select')}
            className={isAdminPage ? 'tab-item' : 'tab-item-active'}
          >
            봉사 신청
          </button>
          {/* 관리자 탭 - 관리자 대시보드로 이동 */}
          <button
            onClick={() => navigate('/admin/dashboard')}
            className={isAdminPage ? 'tab-item-active' : 'tab-item'}
          >
            관리자
          </button>
        </div>
      </div>
    </div>
  )
}
