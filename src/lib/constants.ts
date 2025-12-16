import { ServiceTypeInfo } from '@/types'

export const SERVICE_TYPES: ServiceTypeInfo[] = [
  {
    id: 'exhibit',
    name: '전시대 봉사',
    description: '씨젠, 이화수에서 진행되는 봉사입니다.',
    icon: '',
    customIcon: true,
    hasLimit: true,
    monthlyLimit: 3,
  },
  {
    id: 'park',
    name: '공원 봉사',
    description: '공원에서 진행되는 봉사입니다.',
    icon: '🌳',
    hasLimit: false,
  },
  {
    id: 'bus_stop',
    name: '버스 정류장 봉사',
    description: '버스 정류장에서 진행되는 봉사입니다.',
    icon: '🚌',
    hasLimit: false,
  },
]

export const EXHIBIT_LOCATIONS = ['씨젠', '이화수']

// 기본 시간 설정
export const DEFAULT_SCHEDULE_TIMES = {
  weekday: {
    startTime: '10:00',
    endTime: '12:00',
  },
  weekend: {
    startTime: '15:00',
    endTime: '17:00',
  },
}

// 요일별 봉사 일정 (수2, 금1, 토2, 일1)
export const EXHIBIT_SCHEDULE = {
  wednesday: 2,  // 수요일 2 site
  friday: 1,     // 금요일 1 site
  saturday: 2,   // 토요일 2 site
  sunday: 1,     // 일요일 1 site
}
