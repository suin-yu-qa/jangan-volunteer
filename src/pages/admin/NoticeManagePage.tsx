/**
 * ============================================================================
 * 공지사항 관리 페이지 (관리자용)
 * ============================================================================
 *
 * 공지사항을 생성, 조회, 수정, 삭제하는 관리 페이지입니다.
 *
 * 주요 기능:
 * - 공지사항 목록 조회
 * - 새 공지사항 작성 (제목, 내용, 활성화 여부)
 * - 공지사항 수정
 * - 공지사항 삭제
 * - 활성화/비활성화 토글
 *
 * 공지사항 상태:
 * - 활성화 (is_active=true): 사용자 앱에 표시됨
 * - 비활성화 (is_active=false): 사용자 앱에 표시 안 됨
 *
 * 참고:
 * - 사용자는 NoticePage에서 활성화된 공지만 볼 수 있음
 * - 최신 공지가 상단에 표시됨
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { Notice } from '@/types'
import RoleSwitchTab from '@/components/RoleSwitchTab'
import NoticeEditor from '@/components/common/NoticeEditor'

export default function NoticeManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()

  const [notices, setNotices] = useState<Notice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
    startDate: '',
    endDate: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadNotices()
    }
  }, [isLoggedIn])

  const loadNotices = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const noticeList: Notice[] = data.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          isActive: n.is_active,
          startDate: n.start_date,
          endDate: n.end_date,
          createdBy: n.created_by,
          createdAt: n.created_at,
        }))
        setNotices(noticeList)
      }
    } catch (err) {
      console.error('Failed to load notices:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (notice?: Notice) => {
    if (notice) {
      setEditingNotice(notice)
      setFormData({
        title: notice.title,
        content: notice.content,
        isActive: notice.isActive,
        startDate: notice.startDate || '',
        endDate: notice.endDate || '',
      })
    } else {
      setEditingNotice(null)
      setFormData({
        title: '',
        content: '',
        isActive: true,
        startDate: '',
        endDate: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingNotice(null)
    setFormData({ title: '', content: '', isActive: true, startDate: '', endDate: '' })
  }

  /**
   * Tiptap 에디터에서 빈 단락은 <p></p>로 남기 때문에 텍스트 유무로 검증
   */
  const hasContent = (html: string): boolean => {
    const text = html.replace(/<[^>]+>/g, '').trim()
    return text.length > 0 || /<img\s|<table\s|<a\s/i.test(html)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !hasContent(formData.content)) {
      alert('제목과 내용을 입력해주세요.')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      alert('노출 시작일과 종료일을 모두 입력해주세요.')
      return
    }
    if (formData.startDate > formData.endDate) {
      alert('종료일은 시작일과 같거나 그 이후여야 합니다.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content,
        is_active: formData.isActive,
        start_date: formData.startDate,
        end_date: formData.endDate,
      }

      if (editingNotice) {
        // 수정
        const { error } = await supabase
          .from('notices')
          .update(payload)
          .eq('id', editingNotice.id)

        if (error) throw error
      } else {
        // 새로 생성
        const { error } = await supabase.from('notices').insert(payload)

        if (error) throw error

        // 새 공지 푸시 알림 — 활성 공지일 때만 전체 사용자에게 발송
        if (payload.is_active) {
          try {
            await supabase.functions.invoke('send-push', {
              body: {
                title: '새 공지사항',
                body: payload.title,
                url: '/notices',
                recipients: { type: 'all_users' },
              },
            })
          } catch (pushErr) {
            console.error('Push notification failed (non-fatal):', pushErr)
          }
        }
      }

      await loadNotices()
      handleCloseModal()
    } catch (err) {
      console.error('Failed to save notice:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.isActive })
        .eq('id', notice.id)

      if (error) throw error

      setNotices(
        notices.map((n) =>
          n.id === notice.id ? { ...n, isActive: !n.isActive } : n
        )
      )
    } catch (err) {
      console.error('Failed to toggle notice:', err)
    }
  }

  const handleDelete = async (noticeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (error) throw error

      setNotices(notices.filter((n) => n.id !== noticeId))
    } catch (err) {
      console.error('Failed to delete notice:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  if (!admin) return null

  const activeNotices = notices.filter((n) => n.isActive)
  const inactiveNotices = notices.filter((n) => !n.isActive)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src="/icons/icon-512-v2.png"
                alt=""
                className="w-7 h-7 rounded-md object-cover"
                draggable={false}
              />
              <span className="text-lg font-bold text-blue-600">공개 봉사</span>
            </Link>
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

      {/* 역할 전환 탭 */}
      <RoleSwitchTab maxWidth="max-w-4xl" />

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
            <Link to="/admin/notices" className="tab-item-active">
              공지사항
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
              <h2 className="text-xl font-bold text-gray-800">공지사항 관리</h2>
              <button
                onClick={() => handleOpenModal()}
                className="btn-primary text-sm"
              >
                + 공지 등록
              </button>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activeNotices.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">활성 공지</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {inactiveNotices.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">비활성 공지</div>
              </div>
            </div>

            {/* 공지사항 목록 */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">
                전체 공지사항 ({notices.length})
              </h3>
              {notices.length === 0 ? (
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
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                  등록된 공지사항이 없습니다
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div
                      key={notice.id}
                      className={`p-4 rounded-lg border ${
                        notice.isActive
                          ? 'bg-white border-gray-200'
                          : 'bg-gray-50 border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                              notice.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                          >
                            {notice.isActive ? '활성' : '비활성'}
                          </span>
                          {notice.startDate && notice.endDate && (
                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                              {notice.startDate} ~ {notice.endDate}
                            </span>
                          )}
                          <h4
                            className={`font-medium ${
                              notice.isActive
                                ? 'text-gray-800'
                                : 'text-gray-500'
                            }`}
                          >
                            {notice.title}
                          </h4>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className={`notice-content text-sm mb-3 ${
                          notice.isActive ? 'text-gray-600' : 'text-gray-400'
                        }`}
                        dangerouslySetInnerHTML={{ __html: notice.content }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(notice)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleActive(notice)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${
                            notice.isActive
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {notice.isActive ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDelete(notice.id)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 공지 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingNotice ? '공지 수정' : '공지 등록'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="공지 제목을 입력하세요"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    노출 시작일
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    노출 종료일
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    min={formData.startDate || undefined}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  내용
                </label>
                <NoticeEditor
                  value={formData.content}
                  onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
                  placeholder="공지 내용을 입력하세요. 표·이미지·파일 첨부 가능"
                />
                <p className="text-xs text-gray-400 mt-1">
                  툴바: B/I/S 서식 · H2/H3 제목 · 리스트 · 링크 · 표 · 이미지 · PDF/Excel 파일
                </p>
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
                  활성화 (노출 기간 내에서 사용자에게 표시)
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
                disabled={isSaving}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : editingNotice ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
