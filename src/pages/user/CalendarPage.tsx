import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { SERVICE_TYPES } from '@/lib/constants'
import { ServiceType, Schedule, Registration, ShiftInfo } from '@/types'
import { supabase } from '@/lib/supabase'
import { getShiftInfos, formatDate } from '@/utils/schedule'
import Calendar from '@/components/common/Calendar'
import ShiftModal from '@/components/common/ShiftModal'
import CartIcon from '@/components/icons/CartIcon'

export default function CalendarPage() {
  const { serviceType } = useParams<{ serviceType: ServiceType }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [monthlyCount, setMonthlyCount] = useState(0)

  const service = SERVICE_TYPES.find((s) => s.id === serviceType)

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // 일정 로드
  useEffect(() => {
    if (!serviceType) return
    loadSchedules()
  }, [serviceType])

  // 월별 참여 횟수 계산 (전시대 봉사)
  useEffect(() => {
    if (serviceType === 'exhibit' && user) {
      calculateMonthlyCount()
    }
  }, [registrations, user, serviceType])

  const loadSchedules = async () => {
    setIsLoading(true)
    try {
      // 이번 달 시작일과 다음 달 끝일
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('service_type', serviceType)
        .gte('date', formatDate(startOfMonth))
        .lte('date', formatDate(endOfNextMonth))
        .order('date', { ascending: true })

      if (scheduleError) throw scheduleError

      const scheduleList: Schedule[] = (scheduleData || []).map((s) => ({
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

      // 등록 정보도 로드
      if (scheduleList.length > 0) {
        const scheduleIds = scheduleList.map((s) => s.id)
        const { data: regData, error: regError } = await supabase
          .from('registrations')
          .select('*, users(name)')
          .in('schedule_id', scheduleIds)

        if (!regError && regData) {
          const regList: Registration[] = regData.map((r: any) => ({
            id: r.id,
            scheduleId: r.schedule_id,
            userId: r.user_id,
            userName: r.users?.name || '',
            shiftNumber: r.shift_number,
            createdAt: r.created_at,
          }))
          setRegistrations(regList)
        }
      }
    } catch (err) {
      console.error('Failed to load schedules:', err)
      // 데모 데이터
      setSchedules([])
      setRegistrations([])
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMonthlyCount = async () => {
    if (!user) return

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, schedules!inner(*)')
        .eq('user_id', user.id)
        .eq('schedules.service_type', 'exhibit')
        .gte('schedules.date', formatDate(startOfMonth))
        .lte('schedules.date', formatDate(endOfMonth))

      if (!error && data) {
        setMonthlyCount(data.length)
      }
    } catch (err) {
      console.error('Failed to calculate monthly count:', err)
    }
  }

  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date)
    const schedule = schedules.find((s) => s.date === dateStr)
    if (schedule) {
      setSelectedSchedule(schedule)
      setIsModalOpen(true)
    }
  }

  const handleRegister = async (shiftNumber: number) => {
    if (!user || !selectedSchedule) return

    // 월 3회 제한 체크
    if (serviceType === 'exhibit' && monthlyCount >= 3) {
      alert('전시대 봉사는 월 3회까지만 참여 가능합니다.')
      return
    }

    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          schedule_id: selectedSchedule.id,
          user_id: user.id,
          shift_number: shiftNumber,
        })

      if (error) throw error

      // 새로고침
      await loadSchedules()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Registration failed:', err)
      alert('신청에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleCancel = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', registrationId)

      if (error) throw error

      await loadSchedules()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Cancel failed:', err)
      alert('취소에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (!user || !service) return null

  // 일정이 있는 날짜들
  const scheduleDates = schedules.map((s) => s.date)

  // 선택된 일정의 교대 정보
  const selectedShifts: ShiftInfo[] = selectedSchedule
    ? getShiftInfos(
        selectedSchedule,
        registrations.filter((r) => r.scheduleId === selectedSchedule.id)
      )
    : []

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/select')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {service.customIcon ? (
                <CartIcon className="w-6 h-6 text-blue-600" />
              ) : (
                <span>{service.icon}</span>
              )}
              <span>{service.name}</span>
            </h1>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {/* 참여 현황 (전시대만) */}
        {serviceType === 'exhibit' && (
          <div className="card mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">이번 달 참여 현황</span>
              <div className="flex items-center gap-2">
                <div className="progress-bar w-24">
                  <div
                    className={`progress-fill ${monthlyCount >= 3 ? 'bg-red-500' : ''}`}
                    style={{ width: `${(monthlyCount / 3) * 100}%` }}
                  />
                </div>
                <span className={`font-bold text-sm ${monthlyCount >= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                  {monthlyCount}/3회
                </span>
              </div>
            </div>
            {monthlyCount >= 3 && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-md px-2 py-1.5">
                이번 달 참여 가능 횟수를 모두 사용했습니다.
              </p>
            )}
          </div>
        )}

        {/* 달력 */}
        <div className="card mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <Calendar
              scheduleDates={scheduleDates}
              onDateClick={handleDateClick}
            />
          )}
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p>파란색 점이 있는 날짜에 봉사 일정이 있습니다.</p>
              <p>날짜를 클릭하면 상세 정보와 신청이 가능합니다.</p>
            </div>
          </div>
        </div>
      </main>

      {/* 교대 선택 모달 */}
      {isModalOpen && selectedSchedule && (
        <ShiftModal
          schedule={selectedSchedule}
          shifts={selectedShifts}
          userId={user.id}
          onRegister={handleRegister}
          onCancel={handleCancel}
          onClose={() => setIsModalOpen(false)}
          canRegister={serviceType !== 'exhibit' || monthlyCount < 3}
        />
      )}
    </div>
  )
}
