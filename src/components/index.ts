/**
 * ============================================================================
 * 컴포넌트 인덱스
 * ============================================================================
 *
 * 이 파일은 모든 공통 컴포넌트를 한 곳에서 내보냅니다.
 *
 * 디렉토리 구조:
 * - common/    : 범용 UI 컴포넌트 (Calendar, Modal, Button 등)
 * - icons/     : 아이콘 컴포넌트
 * - layout/    : 레이아웃 컴포넌트 (Header, Footer 등)
 *
 * 사용 방법:
 * import { Calendar, DateModal, Loading } from '@/components'
 * ============================================================================
 */

// 공통 UI 컴포넌트
export { default as Calendar } from './common/Calendar'
export { default as DateModal } from './common/DateModal'
export { default as ShiftModal } from './common/ShiftModal'
export { default as Loading } from './common/Loading'
export { default as Badge } from './common/Badge'
export { default as EmptyState } from './common/EmptyState'

// 아이콘
export { default as CartIcon } from './icons/CartIcon'

// 레이아웃 (추후 추가 가능)
// export { default as Header } from './layout/Header'
// export { default as Footer } from './layout/Footer'
