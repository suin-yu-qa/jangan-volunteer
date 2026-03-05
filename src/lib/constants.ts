/**
 * ============================================================================
 * 상수 정의 모듈
 * ============================================================================
 *
 * 이 모듈은 앱 전역에서 사용되는 상수 값들을 정의합니다.
 *
 * 주요 내용:
 * - SERVICE_TYPES: 봉사 유형별 설정 (전시대, 공원, 버스정류장)
 * - EXHIBIT_LOCATIONS: 전시대 봉사 장소 목록
 * - DEFAULT_SCHEDULE_TIMES: 기본 봉사 시간 설정
 * - EXHIBIT_SCHEDULE: 요일별 전시대 봉사 일정
 * ============================================================================
 */

import { ServiceTypeInfo } from '@/types'

/**
 * 봉사 유형 목록
 * - id: 봉사 유형 고유 식별자
 * - name: 표시용 이름
 * - description: 봉사 설명
 * - icon: 이모지 아이콘
 * - customIcon: 커스텀 아이콘 사용 여부
 * - hasLimit: 월별 참여 제한 여부
 * - monthlyLimit: 월별 최대 참여 횟수
 */
export const SERVICE_TYPES: ServiceTypeInfo[] = [
  {
    id: 'exhibit',
    name: '전시대 봉사',
    description: '씨젠, 롯데리아 앞에서 진행되는 봉사입니다.',
    icon: '',
    customIcon: true,
    hasLimit: false,
  },
  {
    id: 'park',
    name: '공원 봉사',
    description: '장안 근린 공원, 뚝방 공원, 마로니에 공원에서 진행되는 봉사입니다.',
    icon: '🌳',
    hasLimit: false,
  },
]

/**
 * 전시대 봉사 장소 목록
 */
export const EXHIBIT_LOCATIONS = ['씨젠', '롯데리아 앞']

/**
 * 공원 봉사 장소 목록
 */
export const PARK_LOCATIONS = ['장안 근린 공원', '뚝방 공원', '마로니에 공원']

/**
 * 인원 제한이 있는 장소와 최대 인원
 * - 씨젠: 6명
 * - 롯데리아 앞: 6명
 * - 나머지: 무제한
 */
export const LIMITED_LOCATIONS: Record<string, number> = {
  '씨젠': 6,
  '롯데리아 앞': 6,
}

/**
 * 장소별 최대 인원 가져오기 (제한 없으면 0 반환)
 */
export const getMaxParticipants = (location: string): number => {
  return LIMITED_LOCATIONS[location] || 0
}

/**
 * 해당 장소에 인원 제한이 있는지 확인
 */
export const hasParticipantLimit = (location: string): boolean => {
  return location in LIMITED_LOCATIONS
}

/**
 * 하루 봉사 최대 참여자 수
 */
export const MAX_DAILY_PARTICIPANTS = 42

/**
 * 요일별 기본 봉사 시간 설정
 * - wednesday: 수요일 오전 9:30~12:00
 * - friday: 금요일 오후 1:45~4:00
 * - saturday: 토요일 오후 1:45~4:00
 * - sunday: 일요일 오후 3:15~5:30
 */
export const DEFAULT_SCHEDULE_TIMES = {
  wednesday: {
    startTime: '09:30',
    endTime: '12:00',
  },
  friday: {
    startTime: '13:45',
    endTime: '16:00',
  },
  saturday: {
    startTime: '13:45',
    endTime: '16:00',
  },
  sunday: {
    startTime: '15:15',
    endTime: '17:30',
  },
}

/**
 * 요일별 전시대 봉사 일정
 * 각 요일별로 운영되는 봉사 장소 개수
 * - wednesday: 수요일 2곳
 * - friday: 금요일 1곳
 * - saturday: 토요일 2곳
 * - sunday: 일요일 1곳
 */
export const EXHIBIT_SCHEDULE = {
  wednesday: 2,
  friday: 1,
  saturday: 2,
  sunday: 1,
}
