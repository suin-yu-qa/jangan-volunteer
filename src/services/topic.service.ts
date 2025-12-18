/**
 * ============================================================================
 * 봉사모임 주제 서비스 모듈
 * ============================================================================
 *
 * 봉사모임 주제(meeting_topics 테이블) 관련 API 호출 로직을 담당합니다.
 *
 * 주요 기능:
 * - 주제 목록 조회
 * - 주제 생성/수정/삭제
 * - 첨부파일 업로드/삭제
 * - 읽음 처리
 *
 * 사용 예시:
 * const topics = await topicService.getActive()
 * ============================================================================
 */

import { supabase } from '@/lib/supabase'
import { MeetingTopic, Attachment, UserRead } from '@/types'

/**
 * 봉사모임 주제 서비스 객체
 * 모든 주제 관련 API 호출 메서드를 포함
 */
export const topicService = {
  /**
   * 활성화된 주제 목록 조회
   *
   * @returns 활성화된 주제 목록 (최신순)
   */
  async getActive(): Promise<MeetingTopic[]> {
    const { data, error } = await supabase
      .from('meeting_topics')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('주제 조회 실패:', error)
      throw error
    }

    return (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      isActive: t.is_active,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  },

  /**
   * 전체 주제 목록 조회 (관리자용)
   *
   * @returns 전체 주제 목록 (최신순)
   */
  async getAll(): Promise<MeetingTopic[]> {
    const { data, error } = await supabase
      .from('meeting_topics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('주제 목록 조회 실패:', error)
      throw error
    }

    return (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      content: t.content,
      isActive: t.is_active,
      createdBy: t.created_by,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }))
  },

  /**
   * 주제 생성
   *
   * @param topic - 생성할 주제 정보
   * @returns 생성된 주제
   */
  async create(topic: {
    title: string
    content: string
    createdBy: string
  }): Promise<MeetingTopic> {
    const { data, error } = await supabase
      .from('meeting_topics')
      .insert({
        title: topic.title,
        content: topic.content,
        created_by: topic.createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('주제 생성 실패:', error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * 주제 수정
   *
   * @param topicId - 수정할 주제 ID
   * @param updates - 수정할 필드들
   * @returns 수정된 주제
   */
  async update(
    topicId: string,
    updates: { title?: string; content?: string }
  ): Promise<MeetingTopic> {
    const { data, error } = await supabase
      .from('meeting_topics')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', topicId)
      .select()
      .single()

    if (error) {
      console.error('주제 수정 실패:', error)
      throw error
    }

    return {
      id: data.id,
      title: data.title,
      content: data.content,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  /**
   * 주제 삭제
   *
   * @param topicId - 삭제할 주제 ID
   */
  async delete(topicId: string): Promise<void> {
    const { error } = await supabase
      .from('meeting_topics')
      .delete()
      .eq('id', topicId)

    if (error) {
      console.error('주제 삭제 실패:', error)
      throw error
    }
  },

  /**
   * 주제 활성화 상태 토글
   *
   * @param topicId - 주제 ID
   * @param isActive - 활성화 여부
   */
  async toggleActive(topicId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('meeting_topics')
      .update({ is_active: isActive })
      .eq('id', topicId)

    if (error) {
      console.error('주제 상태 변경 실패:', error)
      throw error
    }
  },

  /**
   * 활성화된 주제 개수 조회
   *
   * @returns 활성화된 주제 개수
   */
  async getActiveCount(): Promise<number> {
    const { count, error } = await supabase
      .from('meeting_topics')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      console.error('주제 개수 조회 실패:', error)
      throw error
    }

    return count || 0
  },
}

/**
 * 첨부파일 서비스 객체
 * 첨부파일 관련 API 호출 메서드를 포함
 */
export const attachmentService = {
  /**
   * 대상별 첨부파일 목록 조회
   *
   * @param targetType - 대상 유형 ('notice' | 'meeting_topic')
   * @param targetId - 대상 ID
   * @returns 첨부파일 목록 (URL 포함)
   */
  async getByTarget(
    targetType: 'notice' | 'meeting_topic',
    targetId: string
  ): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId)

    if (error) {
      console.error('첨부파일 조회 실패:', error)
      throw error
    }

    // 각 파일의 공개 URL 생성
    return (data || []).map((a) => {
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(a.file_path)

      return {
        id: a.id,
        fileName: a.file_name,
        filePath: a.file_path,
        fileType: a.file_type,
        fileSize: a.file_size,
        targetType: a.target_type,
        targetId: a.target_id,
        uploadedBy: a.uploaded_by,
        createdAt: a.created_at,
        url: urlData.publicUrl,
      }
    })
  },

  /**
   * 첨부파일 업로드
   *
   * @param file - 업로드할 파일
   * @param targetType - 대상 유형
   * @param targetId - 대상 ID
   * @param uploadedBy - 업로드한 관리자 ID
   * @returns 업로드된 첨부파일 정보
   */
  async upload(
    file: File,
    targetType: 'notice' | 'meeting_topic',
    targetId: string,
    uploadedBy: string
  ): Promise<Attachment> {
    // 고유 파일명 생성
    const timestamp = Date.now()
    const filePath = `${targetType}s/${targetId}/${timestamp}_${file.name}`

    // Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('파일 업로드 실패:', uploadError)
      throw uploadError
    }

    // DB에 메타데이터 저장
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        target_type: targetType,
        target_id: targetId,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (error) {
      console.error('첨부파일 메타데이터 저장 실패:', error)
      throw error
    }

    const { data: urlData } = supabase.storage
      .from('attachments')
      .getPublicUrl(filePath)

    return {
      id: data.id,
      fileName: data.file_name,
      filePath: data.file_path,
      fileType: data.file_type,
      fileSize: data.file_size,
      targetType: data.target_type,
      targetId: data.target_id,
      uploadedBy: data.uploaded_by,
      createdAt: data.created_at,
      url: urlData.publicUrl,
    }
  },

  /**
   * 첨부파일 삭제
   *
   * @param attachmentId - 삭제할 첨부파일 ID
   * @param filePath - Storage 파일 경로
   */
  async delete(attachmentId: string, filePath: string): Promise<void> {
    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath])

    if (storageError) {
      console.error('Storage 파일 삭제 실패:', storageError)
      throw storageError
    }

    // DB에서 메타데이터 삭제
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId)

    if (error) {
      console.error('첨부파일 메타데이터 삭제 실패:', error)
      throw error
    }
  },
}

/**
 * 읽음 처리 서비스 객체
 * 읽음 기록 관련 API 호출 메서드를 포함
 */
export const userReadService = {
  /**
   * 사용자의 읽음 기록 조회
   *
   * @param userId - 사용자 ID
   * @param targetType - 대상 유형 (선택)
   * @returns 읽음 기록 목록
   */
  async getByUser(
    userId: string,
    targetType?: 'notice' | 'meeting_topic'
  ): Promise<UserRead[]> {
    let query = supabase
      .from('user_reads')
      .select('*')
      .eq('user_id', userId)

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data, error } = await query

    if (error) {
      console.error('읽음 기록 조회 실패:', error)
      throw error
    }

    return (data || []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      targetType: r.target_type,
      targetId: r.target_id,
      readAt: r.read_at,
    }))
  },

  /**
   * 읽음 처리
   *
   * @param userId - 사용자 ID
   * @param targetType - 대상 유형
   * @param targetId - 대상 ID
   * @returns 생성된 읽음 기록
   */
  async markAsRead(
    userId: string,
    targetType: 'notice' | 'meeting_topic',
    targetId: string
  ): Promise<UserRead> {
    const { data, error } = await supabase
      .from('user_reads')
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      })
      .select()
      .single()

    if (error) {
      console.error('읽음 처리 실패:', error)
      throw error
    }

    return {
      id: data.id,
      userId: data.user_id,
      targetType: data.target_type,
      targetId: data.target_id,
      readAt: data.read_at,
    }
  },

  /**
   * 읽지 않은 항목 개수 조회
   *
   * @param userId - 사용자 ID
   * @param targetType - 대상 유형
   * @param activeIds - 활성화된 항목 ID 목록
   * @returns 읽지 않은 항목 개수
   */
  async getUnreadCount(
    userId: string,
    targetType: 'notice' | 'meeting_topic',
    activeIds: string[]
  ): Promise<number> {
    if (activeIds.length === 0) return 0

    const { data, error } = await supabase
      .from('user_reads')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', targetType)

    if (error) {
      console.error('읽음 기록 조회 실패:', error)
      throw error
    }

    const readIds = new Set((data || []).map((r) => r.target_id))
    return activeIds.filter((id) => !readIds.has(id)).length
  },
}
