/**
 * ============================================================================
 * 타입 정의 모듈
 * ============================================================================
 *
 * 이 모듈은 앱 전역에서 사용되는 TypeScript 타입과 인터페이스를 정의합니다.
 *
 * 주요 타입:
 * - ServiceType: 봉사 유형 (전시대, 공원, 버스정류장)
 * - User: 봉사자 사용자 정보
 * - Admin: 관리자 계정 정보
 * - Schedule: 봉사 일정 정보
 * - Registration: 봉사 신청 내역
 * - Notice: 공지사항 정보
 * ============================================================================
 */

/* ==========================================================================
   봉사 유형 관련 타입
   ========================================================================== */

/**
 * 봉사 유형 리터럴 타입
 * - exhibit: 전시대 봉사
 * - park: 공원 봉사
 * - bus_stop: 버스 정류장 봉사
 */
export type ServiceType = 'exhibit' | 'park' | 'bus_stop'

/**
 * 봉사 유형 상세 정보
 */
export interface ServiceTypeInfo {
  id: ServiceType           // 봉사 유형 고유 식별자
  name: string              // 표시용 이름
  description: string       // 봉사 설명
  icon: string              // 이모지 아이콘
  customIcon?: boolean      // 커스텀 아이콘 사용 여부
  hasLimit: boolean         // 월별 참여 제한 여부
  monthlyLimit?: number     // 월별 최대 참여 횟수
}

/* ==========================================================================
   사용자 관련 타입
   ========================================================================== */

/**
 * 봉사자 사용자 정보
 */
export interface User {
  id: string                // 고유 식별자 (UUID)
  name: string              // 사용자 이름
  isApproved: boolean       // 관리자 승인 여부
  createdAt: string         // 계정 생성 일시
}

/**
 * 관리자 계정 정보
 */
export interface Admin {
  id: string                // 고유 식별자 (UUID)
  kakaoId: string           // 카카오 로그인 ID (사용 안함)
  name: string              // 관리자 이름
  email: string             // 이메일 주소
  createdAt: string         // 계정 생성 일시
}

/* ==========================================================================
   봉사 일정 관련 타입
   ========================================================================== */

/**
 * 봉사 일정 정보
 */
export interface Schedule {
  id: string                    // 고유 식별자 (UUID)
  serviceType: ServiceType      // 봉사 유형
  date: string                  // 봉사 날짜 (YYYY-MM-DD)
  location: string              // 봉사 장소
  startTime: string             // 시작 시간 (HH:mm)
  endTime: string               // 종료 시간 (HH:mm)
  shiftCount: number            // 교대 횟수 (3 또는 4)
  participantsPerShift: number  // 교대당 참여 인원 수 (기본 2)
  createdBy: string             // 생성한 관리자 ID
  createdAt: string             // 일정 생성 일시
}

/**
 * 봉사 신청 내역
 */
export interface Registration {
  id: string                // 고유 식별자 (UUID)
  scheduleId: string        // 신청한 일정 ID
  userId: string            // 신청자 ID
  userName?: string         // 신청자 이름 (조인 시 포함)
  shiftNumber: number       // 신청한 교대 번호 (1, 2, 3, 4)
  createdAt: string         // 신청 일시
}

/**
 * 교대 정보 (일정 조회 시 계산되는 값)
 */
export interface ShiftInfo {
  shiftNumber: number           // 교대 번호
  startTime: string             // 교대 시작 시간
  endTime: string               // 교대 종료 시간
  registrations: Registration[] // 해당 교대 신청 내역
  availableSlots: number        // 남은 신청 가능 인원
}

/**
 * 일정 상세 정보 (신청 내역 포함)
 * Schedule 인터페이스를 확장하여 교대별 신청 현황 포함
 */
export interface ScheduleWithRegistrations extends Schedule {
  shifts: ShiftInfo[]           // 교대별 상세 정보
  totalRegistrations: number    // 전체 신청 인원 수
  totalSlots: number            // 전체 신청 가능 인원 수
}

/* ==========================================================================
   공지사항 관련 타입
   ========================================================================== */

/**
 * 공지사항 정보
 */
export interface Notice {
  id: string                // 고유 식별자 (UUID)
  title: string             // 공지사항 제목
  content: string           // 공지사항 내용
  isActive: boolean         // 활성화 여부 (표시 여부)
  createdBy: string         // 작성한 관리자 ID
  createdAt: string         // 작성 일시
}

/* ==========================================================================
   봉사모임 주제 관련 타입
   ========================================================================== */

/**
 * 봉사모임 주제 정보
 */
export interface MeetingTopic {
  id: string                // 고유 식별자 (UUID)
  title: string             // 주제 제목
  content: string           // 주제 내용/설명
  isActive: boolean         // 활성화 여부
  createdBy: string         // 작성한 관리자 ID
  createdAt: string         // 작성 일시
  updatedAt: string         // 수정 일시
}

/**
 * 첨부파일 정보
 */
export interface Attachment {
  id: string                // 고유 식별자 (UUID)
  fileName: string          // 원본 파일명
  filePath: string          // Storage 경로
  fileType: string          // MIME 타입
  fileSize: number          // 파일 크기 (bytes)
  targetType: 'notice' | 'meeting_topic'  // 대상 유형
  targetId: string          // 대상 ID
  uploadedBy: string        // 업로드한 관리자 ID
  createdAt: string         // 업로드 일시
  url?: string              // 다운로드 URL (프론트엔드에서 생성)
}

/**
 * 사용자 읽음 기록
 */
export interface UserRead {
  id: string                // 고유 식별자 (UUID)
  userId: string            // 사용자 ID
  targetType: 'notice' | 'meeting_topic'  // 대상 유형
  targetId: string          // 대상 ID
  readAt: string            // 읽은 일시
}
