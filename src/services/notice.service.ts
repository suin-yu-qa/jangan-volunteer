/**
 * ============================================================================
 * 공지사항 서비스 모듈
 * ============================================================================
 *
 * 공지사항(notices 테이블) 관련 API 호출 로직을 담당합니다.
 *
 * 주요 기능:
 * - 활성화된 공지사항 목록 조회
 * - 공지사항 생성/수정/삭제
 * - 공지사항 활성화 상태 토글
 *
 * 사용 예시:
 * const notices = await noticeService.getActive()
 * ============================================================================
 */

import { supabase } from '@/lib/supabase'
import { Notice } from '@/types'

/**
 * 공지사항 서비스 객체
 * 모든 공지사항 관련 API 호출 메서드를 포함
 */
export const noticeService = {
  /**
   * 활성화된 공지사항 목록 조회
   *
   * @returns 활성화된 공지사항 목록 (최신순)
   */
  async getActive(): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('공지사항 조회 실패:', error)
      throw error
    }

    return (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      isActive: n.is_active,
      createdBy: n.created_by,
      createdAt: n.created_at,
    }))
  },

  /**
   * 전체 공지사항 목록 조회 (관리자용)
   *
   * @returns 전체 공지사항 목록 (최신순)
   */
  async getAll(): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('공지사항 목록 조회 실패:', error)
      throw error
    }

    return (data || []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      isActive: n.is_active,
      createdBy: n.created_by,
      createdAt: n.created_at,
    }))
  },

  /**
   * 공지사항 생성
   *
   * @param notice - 생성할 공지사항 정보
   * @returns 생성된 공지사항
   */
  async create(notice: {
    title: string
    content: string
    createdBy: string
  }): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .insert({
        title: notice.title,
        content: notice.content,
        created_by: notice.createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('공지사항 생성 실패:', error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
    }
  },

  /**
   * 공지사항 수정
   *
   * @param noticeId - 수정할 공지사항 ID
   * @param updates - 수정할 필드들
   * @returns 수정된 공지사항
   */
  async update(
    noticeId: string,
    updates: { title?: string; content?: string }
  ): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .update(updates)
      .eq('id', noticeId)
      .select()
      .single()

    if (error) {
      console.error('공지사항 수정 실패:', error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
    }
  },

  /**
   * 공지사항 삭제
   *
   * @param noticeId - 삭제할 공지사항 ID
   */
  async delete(noticeId: string): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId)

    if (error) {
      console.error('공지사항 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 공지사항 활성화 상태 토글
   *
   * @param noticeId - 공지사항 ID
   * @param isActive - 활성화 여부
   */
  async toggleActive(noticeId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .update({ is_active: isActive })
      .eq('id', noticeId)

    if (error) {
      console.error('공지사항 상태 변경 실패:', error)
      throw error
    }
  },

  /**
   * 활성화된 공지사항 개수 조회
   *
   * @returns 활성화된 공지사항 개수
   */
  async getActiveCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notices')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      console.error('공지사항 개수 조회 실패:', error)
      throw error
    }

    return count || 0
  },
}
