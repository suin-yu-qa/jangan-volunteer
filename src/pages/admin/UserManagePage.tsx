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
 * - 벌크 추가/삭제 기능
 * - 엑셀 내보내기/가져오기 기능
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

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'
import * as XLSX from 'xlsx'

export default function UserManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newUserName, setNewUserName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState('')

  // 벌크 관리 상태
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkNames, setBulkNames] = useState('')
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkResult, setBulkResult] = useState<{ success: number; failed: string[] } | null>(null)

  // 선택 삭제 상태
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // 벌크 추가 핸들러
  const handleBulkAdd = async () => {
    const names = bulkNames
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length >= 2)

    if (names.length === 0) {
      setBulkError('추가할 이름을 입력해주세요. (한 줄에 하나씩)')
      return
    }

    setIsBulkAdding(true)
    setBulkError('')
    setBulkResult(null)

    const existingNames = new Set(users.map((u) => u.name.toLowerCase()))
    const failed: string[] = []
    let successCount = 0

    for (const name of names) {
      if (existingNames.has(name.toLowerCase())) {
        failed.push(`${name} (중복)`)
        continue
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .insert({ name, is_approved: true })
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
          setUsers((prev) => [newUser, ...prev])
          existingNames.add(name.toLowerCase())
          successCount++
        }
      } catch {
        failed.push(`${name} (오류)`)
      }
    }

    setBulkResult({ success: successCount, failed })
    setIsBulkAdding(false)

    if (successCount > 0 && failed.length === 0) {
      setTimeout(() => {
        setShowBulkModal(false)
        setBulkNames('')
        setBulkResult(null)
      }, 1500)
    }
  }

  // 선택 토글 핸들러
  const handleToggleSelect = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // 전체 선택/해제 핸들러
  const handleSelectAll = (userList: User[]) => {
    if (selectedUsers.size === userList.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(userList.map((u) => u.id)))
    }
  }

  // 선택된 사용자 벌크 삭제
  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return
    if (!confirm(`선택한 ${selectedUsers.size}명을 삭제하시겠습니까?`)) return

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', Array.from(selectedUsers))

      if (error) throw error

      setUsers((prev) => prev.filter((u) => !selectedUsers.has(u.id)))
      setSelectedUsers(new Set())
      setIsSelectionMode(false)
    } catch (err) {
      console.error('Failed to bulk delete:', err)
      alert('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  // 엑셀 내보내기
  const handleExportExcel = () => {
    const exportData = users.map((u) => ({
      이름: u.name,
      상태: u.isApproved ? '승인됨' : '미승인',
      등록일: new Date(u.createdAt).toLocaleDateString('ko-KR'),
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '사용자 목록')

    // 열 너비 설정
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }]

    XLSX.writeFile(wb, `사용자목록_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // 엑셀 가져오기
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

        // 첫 번째 열 값들만 추출 (컬럼명 상관없이)
        const firstColumnKey = Object.keys(jsonData[0] || {})[0]
        const allNames = jsonData
          .map((row) => {
            // 이름 또는 name 컬럼이 있으면 우선, 없으면 첫 번째 컬럼 사용
            const value = row['이름'] || row['name'] || row['Name'] || (firstColumnKey ? row[firstColumnKey] : '')
            return String(value || '').trim()
          })
          .filter((name) => name.length >= 2)

        if (allNames.length === 0) {
          alert('가져올 이름이 없습니다. 엑셀 파일에 이름 데이터가 있는지 확인해주세요.')
          return
        }

        // 이미 등록된 사용자 필터링
        const existingNames = new Set(users.map((u) => u.name.toLowerCase()))
        const newNames = allNames.filter((name) => !existingNames.has(name.toLowerCase()))
        const duplicateCount = allNames.length - newNames.length

        if (newNames.length === 0) {
          alert(`모든 사용자(${allNames.length}명)가 이미 등록되어 있습니다.`)
          return
        }

        // 벌크 모달에 새 이름만 채우기
        setBulkNames(newNames.join('\n'))
        setShowBulkModal(true)

        if (duplicateCount > 0) {
          setBulkError(`${duplicateCount}명은 이미 등록되어 제외되었습니다.`)
        }
      } catch {
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
      }
    }
    reader.readAsBinaryString(file)

    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = ''
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
            <Link to="/admin/topics" className="tab-item">
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">사용자 관리</h2>
              <div className="flex gap-2">
                {isSelectionMode ? (
                  <>
                    <button
                      onClick={() => {
                        setIsSelectionMode(false)
                        setSelectedUsers(new Set())
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={selectedUsers.size === 0 || isDeleting}
                      className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {isDeleting ? '삭제 중...' : `선택 삭제 (${selectedUsers.size})`}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    >
                      선택 삭제
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn-primary text-sm"
                    >
                      + 추가
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 엑셀/벌크 버튼 영역 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 border border-green-200"
              >
                여러 명 추가
              </button>
              <button
                onClick={handleExportExcel}
                className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 border border-blue-200"
              >
                엑셀 내보내기
              </button>
              <label className="flex-1 px-3 py-2 bg-purple-50 text-purple-700 text-sm rounded-lg hover:bg-purple-100 border border-purple-200 text-center cursor-pointer">
                엑셀 가져오기
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">
                  등록된 사용자 ({approvedUsers.length})
                </h3>
                {isSelectionMode && approvedUsers.length > 0 && (
                  <button
                    onClick={() => handleSelectAll(approvedUsers)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedUsers.size === approvedUsers.length ? '전체 해제' : '전체 선택'}
                  </button>
                )}
              </div>
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
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        selectedUsers.has(user.id) ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleToggleSelect(user.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        )}
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
                      {!isSelectionMode && (
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
                      )}
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

      {/* 벌크 추가 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              여러 명 추가
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              한 줄에 한 명씩 이름을 입력하세요.
            </p>

            <div className="mb-4">
              <textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="홍길동&#10;김철수&#10;이영희"
                className="input-field h-40 resize-none"
                autoFocus
              />
              {bulkError && <p className="mt-1.5 text-sm text-red-600">{bulkError}</p>}

              {bulkResult && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-green-600 font-medium">
                    {bulkResult.success}명 추가 완료
                  </p>
                  {bulkResult.failed.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600 font-medium">
                        추가 실패 ({bulkResult.failed.length}명):
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {bulkResult.failed.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowBulkModal(false)
                  setBulkNames('')
                  setBulkError('')
                  setBulkResult(null)
                }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
              >
                닫기
              </button>
              <button
                onClick={handleBulkAdd}
                disabled={isBulkAdding || !bulkNames.trim()}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isBulkAdding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
