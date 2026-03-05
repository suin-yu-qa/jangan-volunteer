/**
 * ============================================================================
 * 선택 가능한 리스트 컴포넌트
 * ============================================================================
 *
 * 일정 일괄 삭제, 사용자 일괄 삭제 등 선택 모드가 필요한 리스트에 사용됩니다.
 *
 * 사용 예시:
 * <SelectableList
 *   items={schedules}
 *   selectedIds={selectedSchedules}
 *   isSelectionMode={isSelectionMode}
 *   onToggleSelect={(id) => toggleScheduleSelection(id)}
 *   renderItem={(schedule, isSelected) => (
 *     <ScheduleCard schedule={schedule} isSelected={isSelected} />
 *   )}
 * />
 * ============================================================================
 */

import { ReactNode } from 'react'

interface SelectableListProps<T extends { id: string }> {
  items: T[]
  selectedIds: Set<string>
  isSelectionMode: boolean
  onToggleSelect: (id: string) => void
  renderItem: (item: T, isSelected: boolean) => ReactNode
  onItemClick?: (item: T) => void
  emptyMessage?: string
  emptyIcon?: ReactNode
  className?: string
}

export default function SelectableList<T extends { id: string }>({
  items,
  selectedIds,
  isSelectionMode,
  onToggleSelect,
  renderItem,
  onItemClick,
  emptyMessage = '항목이 없습니다',
  emptyIcon,
  className = '',
}: SelectableListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        {emptyIcon && <div className="mb-3">{emptyIcon}</div>}
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const isSelected = selectedIds.has(item.id)

        return (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => {
              if (isSelectionMode) {
                onToggleSelect(item.id)
              } else if (onItemClick) {
                onItemClick(item)
              }
            }}
          >
            {isSelectionMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
            <div className="flex-1">
              {renderItem(item, isSelected)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
