/**
 * ============================================================================
 * 탭 관리 커스텀 훅
 * ============================================================================
 *
 * 탭 상태 관리와 스와이프를 통한 탭 전환을 지원합니다.
 *
 * 사용 예시:
 * const { activeTab, setActiveTab, swipeHandlers, goToNextTab, goToPrevTab } = useTabs({
 *   tabs: ['all', 'exhibit', 'park'],
 *   defaultTab: 'all',
 * })
 *
 * <div {...swipeHandlers}>
 *   <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />
 * </div>
 * ============================================================================
 */

import { useState, useCallback } from 'react'
import { useSwipe } from './useSwipe'

interface UseTabsOptions<T extends string> {
  tabs: T[]
  defaultTab: T
  onTabChange?: (tab: T) => void
}

interface UseTabsReturn<T extends string> {
  activeTab: T
  setActiveTab: (tab: T) => void
  goToNextTab: () => void
  goToPrevTab: () => void
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
  currentIndex: number
}

export function useTabs<T extends string>({
  tabs,
  defaultTab,
  onTabChange,
}: UseTabsOptions<T>): UseTabsReturn<T> {
  const [activeTab, setActiveTabState] = useState<T>(defaultTab)

  const currentIndex = tabs.indexOf(activeTab)

  const setActiveTab = useCallback((tab: T) => {
    setActiveTabState(tab)
    onTabChange?.(tab)
  }, [onTabChange])

  const goToNextTab = useCallback(() => {
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }, [currentIndex, tabs, setActiveTab])

  const goToPrevTab = useCallback(() => {
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }, [currentIndex, tabs, setActiveTab])

  const swipeHandlers = useSwipe({
    onSwipeLeft: goToNextTab,
    onSwipeRight: goToPrevTab,
  })

  return {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPrevTab,
    swipeHandlers,
    currentIndex,
  }
}
