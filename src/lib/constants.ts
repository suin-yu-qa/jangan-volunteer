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

/**
 * 전시대 봉사 장소 목록
 */
export const EXHIBIT_LOCATIONS = ['씨젠', '이화수']

/**
 * 기본 봉사 시간 설정
 * - weekday: 평일 봉사 시간
 * - weekend: 주말 봉사 시간
 */
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
