/**
 * ============================================================================
 * Supabase 클라이언트 모듈
 * ============================================================================
 *
 * 이 모듈은 Supabase 데이터베이스 연결 및 타입 정의를 담당합니다.
 *
 * 주요 기능:
 * - Supabase 클라이언트 초기화 및 내보내기
 * - 데이터베이스 테이블 스키마 타입 정의
 *
 * 사용되는 테이블:
 * - users: 봉사자 사용자 정보
 * - admins: 관리자 계정 정보
 * - schedules: 봉사 일정 정보
 * - registrations: 봉사 신청 내역
 *
 * 환경변수:
 * - VITE_SUPABASE_URL: Supabase 프로젝트 URL
 * - VITE_SUPABASE_ANON_KEY: Supabase 익명 접근 키
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js'

// 환경변수에서 Supabase 설정 읽기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Supabase 클라이언트 인스턴스 생성 및 내보내기
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 데이터베이스 스키마 타입 정의
 * Supabase에서 생성된 테이블 구조를 TypeScript 타입으로 정의
 */
export interface Database {
  public: {
    Tables: {
      /**
       * users 테이블: 봉사자 사용자 정보
       * - id: 고유 식별자 (UUID)
       * - name: 사용자 이름
       * - created_at: 계정 생성 일시
       */
      users: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }

      /**
       * admins 테이블: 관리자 계정 정보
       * - id: 고유 식별자 (UUID)
       * - kakao_id: 카카오 로그인 ID (선택)
       * - name: 관리자 이름
       * - email: 이메일 주소
       * - username: 로그인용 아이디
       * - password: 로그인용 비밀번호
       * - created_at: 계정 생성 일시
       */
      admins: {
        Row: {
          id: string
          kakao_id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          kakao_id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          kakao_id?: string
          name?: string
          email?: string
          created_at?: string
        }
      }

      /**
       * schedules 테이블: 봉사 일정 정보
       * - id: 고유 식별자 (UUID)
       * - service_type: 봉사 유형 (exhibit, park, bus_stop)
       * - date: 봉사 날짜 (YYYY-MM-DD)
       * - location: 봉사 장소
       * - start_time: 시작 시간
       * - end_time: 종료 시간
       * - shift_count: 교대 횟수
       * - participants_per_shift: 교대당 참여 인원 수
       * - created_by: 생성한 관리자 ID
       * - created_at: 일정 생성 일시
       */
      schedules: {
        Row: {
          id: string
          service_type: string
          date: string
          location: string
          start_time: string
          end_time: string
          shift_count: number
          participants_per_shift: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          service_type: string
          date: string
          location: string
          start_time: string
          end_time: string
          shift_count: number
          participants_per_shift: number
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          service_type?: string
          date?: string
          location?: string
          start_time?: string
          end_time?: string
          shift_count?: number
          participants_per_shift?: number
          created_by?: string
          created_at?: string
        }
      }

      /**
       * registrations 테이블: 봉사 신청 내역
       * - id: 고유 식별자 (UUID)
       * - schedule_id: 신청한 일정 ID (schedules 테이블 참조)
       * - user_id: 신청자 ID (users 테이블 참조)
       * - shift_number: 신청한 교대 번호
       * - created_at: 신청 일시
       */
      registrations: {
        Row: {
          id: string
          schedule_id: string
          user_id: string
          shift_number: number
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          user_id: string
          shift_number: number
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          user_id?: string
          shift_number?: number
          created_at?: string
        }
      }
    }
  }
}
