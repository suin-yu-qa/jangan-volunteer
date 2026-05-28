/**
 * 접속 로그 자동 기록 컴포넌트
 * 페이지 이동 시마다 access_logs에 기록
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { logAccess } from '@/services/access-log.service'

export default function AccessLogger() {
  const location = useLocation()
  const { user } = useUser()

  useEffect(() => {
    logAccess({
      user_id: user?.id,
      user_name: user?.name,
      page: location.pathname,
    })
  }, [location.pathname, user?.id])

  return null
}
