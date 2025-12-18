/**
 * ============================================================================
 * 빈 상태 컴포넌트
 * ============================================================================
 *
 * 데이터가 없을 때 표시되는 안내 컴포넌트입니다.
 *
 * 주요 기능:
 * - 아이콘 + 메시지 표시
 * - 선택적 액션 버튼
 * - 다양한 아이콘 옵션
 *
 * 사용 예시:
 * <EmptyState
 *   icon="calendar"
 *   title="예정된 일정이 없습니다"
 *   description="관리자가 일정을 등록하면 표시됩니다."
 * />
 * ============================================================================
 */

import { ReactNode } from 'react'

/**
 * 기본 제공 아이콘 타입
 */
type IconType = 'calendar' | 'notice' | 'topic' | 'user' | 'search' | 'file'

interface EmptyStateProps {
  /** 아이콘 타입 또는 커스텀 아이콘 */
  icon?: IconType | ReactNode
  /** 제목 메시지 */
  title: string
  /** 상세 설명 (선택) */
  description?: string
  /** 액션 버튼 (선택) */
  action?: ReactNode
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 기본 아이콘 컴포넌트들
 */
const icons: Record<IconType, ReactNode> = {
  calendar: (
    <svg className="w-16 h-16 text-gray-300\" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  notice: (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  topic: (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  user: (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  search: (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  file: (
    <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

/**
 * 빈 상태 컴포넌트
 *
 * @param icon - 아이콘 타입 또는 커스텀 아이콘
 * @param title - 제목 메시지
 * @param description - 상세 설명
 * @param action - 액션 버튼
 * @param className - 추가 CSS 클래스
 *
 * @example
 * // 기본 사용
 * <EmptyState
 *   icon="calendar"
 *   title="예정된 일정이 없습니다"
 * />
 *
 * // 설명과 액션 버튼 포함
 * <EmptyState
 *   icon="notice"
 *   title="등록된 공지사항이 없습니다"
 *   description="관리자가 공지사항을 등록하면 여기에 표시됩니다."
 *   action={<button>새로고침</button>}
 * />
 */
export default function EmptyState({
  icon = 'search',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  // 아이콘 렌더링
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return icons[icon as IconType] || icons.search
    }
    return icon
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto mb-4">
        {renderIcon()}
      </div>
      <p className="text-gray-500 font-medium mb-1">{title}</p>
      {description && (
        <p className="text-gray-400 text-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
