/**
 * ============================================================================
 * 봉사모임 주제 페이지 (사용자용)
 * ============================================================================
 *
 * 관리자가 등록한 봉사모임 주제를 확인하는 페이지입니다.
 *
 * 주요 기능:
 * - 활성화된 봉사모임 주제 목록 조회
 * - 주제 상세 내용 확인
 * - 첨부파일 다운로드
 * - 읽음 처리 (NEW 배지 제거)
 *
 * NEW 배지:
 * - 아직 읽지 않은 주제에 표시
 * - 주제 클릭 시 읽음 처리되어 배지 제거
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/context/UserContext'
import { supabase } from '@/lib/supabase'
import { MeetingTopic, Attachment, UserRead } from '@/types'

export default function TopicPage() {
  const navigate = useNavigate()
  const { user, logout } = useUser()

  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({})
  const [userReads, setUserReads] = useState<UserRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      loadTopics()
      loadUserReads()
    }
  }, [user])

  /**
   * 주제 목록 로드
   */
  const loadTopics = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('meeting_topics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const topicList: MeetingTopic[] = data.map((t) => ({
          id: t.id,
          title: t.title,
          content: t.content || '',
          isActive: t.is_active,
          createdBy: t.created_by,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
        setTopics(topicList)

        // 첨부파일 로드
        if (topicList.length > 0) {
          await loadAttachments(topicList.map((t) => t.id))
        }
      }
    } catch (err) {
      console.error('Failed to load topics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 첨부파일 로드
   */
  const loadAttachments = async (topicIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('target_type', 'meeting_topic')
        .in('target_id', topicIds)

      if (error) throw error

      if (data) {
        const attachmentMap: Record<string, Attachment[]> = {}
        for (const a of data) {
          const attachment: Attachment = {
            id: a.id,
            fileName: a.file_name,
            filePath: a.file_path,
            fileType: a.file_type,
            fileSize: a.file_size,
            targetType: a.target_type,
            targetId: a.target_id,
            uploadedBy: a.uploaded_by,
            createdAt: a.created_at,
          }

          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(a.file_path)
          attachment.url = urlData.publicUrl

          if (!attachmentMap[a.target_id]) {
            attachmentMap[a.target_id] = []
          }
          attachmentMap[a.target_id].push(attachment)
        }
        setAttachments(attachmentMap)
      }
    } catch (err) {
      console.error('Failed to load attachments:', err)
    }
  }

  /**
   * 사용자 읽음 기록 로드
   */
  const loadUserReads = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_reads')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_type', 'meeting_topic')

      if (error) throw error

      if (data) {
        const reads: UserRead[] = data.map((r) => ({
          id: r.id,
          userId: r.user_id,
          targetType: r.target_type,
          targetId: r.target_id,
          readAt: r.read_at,
        }))
        setUserReads(reads)
      }
    } catch (err) {
      console.error('Failed to load user reads:', err)
    }
  }

  /**
   * 주제가 읽음 처리되었는지 확인
   */
  const isRead = (topicId: string): boolean => {
    return userReads.some((r) => r.targetId === topicId)
  }

  /**
   * 주제 클릭 핸들러 (확장 + 읽음 처리)
   */
  const handleTopicClick = async (topicId: string) => {
    // 확장/축소 토글
    if (expandedId === topicId) {
      setExpandedId(null)
    } else {
      setExpandedId(topicId)

      // 읽음 처리
      if (!isRead(topicId) && user) {
        try {
          const { data, error } = await supabase
            .from('user_reads')
            .insert({
              user_id: user.id,
              target_type: 'meeting_topic',
              target_id: topicId,
            })
            .select()
            .single()

          if (!error && data) {
            const newRead: UserRead = {
              id: data.id,
              userId: data.user_id,
              targetType: data.target_type,
              targetId: data.target_id,
              readAt: data.read_at,
            }
            setUserReads((prev) => [...prev, newRead])
          }
        } catch (err) {
          console.error('Failed to mark as read:', err)
        }
      }
    }
  }

  /**
   * 파일 크기 포맷
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  /**
   * 파일 아이콘 반환
   */
  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('video')) return '🎬'
    return '📎'
  }

  /**
   * 상대적 시간 표시
   */
  const getRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '오늘'
    if (days === 1) return '어제'
    if (days < 7) return `${days}일 전`
    if (days < 30) return `${Math.floor(days / 7)}주 전`
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  if (!user) return null

  // 읽지 않은 주제 개수
  const unreadCount = topics.filter((t) => !isRead(t.id)).length

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/select')}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">봉사모임 주제</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {/* 읽지 않은 주제 배지 */}
        {unreadCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <span className="badge badge-blue">NEW</span>
            <span className="text-sm text-blue-700">
              읽지 않은 주제가 {unreadCount}개 있습니다
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : topics.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            등록된 봉사모임 주제가 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => {
              const topicAttachments = attachments[topic.id] || []
              const isExpanded = expandedId === topic.id
              const hasRead = isRead(topic.id)

              return (
                <div
                  key={topic.id}
                  className="card p-0 overflow-hidden"
                >
                  {/* 헤더 (클릭 가능) */}
                  <div
                    onClick={() => handleTopicClick(topic.id)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!hasRead && (
                          <span className="badge badge-blue flex-shrink-0">NEW</span>
                        )}
                        <h3
                          className={`font-medium truncate ${
                            hasRead ? 'text-gray-600' : 'text-gray-800'
                          }`}
                        >
                          {topic.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-xs text-gray-400">
                          {getRelativeTime(topic.createdAt)}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* 첨부파일 개수 표시 */}
                    {topicAttachments.length > 0 && !isExpanded && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        첨부파일 {topicAttachments.length}개
                      </div>
                    )}
                  </div>

                  {/* 확장 콘텐츠 */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      {/* 내용 */}
                      {topic.content && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                          {topic.content}
                        </p>
                      )}

                      {/* 첨부파일 목록 */}
                      {topicAttachments.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-2 font-medium">
                            첨부파일
                          </div>
                          <div className="space-y-2">
                            {topicAttachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                <span className="text-lg">{getFileIcon(att.fileType)}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-gray-800 truncate">
                                    {att.fileName}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatFileSize(att.fileSize)}
                                  </div>
                                </div>
                                <svg
                                  className="w-5 h-5 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 내용과 첨부파일 모두 없는 경우 */}
                      {!topic.content && topicAttachments.length === 0 && (
                        <p className="text-sm text-gray-400 text-center">
                          내용이 없습니다
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
