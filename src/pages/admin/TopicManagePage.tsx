/**
 * ============================================================================
 * 봉사모임 주제 관리 페이지 (관리자용)
 * ============================================================================
 *
 * 봉사모임 주제를 생성, 조회, 수정, 삭제하는 관리 페이지입니다.
 *
 * 주요 기능:
 * - 봉사모임 주제 목록 조회
 * - 새 주제 작성 (제목, 내용, 첨부파일, 활성화 여부)
 * - 파일 업로드 (PDF, 이미지 등)
 * - 주제 수정 및 삭제
 * - 활성화/비활성화 토글
 *
 * 첨부파일:
 * - PDF, JPG, PNG 등 지원
 * - Supabase Storage에 저장
 * - 다운로드 링크 제공
 * ============================================================================
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { MeetingTopic, Attachment } from '@/types'

export default function TopicManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTopic, setEditingTopic] = useState<MeetingTopic | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadTopics()
    }
  }, [isLoggedIn])

  /**
   * 주제 목록 로드
   */
  const loadTopics = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('meeting_topics')
        .select('*')
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
   * 모달 열기
   */
  const handleOpenModal = (topic?: MeetingTopic) => {
    if (topic) {
      setEditingTopic(topic)
      setFormData({
        title: topic.title,
        content: topic.content,
        isActive: topic.isActive,
      })
    } else {
      setEditingTopic(null)
      setFormData({
        title: '',
        content: '',
        isActive: true,
      })
    }
    setSelectedFiles([])
    setShowModal(true)
  }

  /**
   * 모달 닫기
   */
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTopic(null)
    setFormData({ title: '', content: '', isActive: true })
    setSelectedFiles([])
  }

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      // 최대 5개 파일, 각 10MB 제한
      const validFiles = fileArray.filter((f) => f.size <= 10 * 1024 * 1024)
      if (validFiles.length !== fileArray.length) {
        alert('10MB를 초과하는 파일은 업로드할 수 없습니다.')
      }
      setSelectedFiles((prev) => [...prev, ...validFiles].slice(0, 5))
    }
    // 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 선택된 파일 제거
   */
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * 파일 업로드
   */
  const uploadFiles = async (topicId: string): Promise<boolean> => {
    if (!admin || selectedFiles.length === 0) return true

    setIsUploading(true)
    try {
      for (const file of selectedFiles) {
        // 고유 파일명 생성
        const timestamp = Date.now()
        const filePath = `meeting_topics/${topicId}/${timestamp}_${file.name}`

        // Storage에 업로드
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('File upload error:', uploadError)
          continue
        }

        // 첨부파일 레코드 생성
        await supabase.from('attachments').insert({
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          target_type: 'meeting_topic',
          target_id: topicId,
          uploaded_by: admin.id,
        })
      }
      return true
    } catch (err) {
      console.error('Failed to upload files:', err)
      return false
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * 주제 저장
   */
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    if (!admin) return

    setIsSaving(true)
    try {
      let topicId: string

      if (editingTopic) {
        // 수정
        const { error } = await supabase
          .from('meeting_topics')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            is_active: formData.isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTopic.id)

        if (error) throw error
        topicId = editingTopic.id
      } else {
        // 새로 생성
        const { data, error } = await supabase
          .from('meeting_topics')
          .insert({
            title: formData.title.trim(),
            content: formData.content.trim(),
            is_active: formData.isActive,
            created_by: admin.id,
          })
          .select()
          .single()

        if (error) throw error
        topicId = data.id
      }

      // 파일 업로드
      if (selectedFiles.length > 0) {
        await uploadFiles(topicId)
      }

      await loadTopics()
      handleCloseModal()
    } catch (err) {
      console.error('Failed to save topic:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * 활성화 토글
   */
  const handleToggleActive = async (topic: MeetingTopic) => {
    try {
      const { error } = await supabase
        .from('meeting_topics')
        .update({ is_active: !topic.isActive })
        .eq('id', topic.id)

      if (error) throw error

      setTopics(
        topics.map((t) =>
          t.id === topic.id ? { ...t, isActive: !t.isActive } : t
        )
      )
    } catch (err) {
      console.error('Failed to toggle topic:', err)
    }
  }

  /**
   * 주제 삭제
   */
  const handleDelete = async (topicId: string) => {
    if (!confirm('정말 삭제하시겠습니까? 첨부파일도 함께 삭제됩니다.')) return

    try {
      // 첨부파일 삭제
      const topicAttachments = attachments[topicId] || []
      for (const att of topicAttachments) {
        await supabase.storage.from('attachments').remove([att.filePath])
        await supabase.from('attachments').delete().eq('id', att.id)
      }

      // 주제 삭제
      const { error } = await supabase
        .from('meeting_topics')
        .delete()
        .eq('id', topicId)

      if (error) throw error

      setTopics(topics.filter((t) => t.id !== topicId))
      const newAttachments = { ...attachments }
      delete newAttachments[topicId]
      setAttachments(newAttachments)
    } catch (err) {
      console.error('Failed to delete topic:', err)
    }
  }

  /**
   * 첨부파일 삭제
   */
  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm('첨부파일을 삭제하시겠습니까?')) return

    try {
      await supabase.storage.from('attachments').remove([attachment.filePath])
      await supabase.from('attachments').delete().eq('id', attachment.id)

      setAttachments((prev) => ({
        ...prev,
        [attachment.targetId]: (prev[attachment.targetId] || []).filter(
          (a) => a.id !== attachment.id
        ),
      }))
    } catch (err) {
      console.error('Failed to delete attachment:', err)
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

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  if (!admin) return null

  const activeTopics = topics.filter((t) => t.isActive)
  const inactiveTopics = topics.filter((t) => !t.isActive)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">공개 봉사</span>
            <span className="text-sm text-gray-400">관리자</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{admin.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex">
            <Link to="/admin/dashboard" className="tab-item">
              대시보드
            </Link>
            <Link to="/admin/schedule" className="tab-item">
              일정 관리
            </Link>
            <Link to="/admin/users" className="tab-item">
              사용자 관리
            </Link>
            <Link to="/admin/notices" className="tab-item">
              공지사항
            </Link>
            <Link to="/admin/topics" className="tab-item-active">
              봉사모임 주제
            </Link>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
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
        ) : (
          <>
            {/* 상단 영역 */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">봉사모임 주제 관리</h2>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary text-sm"
              >
                + 주제 등록
              </button>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activeTopics.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">활성 주제</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {inactiveTopics.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">비활성 주제</div>
              </div>
            </div>

            {/* 주제 목록 */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">
                전체 주제 ({topics.length})
              </h3>
              {topics.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
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

                    return (
                      <div
                        key={topic.id}
                        className={`p-4 rounded-lg border ${
                          topic.isActive
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                topic.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {topic.isActive ? '활성' : '비활성'}
                            </span>
                            <h4
                              className={`font-medium ${
                                topic.isActive
                                  ? 'text-gray-800'
                                  : 'text-gray-500'
                              }`}
                            >
                              {topic.title}
                            </h4>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {topic.content && (
                          <p
                            className={`text-sm mb-3 whitespace-pre-wrap ${
                              topic.isActive ? 'text-gray-600' : 'text-gray-400'
                            }`}
                          >
                            {topic.content}
                          </p>
                        )}

                        {/* 첨부파일 목록 */}
                        {topicAttachments.length > 0 && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-500 mb-2">
                              첨부파일 ({topicAttachments.length})
                            </div>
                            <div className="space-y-1">
                              {topicAttachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span>{getFileIcon(att.fileType)}</span>
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline truncate"
                                    >
                                      {att.fileName}
                                    </a>
                                    <span className="text-gray-400 text-xs flex-shrink-0">
                                      ({formatFileSize(att.fileSize)})
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteAttachment(att)}
                                    className="text-red-500 hover:text-red-700 text-xs flex-shrink-0"
                                  >
                                    삭제
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenModal(topic)}
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleToggleActive(topic)}
                            className={`px-3 py-1.5 text-sm rounded-lg ${
                              topic.isActive
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {topic.isActive ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleDelete(topic.id)}
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 주제 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingTopic ? '주제 수정' : '주제 등록'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="주제 제목을 입력하세요"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="주제 내용을 입력하세요 (선택사항)"
                  className="input-field min-h-[100px] resize-none"
                  rows={4}
                />
              </div>

              {/* 파일 업로드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  첨부파일 (최대 5개, 각 10MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 5}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-6 h-6 mx-auto mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  파일 선택
                </button>

                {/* 선택된 파일 목록 */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span>{getFileIcon(file.type)}</span>
                          <span className="text-sm text-gray-700 truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  활성화 (사용자에게 표시)
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isSaving || isUploading
                  ? '저장 중...'
                  : editingTopic
                  ? '수정'
                  : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
