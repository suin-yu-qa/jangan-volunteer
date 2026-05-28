/**
 * ============================================================================
 * 사용자 컨텍스트 모듈
 * ============================================================================
 *
 * 이 모듈은 봉사자 사용자의 인증 상태를 전역으로 관리합니다.
 *
 * 주요 기능:
 * - 사용자 로그인 상태 관리
 * - 사용자 정보 저장 및 조회
 * - 로그아웃 처리
 *
 * 사용 방법:
 * - UserProvider: App 최상위에서 감싸서 사용
 * - useUser(): 하위 컴포넌트에서 사용자 정보 접근
 *
 * 특징:
 * - localStorage 기반 자동 로그인 (브라우저 닫아도 로그인 유지)
 * ============================================================================
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { User } from '@/types'

const SESSION_KEY = 'jangan_user'

/**
 * 사용자 컨텍스트 타입 정의
 */
interface UserContextType {
  user: User | null                    // 현재 로그인된 사용자 정보
  setUser: (user: User | null) => void // 사용자 정보 설정 함수
  isLoggedIn: boolean                  // 로그인 여부
  logout: () => void                   // 로그아웃 함수
}

// 사용자 컨텍스트 생성
const UserContext = createContext<UserContextType | undefined>(undefined)

/**
 * localStorage에서 사용자 정보 복원 (새로고침 시 유지, 탭/앱 종료 시 삭제)
 */
const getInitialUser = (): User | null => {
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

/**
 * 사용자 컨텍스트 프로바이더
 * App 최상위에서 감싸서 전역 상태 제공
 *
 * @param children - 하위 컴포넌트들
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(getInitialUser)

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser))
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  }, [])

  /**
   * 로그아웃 처리
   */
  const logout = useCallback(() => {
    setUserState(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn: !!user, logout }}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * 사용자 컨텍스트 훅
 * 하위 컴포넌트에서 사용자 정보에 접근할 때 사용
 *
 * @returns UserContextType - 사용자 컨텍스트 값
 * @throws Error - UserProvider 외부에서 사용 시 에러
 *
 * @example
 * const { user, isLoggedIn, logout } = useUser()
 */
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
