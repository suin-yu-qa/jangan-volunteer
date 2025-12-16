import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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
      // 기존 사용자 확인 또는 새로 생성
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name.trim())
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = No rows found
        throw fetchError
      }

      let userData

      if (existingUser) {
        userData = existingUser
      } else {
        // 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({ name: name.trim() })
          .select()
          .single()

        if (insertError) throw insertError
        userData = newUser
      }

      setUser({
        id: userData.id,
        name: userData.name,
        createdAt: userData.created_at,
      })

      navigate('/select')
    } catch (err) {
      console.error('Login error:', err)
      // Supabase 연결 안 된 경우 로컬 모드로 동작
      const localUser = {
        id: `local_${Date.now()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      }
      setUser(localUser)
      navigate('/select')
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
    </div>
  )
}
