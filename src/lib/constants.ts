/**
 * ============================================================================
 * 상수 정의 모듈
 * ============================================================================
 *
 * 이 모듈은 앱 전역에서 사용되는 상수 값들을 정의합니다.
 *
 * 주요 내용:
 * - SERVICE_TYPES: 봉사 유형별 설정 (전시대, 공원)
 * - DEFAULT_SCHEDULE_TIMES: 기본 봉사 시간 설정
 * ============================================================================
 */

import { ServiceTypeInfo } from '@/types'

/**
 * 봉사 통합 운영 시작일 (YYYY-MM-DD).
 * 이 날짜 이상의 일정은 전시대/공원 구분 없이 "공개 봉사"로 통합 표시되며,
 * 인원 제한과 마감 표시도 적용되지 않는다. (DB 데이터는 그대로 유지)
 */
export const UNIFIED_START_DATE = '2026-06-01'

/**
 * 주어진 일정 날짜(YYYY-MM-DD)가 통합 운영 시작일 이상인지 확인.
 */
export const isUnifiedDate = (date: string): boolean => date >= UNIFIED_START_DATE

/**
 * 봉사 유형 목록
 */
export const SERVICE_TYPES: ServiceTypeInfo[] = [
  {
    id: 'exhibit',
    name: '전시대 봉사',
    description: '씨젠, 롯데리아에서 진행되는 봉사입니다.',
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

