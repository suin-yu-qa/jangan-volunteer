/**
 * ============================================================================
 * 재사용 가능한 탭 컴포넌트
 * ============================================================================
 *
 * 서비스 유형별 탭, 장소별 탭 등 다양한 탭 UI에 사용됩니다.
 *
 * 사용 예시:
 * <Tabs
 *   tabs={[
 *     { id: 'all', label: '전체' },
 *     { id: 'exhibit', label: '전시대', icon: <CartIcon /> },
 *   ]}
 *   activeTab="all"
 *   onTabChange={(id) => setActiveTab(id)}
 * />
 * ============================================================================
 */

import { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.icon}
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count !== undefined && (
            <span className="text-xs">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
