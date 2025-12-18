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
 * - 오늘 날짜 하이라이트 (파란색 배경)
 * - 선택된 날짜 강조 표시 (주황색 테두리 + 배경)
 * - 모든 날짜 선택 가능 (과거 포함, 이력 조회용)
 * - 오늘 이전 날짜는 회색, 이후 날짜는 검정색
 * - 오늘 버튼으로 현재 월로 이동
 *
 * Props:
 * - scheduleDates: 봉사 일정이 있는 날짜 배열 (YYYY-MM-DD 형식)
 * - onDateClick: 날짜 클릭 시 콜백 함수
 * - selectedDate: 현재 선택된 날짜 (YYYY-MM-DD 형식, 선택사항)
 * ============================================================================
 */

import { useState } from 'react'
import { formatDate } from '@/utils/schedule'

interface CalendarProps {
  scheduleDates: string[]  // 봉사 일정이 있는 날짜 (YYYY-MM-DD 형식)
  onDateClick: (date: Date) => void  // 날짜 클릭 콜백
  selectedDate?: string  // 현재 선택된 날짜 (YYYY-MM-DD 형식)
}

export default function Calendar({ scheduleDates, onDateClick, selectedDate }: CalendarProps) {
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
   * 오늘로 이동
   */
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  /**
   * 현재 표시 중인 월이 오늘의 월인지 확인
   */
  const isCurrentMonth = (): boolean => {
    const today = new Date()
    return year === today.getFullYear() && month === today.getMonth()
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
   * 선택된 날짜인지 확인
   */
  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false
    return formatDate(date) === selectedDate
  }

  /**
   * 해당 날짜에 봉사 일정이 있는지 확인
   */
  const hasSchedule = (date: Date): boolean => {
    const dateStr = formatDate(date)
    return scheduleDates.includes(dateStr)
  }

  /**
   * 지난 날짜인지 확인 (오늘 제외)
   */
  const isPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  /**
   * 날짜 텍스트 색상 결정
   */
  const getDateTextColor = (date: Date, dayOfWeek: number): string => {
    // 선택된 날짜는 흰색
    if (isSelected(date)) {
      return 'text-white'
    }
    // 오늘은 흰색 (파란 배경)
    if (isToday(date)) {
      return 'text-white'
    }
    // 과거는 회색
    if (isPast(date)) {
      return 'text-gray-300'
    }
    // 미래 날짜
    if (dayOfWeek === 0) return 'text-red-500' // 일요일
    if (dayOfWeek === 6) return 'text-blue-500' // 토요일
    return 'text-gray-800' // 평일은 검정
  }

  /**
   * 날짜 배경 스타일 결정
   */
  const getDateBackgroundStyle = (date: Date): string => {
    const selected = isSelected(date)
    const today = isToday(date)

    // 선택된 날짜: 주황색 배경 + 테두리
    if (selected) {
      return 'bg-orange-500 ring-2 ring-orange-300 ring-offset-1 shadow-lg scale-110'
    }
    // 오늘: 파란색 배경
    if (today) {
      return 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
    }
    // 과거 날짜도 클릭 가능 (이력 조회용)
    return 'hover:bg-gray-100 cursor-pointer'
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
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-800">
            {year}년 {month + 1}월
          </h2>
          {/* 오늘 버튼 - 현재 월이 아닐 때만 표시 */}
          {!isCurrentMonth() && (
            <button
              onClick={goToToday}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              오늘
            </button>
          )}
        </div>
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
          const selected = isSelected(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick(date)}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg
                transition-all duration-200 relative
                ${getDateBackgroundStyle(date)}
              `}
            >
              <span className={`text-sm ${isScheduled && !past ? 'font-bold' : ''} ${getDateTextColor(date, dayOfWeek)}`}>
                {date.getDate()}
              </span>
              {/* 봉사 일정 표시 점 */}
              {isScheduled && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  selected ? 'bg-white' : isToday(date) ? 'bg-white' : past ? 'bg-gray-300' : 'bg-blue-500'
                }`} />
              )}
            </button>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>봉사 일정</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-blue-500 inline-block" />
          <span>오늘</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-500 ring-2 ring-orange-300 inline-block" />
          <span>선택됨</span>
        </div>
      </div>
    </div>
  )
}
