import { Schedule, ShiftInfo } from '@/types'
import { getKoreanDayName } from '@/utils/schedule'

interface ShiftModalProps {
  schedule: Schedule
  shifts: ShiftInfo[]
  userId: string
  onRegister: (shiftNumber: number) => void
  onCancel: (registrationId: string) => void
  onClose: () => void
  canRegister: boolean
}

export default function ShiftModal({
  schedule,
  shifts,
  userId,
  onRegister,
  onCancel,
  onClose,
  canRegister,
}: ShiftModalProps) {
  const date = new Date(schedule.date)
  const dayName = getKoreanDayName(date)

  // 사용자가 이미 등록한 교대
  const myRegistration = shifts
    .flatMap((s) => s.registrations)
    .find((r) => r.userId === userId)

  // 전체 슬롯 계산
  const totalSlots = shifts.reduce((acc, s) => acc + s.availableSlots + s.registrations.length, 0)
  const filledSlots = shifts.reduce((acc, s) => acc + s.registrations.length, 0)
  const percentage = Math.round((filledSlots / totalSlots) * 100)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {date.getMonth() + 1}월 {date.getDate()}일 ({dayName})
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">{schedule.location}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <span>{schedule.startTime} - {schedule.endTime}</span>
            <span className="text-gray-300">·</span>
            <span>{schedule.shiftCount}교대</span>
          </div>
          {/* 전체 현황 프로그레스 바 */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>신청 현황</span>
              <span>{filledSlots}/{totalSlots}명 ({percentage}%)</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        {/* 교대 목록 */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">교대 선택</h3>

          <div className="space-y-2">
            {shifts.map((shift) => {
              const isMyShift = shift.registrations.some((r) => r.userId === userId)
              const isFull = shift.availableSlots <= 0

              return (
                <div
                  key={shift.shiftNumber}
                  className={`
                    border rounded-lg p-3 transition-all
                    ${isMyShift ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isFull && !isMyShift ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {shift.shiftNumber}교대
                      </span>
                      <span className="text-gray-400 text-sm">
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    <span className={`badge ${isFull ? 'badge-red' : 'badge-green'}`}>
                      {shift.availableSlots > 0
                        ? `${shift.availableSlots}자리`
                        : '마감'}
                    </span>
                  </div>

                  {/* 등록된 사람들 */}
                  {shift.registrations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {shift.registrations.map((reg) => (
                        <span
                          key={reg.id}
                          className={`badge ${reg.userId === userId ? 'badge-blue' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {reg.userName || '참여자'}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 버튼 */}
                  {isMyShift ? (
                    <button
                      onClick={() => {
                        const reg = shift.registrations.find((r) => r.userId === userId)
                        if (reg) onCancel(reg.id)
                      }}
                      className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                    >
                      신청 취소
                    </button>
                  ) : !isFull && canRegister && !myRegistration ? (
                    <button
                      onClick={() => onRegister(shift.shiftNumber)}
                      className="w-full py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      신청하기
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* 안내 메시지 */}
          {myRegistration && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>이미 이 일정에 신청하셨습니다. 다른 교대로 변경하려면 먼저 취소해주세요.</span>
            </div>
          )}

          {!canRegister && !myRegistration && (
            <div className="mt-4 p-3 bg-orange-50 rounded-md text-sm text-orange-700 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>이번 달 참여 가능 횟수를 모두 사용했습니다.</span>
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
