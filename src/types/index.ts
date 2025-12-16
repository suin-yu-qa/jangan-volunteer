// 봉사 유형
export type ServiceType = 'exhibit' | 'park' | 'bus_stop'

export interface ServiceTypeInfo {
  id: ServiceType
  name: string
  description: string
  icon: string
  customIcon?: boolean  // 커스텀 아이콘 사용 여부
  hasLimit: boolean
  monthlyLimit?: number
}

// 사용자
export interface User {
  id: string
  name: string
  createdAt: string
}

// 관리자
export interface Admin {
  id: string
  kakaoId: string
  name: string
  email: string
  createdAt: string
}

// 봉사 일정
export interface Schedule {
  id: string
  serviceType: ServiceType
  date: string  // YYYY-MM-DD
  location: string
  startTime: string  // HH:mm
  endTime: string    // HH:mm
  shiftCount: number  // 3 or 4
  participantsPerShift: number  // 기본 2
  createdBy: string
  createdAt: string
}

// 봉사 신청
export interface Registration {
  id: string
  scheduleId: string
  userId: string
  userName?: string
  shiftNumber: number  // 1, 2, 3, 4
  createdAt: string
}

// 교대 정보 (계산된 값)
export interface ShiftInfo {
  shiftNumber: number
  startTime: string
  endTime: string
  registrations: Registration[]
  availableSlots: number
}

// 일정 상세 (조인된 데이터)
export interface ScheduleWithRegistrations extends Schedule {
  shifts: ShiftInfo[]
  totalRegistrations: number
  totalSlots: number
}
