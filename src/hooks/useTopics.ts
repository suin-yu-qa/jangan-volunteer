/**
 * ============================================================================
 * 봉사모임 주제 관리 훅
 * ============================================================================
 *
 * 봉사모임 주제 데이터를 관리하는 커스텀 훅입니다.
 *
 * 주요 기능:
 * - 주제 목록 조회 및 상태 관리
 * - 주제 생성/수정/삭제 (관리자용)
 * - 첨부파일 업로드/삭제
 *
 * 사용 예시:
 * const { topics, isLoading, handleCreate } = useTopics()
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { MeetingTopic, Attachment } from '@/types'
import { topicService, attachmentService } from '@/services'

/**
 * 훅 반환 타입 (사용자용)
 */
interface UseTopicsReturn {
  /** 활성화된 주제 목록 */
  topics: MeetingTopic[]
  /** 로딩 상태 */
  isLoading: boolean
  /** 데이터 새로고침 */
  refresh: () => Promise<void>
  /** 주제별 첨부파일 조회 */
  getAttachments: (topicId: string) => Promise<Attachment[]>
}

/**
 * 훅 반환 타입 (관리자용)
 */
interface UseAdminTopicsReturn extends UseTopicsReturn {
  /** 전체 주제 목록 (비활성화 포함) */
  allTopics: MeetingTopic[]
  /** 주제 생성 */
  handleCreate: (title: string, content: string, adminId: string) => Promise<MeetingTopic | null>
  /** 주제 수정 */
  handleUpdate: (topicId: string, title: string, content: string) => Promise<MeetingTopic | null>
  /** 주제 삭제 */
  handleDelete: (topicId: string) => Promise<boolean>
  /** 활성화 상태 토글 */
  handleToggleActive: (topicId: string, isActive: boolean) => Promise<boolean>
  /** 파일 업로드 */
  handleUploadFile: (file: File, topicId: string, adminId: string) => Promise<Attachment | null>
  /** 파일 삭제 */
  handleDeleteFile: (attachmentId: string, filePath: string) => Promise<boolean>
}

/**
 * 봉사모임 주제 조회 훅 (사용자용)
 *
 * @returns 주제 관련 상태
 *
 * @example
 * function TopicPage() {
 *   const { topics, isLoading, getAttachments } = useTopics()
 *
 *   if (isLoading) return <Loading />
 *
 *   return <TopicList topics={topics} />
 * }
 */
export function useTopics(): UseTopicsReturn {
  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 활성화된 주제 로드
   */
  const loadTopics = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await topicService.getActive()
      setTopics(data)
    } catch (err) {
      console.error('주제 로드 실패:', err)
      setTopics([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 주제별 첨부파일 조회
   */
  const getAttachments = useCallback(async (topicId: string): Promise<Attachment[]> => {
    try {
      return await attachmentService.getByTarget('meeting_topic', topicId)
    } catch (err) {
      console.error('첨부파일 조회 실패:', err)
      return []
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  return {
    topics,
    isLoading,
    refresh: loadTopics,
    getAttachments,
  }
}

/**
 * 봉사모임 주제 관리 훅 (관리자용)
 *
 * @returns 주제 관련 상태 및 핸들러
 *
 * @example
 * function AdminTopicPage() {
 *   const { allTopics, handleCreate, handleUploadFile } = useAdminTopics()
 *
 *   const onCreate = async () => {
 *     const topic = await handleCreate('새 주제', '내용', adminId)
 *     if (topic && file) {
 *       await handleUploadFile(file, topic.id, adminId)
 *     }
 *   }
 *
 *   return <TopicManagement topics={allTopics} />
 * }
 */
export function useAdminTopics(): UseAdminTopicsReturn {
  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [allTopics, setAllTopics] = useState<MeetingTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * 전체 주제 로드
   */
  const loadTopics = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await topicService.getAll()
      setAllTopics(data)
      setTopics(data.filter((t) => t.isActive))
    } catch (err) {
      console.error('주제 로드 실패:', err)
      setAllTopics([])
      setTopics([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 주제별 첨부파일 조회
   */
  const getAttachments = useCallback(async (topicId: string): Promise<Attachment[]> => {
    try {
      return await attachmentService.getByTarget('meeting_topic', topicId)
    } catch (err) {
      console.error('첨부파일 조회 실패:', err)
      return []
    }
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  /**
   * 주제 생성
   */
  const handleCreate = useCallback(
    async (title: string, content: string, adminId: string): Promise<MeetingTopic | null> => {
      try {
        const newTopic = await topicService.create({ title, content, createdBy: adminId })
        await loadTopics()
        return newTopic
      } catch (err) {
        console.error('주제 생성 실패:', err)
        return null
      }
    },
    [loadTopics]
  )

  /**
   * 주제 수정
   */
  const handleUpdate = useCallback(
    async (topicId: string, title: string, content: string): Promise<MeetingTopic | null> => {
      try {
        const updated = await topicService.update(topicId, { title, content })
        await loadTopics()
        return updated
      } catch (err) {
        console.error('주제 수정 실패:', err)
        return null
      }
    },
    [loadTopics]
  )

  /**
   * 주제 삭제
   */
  const handleDelete = useCallback(
    async (topicId: string): Promise<boolean> => {
      try {
        await topicService.delete(topicId)
        await loadTopics()
        return true
      } catch (err) {
        console.error('주제 삭제 실패:', err)
        return false
      }
    },
    [loadTopics]
  )

  /**
   * 활성화 상태 토글
   */
  const handleToggleActive = useCallback(
    async (topicId: string, isActive: boolean): Promise<boolean> => {
      try {
        await topicService.toggleActive(topicId, isActive)
        await loadTopics()
        return true
      } catch (err) {
        console.error('주제 상태 변경 실패:', err)
        return false
      }
    },
    [loadTopics]
  )

  /**
   * 파일 업로드
   */
  const handleUploadFile = useCallback(
    async (file: File, topicId: string, adminId: string): Promise<Attachment | null> => {
      try {
        return await attachmentService.upload(file, 'meeting_topic', topicId, adminId)
      } catch (err) {
        console.error('파일 업로드 실패:', err)
        return null
      }
    },
    []
  )

  /**
   * 파일 삭제
   */
  const handleDeleteFile = useCallback(
    async (attachmentId: string, filePath: string): Promise<boolean> => {
      try {
        await attachmentService.delete(attachmentId, filePath)
        return true
      } catch (err) {
        console.error('파일 삭제 실패:', err)
        return false
      }
    },
    []
  )

  return {
    topics,
    allTopics,
    isLoading,
    refresh: loadTopics,
    getAttachments,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
    handleUploadFile,
    handleDeleteFile,
  }
}
