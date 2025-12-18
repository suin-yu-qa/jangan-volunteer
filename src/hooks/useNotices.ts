/**
 * ============================================================================
 * 공지사항 관리 훅
 * ============================================================================
 *
 * 공지사항 데이터를 관리하는 커스텀 훅입니다.
 *
 * 주요 기능:
 * - 공지사항 목록 조회 및 상태 관리
 * - 공지사항 생성/수정/삭제 (관리자용)
 * - 읽음 처리 (사용자용)
 *
 * 사용 예시:
 * const { notices, isLoading, handleCreate } = useNotices()
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { Notice } from '@/types'
import { noticeService } from '@/services'

/**
 * 훅 반환 타입 (사용자용)
 */
interface UseNoticesReturn {
  /** 활성화된 공지사항 목록 */
  notices: Notice[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 데이터 새로고침 */
  refresh: () => Promise<void>
}

/**
 * 훅 반환 타입 (관리자용)
 */
interface UseAdminNoticesReturn extends UseNoticesReturn {
  /** 전체 공지사항 목록 (비활성화 포함) */
  allNotices: Notice[]
  /** 공지사항 생성 */
  handleCreate: (title: string, content: string, adminId: string) => Promise<Notice | null>
  /** 공지사항 수정 */
  handleUpdate: (noticeId: string, title: string, content: string) => Promise<Notice | null>
  /** 공지사항 삭제 */
  handleDelete: (noticeId: string) => Promise<boolean>
  /** 활성화 상태 토글 */
  handleToggleActive: (noticeId: string, isActive: boolean) => Promise<boolean>
}

/**
 * 공지사항 조회 훅 (사용자용)
 *
 * @returns 공지사항 관련 상태
 *
 * @example
 * function NoticePage() {
 *   const { notices, isLoading } = useNotices()
 *
 *   if (isLoading) return <Loading />
 *
 *   return <NoticeList notices={notices} />
 * }
 */
export function useNotices(): UseNoticesReturn {
  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 활성화된 공지사항 로드
   */
  const loadNotices = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await noticeService.getActive()
      setNotices(data)
    } catch (err) {
      console.error('공지사항 로드 실패:', err)
      setNotices([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadNotices()
  }, [loadNotices])

  return {
    notices,
    isLoading,
    refresh: loadNotices,
  }
}

/**
 * 공지사항 관리 훅 (관리자용)
 *
 * @returns 공지사항 관련 상태 및 핸들러
 *
 * @example
 * function AdminNoticePage() {
 *   const { allNotices, handleCreate, handleDelete } = useAdminNotices()
 *
 *   const onCreate = async () => {
 *     await handleCreate('새 공지', '내용', adminId)
 *   }
 *
 *   return <NoticeManagement notices={allNotices} onDelete={handleDelete} />
 * }
 */
export function useAdminNotices(): UseAdminNoticesReturn {
  const [notices, setNotices] = useState<Notice[]>([])
  const [allNotices, setAllNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 전체 공지사항 로드
   */
  const loadNotices = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await noticeService.getAll()
      setAllNotices(data)
      setNotices(data.filter((n) => n.isActive))
    } catch (err) {
      console.error('공지사항 로드 실패:', err)
      setAllNotices([])
      setNotices([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadNotices()
  }, [loadNotices])

  /**
   * 공지사항 생성
   */
  const handleCreate = useCallback(
    async (title: string, content: string, adminId: string): Promise<Notice | null> => {
      try {
        const newNotice = await noticeService.create({ title, content, createdBy: adminId })
        await loadNotices()
        return newNotice
      } catch (err) {
        console.error('공지사항 생성 실패:', err)
        return null
      }
    },
    [loadNotices]
  )

  /**
   * 공지사항 수정
   */
  const handleUpdate = useCallback(
    async (noticeId: string, title: string, content: string): Promise<Notice | null> => {
      try {
        const updated = await noticeService.update(noticeId, { title, content })
        await loadNotices()
        return updated
      } catch (err) {
        console.error('공지사항 수정 실패:', err)
        return null
      }
    },
    [loadNotices]
  )

  /**
   * 공지사항 삭제
   */
  const handleDelete = useCallback(
    async (noticeId: string): Promise<boolean> => {
      try {
        await noticeService.delete(noticeId)
        await loadNotices()
        return true
      } catch (err) {
        console.error('공지사항 삭제 실패:', err)
        return false
      }
    },
    [loadNotices]
  )

  /**
   * 활성화 상태 토글
   */
  const handleToggleActive = useCallback(
    async (noticeId: string, isActive: boolean): Promise<boolean> => {
      try {
        await noticeService.toggleActive(noticeId, isActive)
        await loadNotices()
        return true
      } catch (err) {
        console.error('공지사항 상태 변경 실패:', err)
        return false
      }
    },
    [loadNotices]
  )

  return {
    notices,
    allNotices,
    isLoading,
    refresh: loadNotices,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
  }
}
