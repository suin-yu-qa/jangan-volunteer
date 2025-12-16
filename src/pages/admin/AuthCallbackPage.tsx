import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setAdmin } = useAdmin()

  useEffect(() => {
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) throw error

      if (data.session?.user) {
        const user = data.session.user
        const admin = {
          id: user.id,
          kakaoId: user.user_metadata?.provider_id || '',
          name: user.user_metadata?.name || user.email || '관리자',
          email: user.email || '',
          createdAt: user.created_at,
        }
        setAdmin(admin)
        navigate('/admin/dashboard')
      } else {
        navigate('/admin')
      }
    } catch (err) {
      console.error('Auth callback error:', err)
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <svg
          className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  )
}
