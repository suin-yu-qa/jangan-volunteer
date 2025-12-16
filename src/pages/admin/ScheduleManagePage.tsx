import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Schedule, ServiceType } from '@/types'
import { formatDate, getKoreanDayName, isWeekend } from '@/utils/schedule'
import { SERVICE_TYPES, EXHIBIT_LOCATIONS, DEFAULT_SCHEDULE_TIMES } from '@/lib/constants'
import CartIcon from '@/components/icons/CartIcon'

export default function ScheduleManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()

  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  // 폼 상태
  const [formData, setFormData] = useState({
    serviceType: 'exhibit' as ServiceType,
    date: formatDate(new Date()),
    location: EXHIBIT_LOCATIONS[0],
    startTime: '10:00',
    endTime: '12:00',
    shiftCount: 3,
    participantsPerShift: 2,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadSchedules()
    }
  }, [isLoggedIn, selectedMonth])

  // 날짜 변경 시 시간 자동 설정
  useEffect(() => {
    const date = new Date(formData.date)
    if (isWeekend(date)) {
      setFormData((prev) => ({
        ...prev,
        startTime: DEFAULT_SCHEDULE_TIMES.weekend.startTime,
        endTime: DEFAULT_SCHEDULE_TIMES.weekend.endTime,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        startTime: DEFAULT_SCHEDULE_TIMES.weekday.startTime,
        endTime: DEFAULT_SCHEDULE_TIMES.weekday.endTime,
      }))
    }
  }, [formData.date])

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      const year = selectedMonth.getFullYear()
      const month = selectedMonth.getMonth()
      const startOfMonth = formatDate(new Date(year, month, 1))
      const endOfMonth = formatDate(new Date(year, month + 1, 0))

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      const scheduleList: Schedule[] = (data || []).map((s) => ({
        id: s.id,
        serviceType: s.service_type as ServiceType,
        date: s.date,
        location: s.location,
        startTime: s.start_time,
        endTime: s.end_time,
        shiftCount: s.shift_count,
        participantsPerShift: s.participants_per_shift,
        createdBy: s.created_by,
        createdAt: s.created_at,
      }))

      setSchedules(scheduleList)
    } catch (err) {
      console.error('Failed to load schedules:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!admin) return

    try {
      const { error } = await supabase.from('schedules').insert({
        service_type: formData.serviceType,
        date: formData.date,
        location: formData.location,
        start_time: formData.startTime,
        end_time: formData.endTime,
        shift_count: formData.shiftCount,
        participants_per_shift: formData.participantsPerShift,
        created_by: admin.id,
      })

      if (error) throw error

      setIsModalOpen(false)
      loadSchedules()

      // 폼 초기화
      setFormData({
        serviceType: 'exhibit',
        date: formatDate(new Date()),
        location: EXHIBIT_LOCATIONS[0],
        startTime: '10:00',
        endTime: '12:00',
        shiftCount: 3,
        participantsPerShift: 2,
      })
    } catch (err) {
      console.error('Failed to create schedule:', err)
      alert('일정 등록에 실패했습니다.')
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까? 등록된 신청도 함께 삭제됩니다.')) {
      return
    }

    try {
      // 먼저 등록 삭제
      await supabase.from('registrations').delete().eq('schedule_id', scheduleId)

      // 일정 삭제
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) throw error

      loadSchedules()
    } catch (err) {
      console.error('Failed to delete schedule:', err)
      alert('일정 삭제에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  if (!admin) return null

  // 일정을 날짜별로 그룹화
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = []
    }
    acc[schedule.date].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">공개 봉사</span>
            <span className="text-sm text-gray-400">관리자</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{admin.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            <Link to="/admin/dashboard" className="tab-item">
              대시보드
            </Link>
            <Link to="/admin/schedule" className="tab-item-active">
              일정 관리
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* 상단 컨트롤 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-800 min-w-[120px] text-center">
              {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
            </h2>
            <button
              onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            일정 추가
          </button>
        </div>

        {/* 일정 목록 */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              이번 달 일정이 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {Object.entries(schedulesByDate).map(([date, dateSchedules]) => {
                const dateObj = new Date(date)
                const dayName = getKoreanDayName(dateObj)
                const isToday = formatDate(new Date()) === date

                return (
                  <div key={date} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`font-semibold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
                        {dateObj.getMonth() + 1}월 {dateObj.getDate()}일 ({dayName})
                      </span>
                      {isToday && <span className="badge badge-blue">오늘</span>}
                    </div>
                    <div className="space-y-2">
                      {dateSchedules.map((schedule) => {
                        const service = SERVICE_TYPES.find(
                          (s) => s.id === schedule.serviceType
                        )
                        const badgeClass = schedule.serviceType === 'exhibit'
                          ? 'badge-blue'
                          : schedule.serviceType === 'park'
                            ? 'badge-green'
                            : 'badge-orange'

                        return (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {service?.customIcon ? (
                                <CartIcon className="w-6 h-6 text-blue-600" />
                              ) : (
                                <span className="text-xl">{service?.icon}</span>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800">
                                    {schedule.location}
                                  </span>
                                  <span className={`badge ${badgeClass}`}>
                                    {service?.name}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  {schedule.startTime} - {schedule.endTime}
                                  <span className="text-gray-300 mx-1">·</span>
                                  {schedule.shiftCount}교대
                                  <span className="text-gray-300 mx-1">·</span>
                                  교대당 {schedule.participantsPerShift}명
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* 일정 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">일정 추가</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 봉사 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  봉사 유형
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceType: e.target.value as ServiceType,
                      location:
                        e.target.value === 'exhibit'
                          ? EXHIBIT_LOCATIONS[0]
                          : '',
                    })
                  }
                  className="input-field"
                >
                  {SERVICE_TYPES.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.customIcon ? '📋' : service.icon} {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              {/* 장소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소
                </label>
                {formData.serviceType === 'exhibit' ? (
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="input-field"
                  >
                    {EXHIBIT_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="장소를 입력하세요"
                    className="input-field"
                    required
                  />
                )}
              </div>

              {/* 시간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* 교대 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    교대 수
                  </label>
                  <select
                    value={formData.shiftCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shiftCount: parseInt(e.target.value),
                      })
                    }
                    className="input-field"
                  >
                    <option value={3}>3교대</option>
                    <option value={4}>4교대</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    교대당 인원
                  </label>
                  <input
                    type="number"
                    value={formData.participantsPerShift}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        participantsPerShift: parseInt(e.target.value) || 2,
                      })
                    }
                    min={1}
                    max={10}
                    className="input-field"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
