/**
 * ============================================================================
 * 사용자 서비스 모듈
 * ============================================================================
 *
 * 봉사자 사용자(users 테이블) 관련 API 호출 로직을 담당합니다.
 *
 * 주요 기능:
 * - 사용자 로그인 (이름으로 조회 또는 생성)
 * - 사용자 목록 조회
 * - 사용자 승인/미승인 처리
 * - 사용자 삭제
 *
 * 사용 예시:
 * const user = await userService.loginByName('홍길동')
 * ============================================================================
 */

import { supabase } from '@/lib/supabase'
import { User } from '@/types'

/**
 * 사용자 서비스 객체
 * 모든 사용자 관련 API 호출 메서드를 포함
 */
export const userService = {
  /**
   * 이름으로 사용자 로그인
   * 존재하지 않으면 새 사용자 생성 (미승인 상태)
   *
   * @param name - 사용자 이름
   * @returns 사용자 정보
   *
   * @example
   * const user = await userService.loginByName('홍길동')
   */
  async loginByName(name: string): Promise<User> {
    // 기존 사용자 조회
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .single()

    if (existingUser && !selectError) {
      return {
        id: existingUser.id,
        name: existingUser.name,
        isApproved: existingUser.is_approved,
        createdAt: existingUser.created_at,
      }
    }

    // 새 사용자 생성
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ name, is_approved: false })
      .select()
      .single()

    if (insertError) {
      console.error('사용자 생성 실패:', insertError)
      throw insertError
    }

    return {
      id: newUser.id,
      name: newUser.name,
      isApproved: newUser.is_approved,
      createdAt: newUser.created_at,
    }
  },

  /**
   * 전체 사용자 목록 조회
   *
   * @returns 사용자 목록 (생성일 기준 내림차순)
   */
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('사용자 목록 조회 실패:', error)
      throw error
    }

    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      isApproved: u.is_approved,
      createdAt: u.created_at,
    }))
  },

  /**
   * 승인된 사용자 목록 조회
   *
   * @returns 승인된 사용자 목록
   */
  async getApproved(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_approved', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('승인된 사용자 조회 실패:', error)
      throw error
    }

    return (data || []).map((u) => ({
      id: u.id,
      name: u.name,
      isApproved: u.is_approved,
      createdAt: u.created_at,
    }))
  },

  /**
   * 사용자 승인 상태 변경
   *
   * @param userId - 사용자 ID
   * @param isApproved - 승인 여부
   */
  async updateApproval(userId: string, isApproved: boolean): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ is_approved: isApproved })
      .eq('id', userId)

    if (error) {
      console.error('사용자 승인 상태 변경 실패:', error)
      throw error
    }
  },

  /**
   * 사용자 삭제
   *
   * @param userId - 삭제할 사용자 ID
   */
  async delete(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('사용자 삭제 실패:', error)
      throw error
    }
  },
}
