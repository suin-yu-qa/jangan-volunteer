/**
 * ============================================================================
 * 재사용 가능한 모달 컴포넌트
 * ============================================================================
 *
 * 사용자 상세, 일정 추가 등 다양한 모달 UI에 사용됩니다.
 *
 * 사용 예시:
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="모달 제목"
 * >
 *   <div>모달 내용</div>
 * </Modal>
 * ============================================================================
 */

import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
  showHeader?: boolean
  headerIcon?: ReactNode
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  showHeader = true,
  headerIcon,
}: ModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }[maxWidth]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl ${maxWidthClass} w-full shadow-xl max-h-[80vh] flex flex-col`}>
        {/* 모달 헤더 */}
        {showHeader && (
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {headerIcon}
              <div>
                {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 모달 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* 모달 푸터 */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
