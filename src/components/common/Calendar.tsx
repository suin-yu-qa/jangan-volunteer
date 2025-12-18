/**
 * ============================================================================
 * 캘린더 컴포넌트
 * ============================================================================
 *
 * 봉사 일정을 월별 달력 형태로 표시하는 컴포넌트입니다.
 *
 * 주요 기능:
 * - 월별 달력 표시 및 네비게이션 (이전/다음 달)
 * - 봉사 일정이 있는 날짜 표시 (파란색 점)
 * - 오늘 날짜 하이라이트
 * - 지난 날짜 비활성화
 * - 날짜 클릭 시 상세 일정 모달 열기
 *
 * Props:
 * - scheduleDates: 봉사 일정이 있는 날짜 배열 (YYYY-MM-DD 형식)
 * - onDateClick: 날짜 클릭 시 콜백 함수
 * ============================================================================
 */

import { useState } from 'react'
import { formatDate } from '@/utils/schedule'

interface CalendarProps {
  scheduleDates: string[]  // 봉사 일정이 있는 날짜 (YYYY-MM-DD 형식)
  onDateClick: (date: Date) => void  // 날짜 클릭 콜백
}

export default function Calendar({ scheduleDates, onDateClick }: CalendarProps) {
  // 현재 표시 중인 월
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 이번 달 첫 날과 마지막 날 계산
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 달력에 표시할 날짜 배열 생성
  const days: (Date | null)[] = []

  // 첫 주 빈 칸 (이번 달 1일 전의 빈 공간)
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null)
  }

  // 이번 달 날짜 추가
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  /**
   * 이전 달로 이동
   */
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  /**
   * 다음 달로 이동
   */
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  /**
   * 오늘 날짜인지 확인
   */
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  /**
   * 해당 날짜에 봉사 일정이 있는지 확인
   */
  const hasSchedule = (date: Date): boolean => {
    const dateStr = formatDate(date)
    return scheduleDates.includes(dateStr)
  }

  /**
   * 지난 날짜인지 확인
   */
  const isPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <div>
      {/* 월 네비게이션 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* 요일 헤더 (일~토) */}
      <div className="grid grid-cols-7 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          // 빈 칸
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dayOfWeek = date.getDay()
          const isScheduled = hasSchedule(date)
          const past = isPast(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => isScheduled && !past && onDateClick(date)}
              disabled={!isScheduled || past}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg
                transition-all duration-200 relative
                ${isToday(date) ? 'ring-2 ring-primary-500' : ''}
                ${past ? 'text-gray-300' : ''}
                ${!past && isScheduled ? 'hover:bg-primary-50 cursor-pointer' : ''}
                ${!isScheduled && !past ? 'text-gray-400' : ''}
                ${dayOfWeek === 0 && !past ? 'text-red-500' : ''}
                ${dayOfWeek === 6 && !past ? 'text-blue-500' : ''}
              `}
            >
              <span className={`text-sm ${isScheduled && !past ? 'font-bold text-gray-800' : ''}`}>
                {date.getDate()}
              </span>
              {/* 봉사 일정 표시 점 */}
              {isScheduled && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${past ? 'bg-gray-300' : 'bg-primary-500'}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          <span>봉사 일정</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded ring-2 ring-primary-500 inline-block" />
          <span>오늘</span>
        </div>
      </div>
    </div>
  )
}
