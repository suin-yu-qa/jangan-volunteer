/**
 * ============================================================================
 * 사용자 관리 페이지 (관리자용)
 * ============================================================================
 *
 * 봉사자 사용자를 등록하고 관리하는 페이지입니다.
 *
 * 주요 기능:
 * - 등록된 사용자 목록 조회
 * - 새 사용자 추가 (이름 입력, 자동 승인)
 * - 사용자 승인/미승인 상태 토글
 * - 사용자 삭제
 *
 * 사용자 상태:
 * - 승인됨 (is_approved=true): 앱 로그인 가능
 * - 미승인 (is_approved=false): 앱 로그인 불가, 안내 메시지 표시
 *
 * 참고:
 * - 새 사용자 추가 시 기본적으로 승인 상태로 등록됨
 * - 미승인 처리 시 해당 사용자는 앱 접근 불가
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export default function UserManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newUserName, setNewUserName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (isLoggedIn) {
      loadUsers()
    }
  }, [isLoggedIn])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const userList: User[] = data.map((u) => ({
          id: u.id,
          name: u.name,
          isApproved: u.is_approved ?? false,
          createdAt: u.created_at,
        }))
        setUsers(userList)
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    if (newUserName.trim().length < 2) {
      setError('이름은 2글자 이상 입력해주세요.')
      return
    }

    // 중복 확인
    const existing = users.find(
      (u) => u.name.toLowerCase() === newUserName.trim().toLowerCase()
    )
    if (existing) {
      setError('이미 등록된 이름입니다.')
      return
    }

    setIsAdding(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: newUserName.trim(),
          is_approved: true,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newUser: User = {
          id: data.id,
          name: data.name,
          isApproved: data.is_approved,
          createdAt: data.created_at,
        }
        setUsers([newUser, ...users])
        setNewUserName('')
        setShowAddModal(false)
      }
    } catch (err) {
      console.error('Failed to add user:', err)
      setError('사용자 등록에 실패했습니다.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggleApproval = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: !user.isApproved })
        .eq('id', user.id)

      if (error) throw error

      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, isApproved: !u.isApproved } : u
        )
      )
    } catch (err) {
      console.error('Failed to toggle approval:', err)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)

      if (error) throw error

      setUsers(users.filter((u) => u.id !== userId))
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  if (!admin) return null

  const approvedUsers = users.filter((u) => u.isApproved)
  const pendingUsers = users.filter((u) => !u.isApproved)

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
            <Link to="/admin/users" className="tab-item-active">
              사용자 관리
            </Link>
            <Link to="/admin/notices" className="tab-item">
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
              <h2 className="text-xl font-bold text-gray-800">사용자 관리</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-sm"
              >
                + 사용자 추가
              </button>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {approvedUsers.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">등록된 사용자</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingUsers.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">승인 대기</div>
              </div>
            </div>

            {/* 승인 대기 사용자 */}
            {pendingUsers.length > 0 && (
              <div className="card mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">
                  승인 대기 ({pendingUsers.length})
                </h3>
                <div className="space-y-2">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center">
                          <span className="text-sm text-yellow-700">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">
                          {user.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleApproval(user)}
                          className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 등록된 사용자 */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">
                등록된 사용자 ({approvedUsers.length})
              </h3>
              {approvedUsers.length === 0 ? (
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  등록된 사용자가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {approvedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm text-blue-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">
                            {user.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleApproval(user)}
                          className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600"
                        >
                          승인 취소
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
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

      {/* 사용자 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              사용자 추가
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                이름
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="input-field"
                autoFocus
              />
              {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewUserName('')
                  setError('')
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleAddUser}
                disabled={isAdding}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isAdding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
