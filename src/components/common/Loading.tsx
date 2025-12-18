/**
 * ============================================================================
 * 로딩 컴포넌트
 * ============================================================================
 *
 * 데이터 로딩 중 표시되는 스피너 컴포넌트입니다.
 *
 * 주요 기능:
 * - 로딩 스피너 애니메이션
 * - 크기 옵션 (sm, md, lg)
 * - 전체 화면 또는 인라인 표시
 *
 * 사용 예시:
 * <Loading size="lg" fullScreen />
 * <Loading size="sm" />
 * ============================================================================
 */

interface LoadingProps {
  /** 스피너 크기 */
  size?: 'sm' | 'md' | 'lg'
  /** 전체 화면 중앙 표시 여부 */
  fullScreen?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * 크기별 스피너 클래스
 */
const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

/**
 * 로딩 스피너 컴포넌트
 *
 * @param size - 스피너 크기 (기본: 'md')
 * @param fullScreen - 전체 화면 중앙 표시 여부
 * @param className - 추가 CSS 클래스
 *
 * @example
 * // 기본 사용
 * <Loading />
 *
 * // 전체 화면 로딩
 * <Loading size="lg" fullScreen />
 *
 * // 작은 인라인 로딩
 * <Loading size="sm" className="ml-2" />
 */
export default function Loading({
  size = 'md',
  fullScreen = false,
  className = '',
}: LoadingProps) {
  const spinner = (
    <svg
      className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
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
  )

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center py-20">
        {spinner}
      </div>
    )
  }

  return spinner
}
