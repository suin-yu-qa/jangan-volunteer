/**
 * ============================================================================
 * 관리자 로그인 페이지
 * ============================================================================
 *
 * 관리자가 아이디/비밀번호로 로그인하는 페이지입니다.
 *
 * 주요 기능:
 * - 아이디/비밀번호 기반 인증
 * - DB의 admins 테이블과 비교하여 인증
 * - 로그인 성공 시 대시보드로 이동
 *
 * 인증 로직:
 * 1. 관리자가 아이디/비밀번호 입력
 * 2. admins 테이블에서 username/password 일치 확인
 * 3. 일치하면 AdminContext에 정보 저장
 * 4. 대시보드(/admin/dashboard)로 리다이렉트
 * ============================================================================
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setAdmin, isLoggedIn } = useAdmin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // 이미 로그인된 경우
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/admin/dashboard')
    }
  }, [isLoggedIn, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // DB에서 관리자 계정 확인
      const { data, error: dbError } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (dbError || !data) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      // 관리자 정보 설정
      setAdmin({
        id: data.id,
        kakaoId: '',
        name: data.name,
        email: data.email || '',
        createdAt: data.created_at,
      })
      navigate('/admin/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-gray-100 to-white">
      <div className="w-full max-w-md">
        {/* 로고/타이틀 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">관리자 로그인</h1>
          <p className="text-gray-600">공개 봉사 관리 시스템</p>
        </div>

        {/* 로그인 카드 */}
        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="관리자 아이디"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="input-field"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* 사용자 앱 링크 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← 사용자 앱으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
