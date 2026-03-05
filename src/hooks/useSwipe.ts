/**
 * ============================================================================
 * 스와이프 감지 커스텀 훅
 * ============================================================================
 *
 * 모바일에서 탭 전환을 위한 스와이프 제스처를 감지합니다.
 *
 * 사용 예시:
 * const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
 *   onSwipeLeft: () => goToNextTab(),
 *   onSwipeRight: () => goToPrevTab(),
 *   minDistance: 50,
 * })
 *
 * <div
 *   onTouchStart={onTouchStart}
 *   onTouchMove={onTouchMove}
 *   onTouchEnd={onTouchEnd}
 * >
 *   ...
 * </div>
 * ============================================================================
 */

import { useState, useCallback } from 'react'

interface UseSwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minDistance?: number
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 50,
}: UseSwipeOptions) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minDistance
    const isRightSwipe = distance < -minDistance

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    } else if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }, [touchStart, touchEnd, minDistance, onSwipeLeft, onSwipeRight])

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }
}
