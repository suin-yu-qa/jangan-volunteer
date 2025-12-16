import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setAdmin, isLoggedIn } = useAdmin()

  // 이미 로그인된 경우
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/admin/dashboard')
    }
  }, [isLoggedIn, navigate])

  const handleKakaoLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        },
      })

      if (error) throw error
    } catch (err) {
      console.error('Kakao login error:', err)
      // 개발 모드: 임시 관리자 로그인
      handleDevLogin()
    }
  }

  // 개발용 임시 로그인
  const handleDevLogin = () => {
    const devAdmin = {
      id: 'dev_admin',
      kakaoId: 'dev_kakao_id',
      name: '관리자',
      email: 'admin@example.com',
      createdAt: new Date().toISOString(),
    }
    setAdmin(devAdmin)
    navigate('/admin/dashboard')
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
          <button
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium py-4 px-6 rounded-xl transition-colors duration-200"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4C7.02944 4 3 7.16792 3 11.0833C3 13.4792 4.55556 15.5833 6.94444 16.875L6.11111 20.0833C6.05556 20.3056 6.30556 20.4722 6.5 20.3333L10.4444 17.6944C10.9444 17.75 11.4722 17.8056 12 17.8056C16.9706 17.8056 21 14.6377 21 11.0833C21 7.16792 16.9706 4 12 4Z"
                fill="#191919"
              />
            </svg>
            카카오로 로그인
          </button>

          {/* 개발 모드 버튼 */}
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleDevLogin}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              개발자 모드로 입장 (테스트용)
            </button>
          </div>
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
