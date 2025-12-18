/**
 * ============================================================================
 * 읽음 처리 관리 훅
 * ============================================================================
 *
 * 공지사항/주제 읽음 상태를 관리하는 커스텀 훅입니다.
 *
 * 주요 기능:
 * - 읽음 기록 조회
 * - 읽음 처리
 * - 읽지 않은 항목 개수 조회
 *
 * 사용 예시:
 * const { isRead, markAsRead, unreadCount } = useUserReads(userId, 'notice')
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { UserRead } from '@/types'
import { userReadService } from '@/services'

/**
 * 훅 반환 타입
 */
interface UseUserReadsReturn {
  /** 읽음 기록 목록 */
  reads: UserRead[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 특정 항목이 읽혔는지 확인 */
  isRead: (targetId: string) => boolean
  /** 읽음 처리 */
  markAsRead: (targetId: string) => Promise<boolean>
  /** 데이터 새로고침 */
  refresh: () => Promise<void>
}

/**
 * 읽음 처리 관리 훅
 *
 * @param userId - 사용자 ID
 * @param targetType - 대상 유형 ('notice' | 'meeting_topic')
 * @returns 읽음 관련 상태 및 핸들러
 *
 * @example
 * function NoticePage() {
 *   const { isRead, markAsRead } = useUserReads(userId, 'notice')
 *
 *   const handleClick = async (noticeId: string) => {
 *     if (!isRead(noticeId)) {
 *       await markAsRead(noticeId)
 *     }
 *   }
 *
 *   return (
 *     <NoticeList
 *       notices={notices}
 *       isRead={isRead}
 *       onClick={handleClick}
 *     />
 *   )
 * }
 */
export function useUserReads(
  userId: string | undefined,
  targetType: 'notice' | 'meeting_topic'
): UseUserReadsReturn {
  const [reads, setReads] = useState<UserRead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 읽음 기록 로드
   */
  const loadReads = useCallback(async () => {
    if (!userId) {
      setReads([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const data = await userReadService.getByUser(userId, targetType)
      setReads(data)
    } catch (err) {
      console.error('읽음 기록 로드 실패:', err)
      setReads([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, targetType])

  // 초기 데이터 로드
  useEffect(() => {
    loadReads()
  }, [loadReads])

  /**
   * 특정 항목이 읽혔는지 확인
   *
   * @param targetId - 확인할 대상 ID
   * @returns 읽음 여부
   */
  const isRead = useCallback(
    (targetId: string): boolean => {
      return reads.some((r) => r.targetId === targetId)
    },
    [reads]
  )

  /**
   * 읽음 처리
   *
   * @param targetId - 읽음 처리할 대상 ID
   * @returns 성공 여부
   */
  const markAsRead = useCallback(
    async (targetId: string): Promise<boolean> => {
      if (!userId) return false
      if (isRead(targetId)) return true // 이미 읽은 경우

      try {
        const newRead = await userReadService.markAsRead(userId, targetType, targetId)
        setReads((prev) => [...prev, newRead])
        return true
      } catch (err) {
        console.error('읽음 처리 실패:', err)
        return false
      }
    },
    [userId, targetType, isRead]
  )

  return {
    reads,
    isLoading,
    isRead,
    markAsRead,
    refresh: loadReads,
  }
}

/**
 * 읽지 않은 항목 개수 훅
 *
 * @param userId - 사용자 ID
 * @returns 공지사항/주제별 읽지 않은 개수
 *
 * @example
 * function ServiceSelectPage() {
 *   const { unreadNoticeCount, unreadTopicCount } = useUnreadCounts(userId)
 *
 *   return (
 *     <>
 *       <Badge count={unreadNoticeCount} />
 *       <Badge count={unreadTopicCount} />
 *     </>
 *   )
 * }
 */
export function useUnreadCounts(userId: string | undefined): {
  unreadNoticeCount: number
  unreadTopicCount: number
  noticeCount: number
  topicCount: number
  isLoading: boolean
  refresh: () => Promise<void>
} {
  const [unreadNoticeCount, setUnreadNoticeCount] = useState(0)
  const [unreadTopicCount, setUnreadTopicCount] = useState(0)
  const [noticeCount, setNoticeCount] = useState(0)
  const [topicCount, setTopicCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 개수 로드
   */
  const loadCounts = useCallback(async () => {
    if (!userId) {
      setUnreadNoticeCount(0)
      setUnreadTopicCount(0)
      setNoticeCount(0)
      setTopicCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Supabase에서 직접 조회 (서비스 분리로 인한 의존성 최소화)
      const { supabase } = await import('@/lib/supabase')

      // 공지사항 개수
      const { count: notices } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (notices !== null) setNoticeCount(notices)

      // 주제 개수
      const { count: topics } = await supabase
        .from('meeting_topics')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (topics !== null) setTopicCount(topics)

      // 읽음 기록 조회
      const { data: reads } = await supabase
        .from('user_reads')
        .select('target_type, target_id')
        .eq('user_id', userId)

      const noticeReads = new Set(
        (reads || []).filter((r) => r.target_type === 'notice').map((r) => r.target_id)
      )
      const topicReads = new Set(
        (reads || []).filter((r) => r.target_type === 'meeting_topic').map((r) => r.target_id)
      )

      // 읽지 않은 공지사항
      const { data: activeNotices } = await supabase
        .from('notices')
        .select('id')
        .eq('is_active', true)

      const unreadNotices = (activeNotices || []).filter((n) => !noticeReads.has(n.id)).length
      setUnreadNoticeCount(unreadNotices)

      // 읽지 않은 주제
      const { data: activeTopics } = await supabase
        .from('meeting_topics')
        .select('id')
        .eq('is_active', true)

      const unreadTopics = (activeTopics || []).filter((t) => !topicReads.has(t.id)).length
      setUnreadTopicCount(unreadTopics)
    } catch (err) {
      console.error('읽지 않은 개수 로드 실패:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 초기 데이터 로드
  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  return {
    unreadNoticeCount,
    unreadTopicCount,
    noticeCount,
    topicCount,
    isLoading,
    refresh: loadCounts,
  }
}
