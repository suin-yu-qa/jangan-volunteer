/**
 * ============================================================================
 * 선택 모드 커스텀 훅
 * ============================================================================
 *
 * 일괄 삭제 등 다중 선택이 필요한 리스트에서 사용됩니다.
 *
 * 사용 예시:
 * const {
 *   isSelectionMode,
 *   selectedIds,
 *   toggleSelection,
 *   toggleSelectAll,
 *   enterSelectionMode,
 *   exitSelectionMode,
 *   clearSelection,
 * } = useSelectionMode<Schedule>()
 *
 * // 선택 모드 진입
 * <button onClick={enterSelectionMode}>선택</button>
 *
 * // 전체 선택
 * <button onClick={() => toggleSelectAll(items)}>전체 선택</button>
 *
 * // 개별 선택
 * <input
 *   type="checkbox"
 *   checked={selectedIds.has(item.id)}
 *   onChange={() => toggleSelection(item.id)}
 * />
 * ============================================================================
 */

import { useState, useCallback } from 'react'

interface UseSelectionModeReturn {
  isSelectionMode: boolean
  selectedIds: Set<string>
  toggleSelection: (id: string) => void
  toggleSelectAll: <T extends { id: string }>(items: T[]) => void
  selectAll: <T extends { id: string }>(items: T[]) => void
  enterSelectionMode: () => void
  exitSelectionMode: () => void
  clearSelection: () => void
  selectedCount: number
}

export function useSelectionMode(): UseSelectionModeReturn {
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const toggleSelectAll = useCallback(<T extends { id: string }>(items: T[]) => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set()
      }
      return new Set(items.map((item) => item.id))
    })
  }, [])

  const selectAll = useCallback(<T extends { id: string }>(items: T[]) => {
    setSelectedIds(new Set(items.map((item) => item.id)))
  }, [])

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true)
  }, [])

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    isSelectionMode,
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    selectAll,
    enterSelectionMode,
    exitSelectionMode,
    clearSelection,
    selectedCount: selectedIds.size,
  }
}
