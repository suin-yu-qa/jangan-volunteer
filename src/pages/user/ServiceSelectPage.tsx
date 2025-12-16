import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES } from '@/lib/constants'
import { ServiceType } from '@/types'
import { useEffect, useState } from 'react'
import CartIcon from '@/components/icons/CartIcon'
import { supabase } from '@/lib/supabase'

export default function ServiceSelectPage() {
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [noticeCount, setNoticeCount] = useState(0)

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // 공지사항 개수 로드
  useEffect(() => {
    loadNoticeCount()
  }, [])

  const loadNoticeCount = async () => {
    try {
      const { count, error } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (!error && count !== null) {
        setNoticeCount(count)
      }
    } catch (err) {
      console.error('Failed to load notice count:', err)
    }
  }

  if (!user) return null

  const handleSelectService = (serviceType: ServiceType) => {
    navigate(`/calendar/${serviceType}`)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">공개 봉사</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* 봉사 유형 리스트 */}
        <div className="space-y-3">
          {SERVICE_TYPES.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service.id)}
              className="w-full card-hover text-left flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                {service.customIcon ? (
                  <CartIcon className="w-7 h-7 text-blue-600" />
                ) : (
                  service.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">
                    {service.name}
                  </h3>
                  {service.hasLimit ? (
                    <span className="badge badge-yellow">월 {service.monthlyLimit}회</span>
                  ) : (
                    <span className="badge badge-green">무제한</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {service.description}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* 공지사항 버튼 */}
        <button
          onClick={() => navigate('/notices')}
          className="w-full mt-4 card-hover text-left flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800">공지사항</h3>
              {noticeCount > 0 && (
                <span className="badge badge-orange">{noticeCount}개</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              관리자 공지사항을 확인하세요
            </p>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 안내 문구 */}
        <div className="mt-6 card bg-blue-50 border-blue-100">
          <h4 className="font-semibold text-blue-800 text-sm mb-2">안내사항</h4>
          <ul className="text-xs text-blue-700 space-y-1.5">
            <li>• 전시대 봉사: 씨젠, 이화수에서 진행 (월 3회 제한)</li>
            <li>• 공원/버스정류장 봉사: 장소는 관리자 공지 확인</li>
            <li>• 평일 10:00-12:00 / 주말 15:00-17:00</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
