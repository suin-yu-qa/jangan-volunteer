import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNotApprovedModal, setShowNotApprovedModal] = useState(false)
  const navigate = useNavigate()
  const { setUser, user } = useUser()

  // 이미 로그인된 경우 바로 선택 페이지로
  if (user) {
    navigate('/select')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (name.trim().length < 2) {
      setError('이름은 2글자 이상 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // 승인된 사용자인지 확인
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name.trim())
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = No rows found
        throw fetchError
      }

      // 사용자가 없거나 승인되지 않은 경우
      if (!existingUser || !existingUser.is_approved) {
        setShowNotApprovedModal(true)
        setIsLoading(false)
        return
      }

      // 승인된 사용자인 경우 로그인
      setUser({
        id: existingUser.id,
        name: existingUser.name,
        isApproved: existingUser.is_approved,
        createdAt: existingUser.created_at,
      })

      navigate('/select')
    } catch (err) {
      console.error('Login error:', err)
      // Supabase 연결 안 된 경우 에러 표시
      setError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">공개 봉사</h1>
          <a
            href="/admin"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            관리자
          </a>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white">봉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">공개 봉사</h2>
            <p className="text-gray-500 mt-1">장안 북부회중</p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="card">
            <div className="mb-5">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="input-field"
                autoComplete="name"
                autoFocus
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  입장 중...
                </span>
              ) : '입장하기'}
            </button>
          </form>

          {/* 안내 */}
          <p className="text-center text-xs text-gray-400 mt-6">
            이름을 입력하면 봉사 일정을 확인하고 신청할 수 있습니다
          </p>
        </div>
      </main>

      {/* 미등록 사용자 안내 모달 */}
      {showNotApprovedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center">
              {/* 아이콘 */}
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* 메시지 */}
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                등록되지 않은 사용자입니다
              </h3>
              <p className="text-gray-600 mb-6">
                관리자에게 등록 요청 해주세요.
              </p>

              {/* 버튼 */}
              <button
                onClick={() => setShowNotApprovedModal(false)}
                className="w-full btn-primary"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
