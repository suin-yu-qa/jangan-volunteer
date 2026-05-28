/**
 * ============================================================================
 * 관리자 컨텍스트 모듈
 * ============================================================================
 *
 * 이 모듈은 관리자의 인증 상태를 전역으로 관리합니다.
 *
 * 주요 기능:
 * - 관리자 로그인 상태 관리
 * - 관리자 정보 저장 및 조회
 * - 로그아웃 처리
 *
 * 사용 방법:
 * - AdminProvider: App 최상위에서 감싸서 사용
 * - useAdmin(): 하위 컴포넌트에서 관리자 정보 접근
 *
 * 특징:
 * - localStorage 기반 자동 로그인 (브라우저 닫아도 로그인 유지)
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Admin } from '@/types'

const SESSION_KEY = 'jangan_admin'

/**
 * 관리자 컨텍스트 타입 정의
 */
interface AdminContextType {
  admin: Admin | null                    // 현재 로그인된 관리자 정보
  setAdmin: (admin: Admin | null) => void // 관리자 정보 설정 함수
  isLoggedIn: boolean                    // 로그인 여부
  logout: () => void                     // 로그아웃 함수
}

// 관리자 컨텍스트 생성
const AdminContext = createContext<AdminContextType | undefined>(undefined)

/**
 * localStorage에서 관리자 정보 복원 (새로고침 시 유지, 탭/앱 종료 시 삭제)
 */
const getInitialAdmin = (): Admin | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/**
 * 관리자 컨텍스트 프로바이더
 * App 최상위에서 감싸서 전역 상태 제공
 *
 * @param children - 하위 컴포넌트들
 */
export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdminState] = useState<Admin | null>(getInitialAdmin)

  const setAdmin = useCallback((newAdmin: Admin | null) => {
    setAdminState(newAdmin)
    if (newAdmin) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newAdmin))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(() => {
    setAdminState(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <AdminContext.Provider value={{ admin, setAdmin, isLoggedIn: !!admin, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

/**
 * 관리자 컨텍스트 훅
 * 하위 컴포넌트에서 관리자 정보에 접근할 때 사용
 *
 * @returns AdminContextType - 관리자 컨텍스트 값
 * @throws Error - AdminProvider 외부에서 사용 시 에러
 *
 * @example
 * const { admin, isLoggedIn, logout } = useAdmin()
 */
export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
