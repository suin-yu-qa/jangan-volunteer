/**
 * ============================================================================
 * 장소 관리 페이지 (관리자용)
 * ============================================================================
 *
 * 봉사 장소를 추가, 수정, 삭제하는 관리 페이지입니다.
 *
 * 주요 기능:
 * - 전시대/공원 봉사 장소 목록 조회
 * - 새 장소 추가 (이름, 최대 인원)
 * - 장소 수정 (이름, 최대 인원)
 * - 장소 삭제 (비활성화)
 * ============================================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdmin } from '@/context/AdminContext'
import { useLocations } from '@/hooks/useLocations'
import { ServiceType, Location } from '@/types'
import { SERVICE_TYPES } from '@/lib/constants'
import CartIcon from '@/components/icons/CartIcon'

export default function LocationManagePage() {
  const navigate = useNavigate()
  const { admin, logout, isLoggedIn } = useAdmin()
  const {
    exhibitLocationObjects,
    parkLocationObjects,
    isLoading,
    addLocation,
    updateLocation,
    deleteLocation,
  } = useLocations()

  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('exhibit')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    maxParticipants: 6,
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/admin')
    }
  }, [isLoggedIn, navigate])

  const handleLogout = () => {
    logout()
    navigate('/admin')
  }

  /**
   * 모달 열기 (추가/수정)
   */
  const openModal = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        maxParticipants: location.maxParticipants,
      })
    } else {
      setEditingLocation(null)
      setFormData({
        name: '',
        maxParticipants: selectedServiceType === 'exhibit' ? 6 : 12,
      })
    }
    setIsModalOpen(true)
  }

  /**
   * 모달 닫기
   */
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLocation(null)
    setFormData({ name: '', maxParticipants: 6 })
  }

  /**
   * 장소 저장 (추가 또는 수정)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('장소 이름을 입력해주세요.')
      return
    }

    if (formData.maxParticipants < 1) {
      alert('최대 인원은 1명 이상이어야 합니다.')
      return
    }

    let success: boolean

    if (editingLocation) {
      // 수정
      success = await updateLocation(editingLocation.id, {
        name: formData.name.trim(),
        maxParticipants: formData.maxParticipants,
      })
      if (success) {
        alert('장소가 수정되었습니다.')
      } else {
        alert('장소 수정에 실패했습니다.')
      }
    } else {
      // 추가
      success = await addLocation({
        serviceType: selectedServiceType,
        name: formData.name.trim(),
        maxParticipants: formData.maxParticipants,
      })
      if (success) {
        alert('장소가 추가되었습니다.')
      } else {
        alert('장소 추가에 실패했습니다. 이미 존재하는 이름일 수 있습니다.')
      }
    }

    if (success) {
      closeModal()
    }
  }

  /**
   * 장소 삭제
   */
  const handleDelete = async (location: Location) => {
    if (!confirm(`'${location.name}' 장소를 삭제하시겠습니까?\n삭제된 장소는 목록에 표시되지 않습니다.`)) {
      return
    }

    const success = await deleteLocation(location.id)
    if (success) {
      alert('장소가 삭제되었습니다.')
    } else {
      alert('장소 삭제에 실패했습니다.')
    }
  }

  if (!admin) return null

  const currentLocations = selectedServiceType === 'exhibit' ? exhibitLocationObjects : parkLocationObjects
  const currentService = SERVICE_TYPES.find((s) => s.id === selectedServiceType)

  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header className="header">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/admin/dashboard" className="text-lg font-bold text-blue-600 hover:text-blue-700">
              공개 봉사
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
            <Link to="/admin/locations" className="tab-item-active">
              장소 관리
            </Link>
            <Link to="/admin/users" className="tab-item">
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
        {/* 봉사 유형 탭 */}
        <div className="mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {SERVICE_TYPES.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedServiceType(service.id)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                  selectedServiceType === service.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {service.customIcon ? (
                  <CartIcon className="w-4 h-4" />
                ) : (
                  <span>{service.icon}</span>
                )}
                <span>{service.name.replace(' 봉사', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 상단 컨트롤 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {currentService?.customIcon ? (
                <span className="inline-flex items-center gap-2">
                  <CartIcon className="w-5 h-5 text-blue-600" />
                  {currentService.name} 장소
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span>{currentService?.icon}</span>
                  {currentService?.name} 장소
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              총 {currentLocations.length}개 장소
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>장소 추가</span>
          </button>
        </div>

        {/* 장소 목록 */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : currentLocations.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              등록된 장소가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {currentLocations.map((location, index) => (
                <div
                  key={location.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-800">{location.name}</h3>
                      <p className="text-sm text-gray-500">
                        최대 {location.maxParticipants}명
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(location)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(location)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">안내</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 장소를 추가하면 사용자 화면에도 바로 반영됩니다.</li>
            <li>• 삭제된 장소는 비활성화되며, 기존 일정에는 영향을 주지 않습니다.</li>
            <li>• 장소 이름은 봉사 유형 내에서 중복될 수 없습니다.</li>
          </ul>
        </div>
      </main>

      {/* 장소 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">
                  {editingLocation ? '장소 수정' : '장소 추가'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* 봉사 유형 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  봉사 유형
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-600">
                  {currentService?.customIcon ? (
                    <CartIcon className="w-4 h-4" />
                  ) : (
                    <span>{currentService?.icon}</span>
                  )}
                  <span>{currentService?.name}</span>
                </div>
              </div>

              {/* 장소 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소 이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 씨젠"
                  className="input-field"
                  required
                />
              </div>

              {/* 최대 인원 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 참여 인원
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                  max={100}
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  이 장소에서 한 일정에 신청할 수 있는 최대 인원입니다.
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingLocation ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
