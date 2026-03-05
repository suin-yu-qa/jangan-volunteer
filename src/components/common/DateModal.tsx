/**
 * ============================================================================
 * 날짜 선택 모달 컴포넌트
 * ============================================================================
 *
 * 캘린더에서 날짜를 선택했을 때 표시되는 모달입니다.
 *
 * 주요 기능:
 * - 봉사 일정이 있는 날짜: 장소별 탭으로 일정 상세 정보 표시
 * - 봉사 일정이 없는 날짜: 안내 메시지 표시
 * - 신청하기/불참하기 버튼 제공
 * - 모달 외부 클릭 또는 X 버튼으로 닫기
 *
 * Props:
 * - isOpen: 모달 표시 여부
 * - onClose: 모달 닫기 콜백
 * - date: 선택된 날짜 (YYYY-MM-DD 형식)
 * - schedules: 해당 날짜의 봉사 일정 목록
 * - registrations: 해당 일정들의 신청 내역
 * - user: 현재 로그인한 사용자
 * - onRegister: 신청하기 콜백
 * - onCancel: 불참하기 콜백
 * - weeklyCount: 이번 주 전시대 참여 횟수
 * - serviceType: 봉사 유형
 * ============================================================================
 */

import { useState } from 'react'
import { Schedule, Registration, User, ServiceType } from '@/types'
import { getShiftInfos, getKoreanDayName } from '@/utils/schedule'

interface DateModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  schedules: Schedule[]
  registrations: Registration[]
  user: User
  onRegister: (scheduleId: string, shiftNumber: number) => void
  onCancel: (registrationId: string) => void
  weeklyCount: number
  serviceType: ServiceType
}

export default function DateModal({
  isOpen,
  onClose,
  date,
  schedules,
  registrations,
  user,
  onRegister,
  onCancel,
  weeklyCount,
  serviceType,
}: DateModalProps) {
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0)

  if (!isOpen) return null

  // 날짜 파싱 및 표시 형식
  const dateObj = new Date(date)
  const dayName = getKoreanDayName(dateObj)
  const formattedDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 (${dayName})`

  // 과거 날짜인지 확인
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isPastDate = dateObj < today

  // 일정이 없는 경우
  if (schedules.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-gray-800">{formattedDate}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 콘텐츠 - 일정 없음 */}
          <div className="px-5 py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-1">예정된 봉사 일정이 없습니다.</p>
            <p className="text-gray-400 text-sm">앱 관리자에게 문의해주세요.</p>
          </div>

          {/* 하단 버튼 */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 선택된 일정 (탭으로 선택)
  const schedule = schedules[selectedLocationIndex] || schedules[0]
  const scheduleRegs = registrations.filter((r) => r.scheduleId === schedule.id)
  const myReg = scheduleRegs.find((r) => r.userId === user.id)
  const shifts = getShiftInfos(schedule, scheduleRegs)
  const totalSlots = schedule.shiftCount * schedule.participantsPerShift
  const filledSlots = scheduleRegs.length

  // 해당 날짜에 이미 신청한 일정이 있는지 확인 (다른 장소 포함)
  const myRegInDate = registrations.find((r) =>
    r.userId === user.id && schedules.some((s) => s.id === r.scheduleId)
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className={`${isPastDate ? 'bg-gray-100' : 'bg-blue-50'} px-5 py-4 border-b ${isPastDate ? 'border-gray-200' : 'border-blue-100'} flex-shrink-0`}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-gray-800">{formattedDate}</h2>
                {isPastDate && <span className="badge badge-gray">지난 일정</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">{schedule.startTime} - {schedule.endTime}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 신청 상태 배지 */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-500">{filledSlots}/{totalSlots}명 신청</span>
            {myReg && <span className="badge badge-green">신청완료</span>}
          </div>
        </div>

        {/* 장소별 탭 (여러 장소가 있을 때만 표시) - 스크롤 가능 */}
        {schedules.length > 1 && (
          <div className="px-5 pt-4 flex-shrink-0">
            <p className="text-xs text-gray-500 mb-2">장소 선택</p>
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <div className="flex bg-gray-100 rounded-xl p-1.5 gap-1 min-w-min">
                {schedules.map((s, index) => {
                  // 해당 장소에 내 신청이 있는지 확인
                  const hasMyReg = registrations.some(
                    (r) => r.userId === user.id && r.scheduleId === s.id
                  )
                  const locationRegs = registrations.filter((r) => r.scheduleId === s.id)
                  const locationSlots = s.shiftCount * s.participantsPerShift
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedLocationIndex(index)}
                      className={`flex-none min-w-[80px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        selectedLocationIndex === index
                          ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="whitespace-nowrap">{s.location}</span>
                        <span className={`text-xs ${selectedLocationIndex === index ? 'text-blue-400' : 'text-gray-400'}`}>
                          {locationRegs.length}/{locationSlots}명
                        </span>
                      </div>
                      {hasMyReg && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* 단일 장소일 때 장소명 표시 */}
        {schedules.length === 1 && (
          <div className="px-5 pt-4 flex-shrink-0">
            <span className={`${isPastDate ? 'text-gray-500' : 'text-blue-600'} font-medium`}>
              {schedule.location}
            </span>
          </div>
        )}

        {/* 교대별 정보 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-5 pt-3">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">교대별 현황</h3>
          <div className="space-y-3">
            {shifts.map((shift) => {
              const isMyShift = shift.registrations.some((r) => r.userId === user.id)
              const myShiftReg = shift.registrations.find((r) => r.userId === user.id)
              const isFull = shift.availableSlots <= 0
              // 과거 일정은 신청 불가, 이미 해당 날짜에 다른 장소에 신청한 경우도 불가
              const canRegister = !isPastDate && !myRegInDate && !isFull && (serviceType !== 'exhibit' || weeklyCount < 3)

              return (
                <div
                  key={shift.shiftNumber}
                  className={`rounded-lg p-4 border transition-all ${
                    isMyShift ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-medium text-gray-800">{shift.shiftNumber}교대</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                      {isFull ? '마감' : `${shift.availableSlots}자리`}
                    </span>
                  </div>

                  {/* 참여자 목록 */}
                  {shift.registrations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {shift.registrations.map((reg) => (
                        <span
                          key={reg.id}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            reg.userId === user.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {reg.userName || '참여자'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 액션 버튼 - 과거 일정은 읽기 전용 */}
                  {!isPastDate && (
                    <div className="flex justify-end">
                      {isMyShift && myShiftReg ? (
                        <button
                          onClick={() => onCancel(myShiftReg.id)}
                          className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
                        >
                          불참하기
                        </button>
                      ) : canRegister ? (
                        <button
                          onClick={() => onRegister(schedule.id, shift.shiftNumber)}
                          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          신청하기
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 안내 메시지 */}
          {isPastDate ? (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              지난 봉사 일정입니다. 이력 조회만 가능합니다.
            </div>
          ) : (
            <>
              {myRegInDate && !myReg && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg text-xs text-blue-700">
                  이 날짜에 다른 장소로 이미 신청하셨습니다. 변경하려면 먼저 불참하기를 눌러주세요.
                </div>
              )}
              {myReg && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg text-xs text-blue-700">
                  이 일정에 이미 신청하셨습니다. 다른 시간대로 변경하려면 먼저 불참하기를 눌러주세요.
                </div>
              )}
              {serviceType === 'exhibit' && weeklyCount >= 3 && !myRegInDate && (
                <div className="mt-4 p-3 bg-orange-100 rounded-lg text-xs text-orange-700">
                  이번 주 참여 가능 횟수(3회)를 모두 사용했습니다.
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
