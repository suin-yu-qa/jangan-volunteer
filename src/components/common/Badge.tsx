/**
 * ============================================================================
 * 배지 컴포넌트
 * ============================================================================
 *
 * 작은 라벨 형태의 배지 컴포넌트입니다.
 *
 * 주요 기능:
 * - 다양한 색상 옵션
 * - 텍스트 또는 숫자 표시
 * - 상태 표시용 (NEW, 마감, 등)
 *
 * 사용 예시:
 * <Badge variant="blue">NEW</Badge>
 * <Badge variant="red">마감</Badge>
 * ============================================================================
 */

import { ReactNode } from 'react'

/**
 * 배지 색상 타입
 */
type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'gray' | 'purple'

interface BadgeProps {
  /** 배지 색상 */
  variant?: BadgeVariant
  /** 배지 내용 */
  children: ReactNode
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 색상별 배지 스타일
 */
const variantClasses: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

/**
 * 배지 컴포넌트
 *
 * @param variant - 배지 색상 (기본: 'gray')
 * @param children - 배지 내용
 * @param className - 추가 CSS 클래스
 *
 * @example
 * // NEW 배지
 * <Badge variant="blue">NEW</Badge>
 *
 * // 마감 배지
 * <Badge variant="red">마감</Badge>
 *
 * // 개수 배지
 * <Badge variant="orange">3개</Badge>
 */
export default function Badge({
  variant = 'gray',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full
        text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
