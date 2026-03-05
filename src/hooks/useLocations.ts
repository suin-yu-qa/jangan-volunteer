/**
 * ============================================================================
 * 장소 관리 커스텀 훅
 * ============================================================================
 *
 * 상수에서 장소 데이터를 로드합니다. (DB 사용 안함)
 *
 * 사용 예시:
 * const { locations, exhibitLocations, parkLocations, getMaxParticipants } = useLocations()
 * ============================================================================
 */

import { useCallback } from 'react'
import { Location, ServiceType } from '@/types'
import {
  EXHIBIT_LOCATIONS,
  PARK_LOCATIONS,
  LIMITED_LOCATIONS,
} from '@/lib/constants'

interface UseLocationsReturn {
  locations: Location[]
  exhibitLocations: string[]
  parkLocations: string[]
  exhibitLocationObjects: Location[]
  parkLocationObjects: Location[]
  getMaxParticipants: (locationName: string) => number
  getLocationsByType: (serviceType: ServiceType) => string[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  // 관리자용 CRUD 함수 (상수 모드에서는 동작 안함)
  addLocation: (data: { serviceType: ServiceType; name: string; maxParticipants: number }) => Promise<boolean>
  updateLocation: (id: string, data: Partial<Pick<Location, 'name' | 'maxParticipants' | 'isActive' | 'displayOrder'>>) => Promise<boolean>
  deleteLocation: (id: string) => Promise<boolean>
  reorderLocations: (locationIds: string[]) => Promise<boolean>
}

/**
 * 상수에서 장소 목록 생성
 */
const createLocationsFromConstants = (): Location[] => [
  ...EXHIBIT_LOCATIONS.map((name, idx) => ({
    id: `exhibit-${idx}`,
    serviceType: 'exhibit' as ServiceType,
    name,
    maxParticipants: LIMITED_LOCATIONS[name] || 12,
    isActive: true,
    displayOrder: idx + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  ...PARK_LOCATIONS.map((name, idx) => ({
    id: `park-${idx}`,
    serviceType: 'park' as ServiceType,
    name,
    maxParticipants: LIMITED_LOCATIONS[name] || 12,
    isActive: true,
    displayOrder: idx + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
]

// 상수에서 생성한 장소 목록 (한 번만 생성)
const LOCATIONS = createLocationsFromConstants()

export function useLocations(): UseLocationsReturn {
  // 전시대 장소 목록 (이름만)
  const exhibitLocations = EXHIBIT_LOCATIONS

  // 공원 장소 목록 (이름만)
  const parkLocations = PARK_LOCATIONS

  // 전시대 장소 객체 목록
  const exhibitLocationObjects = LOCATIONS.filter((loc) => loc.serviceType === 'exhibit')

  // 공원 장소 객체 목록
  const parkLocationObjects = LOCATIONS.filter((loc) => loc.serviceType === 'park')

  /**
   * 장소 이름으로 최대 참여 인원 가져오기
   */
  const getMaxParticipants = useCallback((locationName: string): number => {
    return LIMITED_LOCATIONS[locationName] || 12
  }, [])

  /**
   * 봉사 유형별 장소 목록 가져오기
   */
  const getLocationsByType = useCallback((serviceType: ServiceType): string[] => {
    if (serviceType === 'exhibit') return EXHIBIT_LOCATIONS
    if (serviceType === 'park') return PARK_LOCATIONS
    return []
  }, [])

  /**
   * 더미 함수들 (상수 모드에서는 동작 안함)
   */
  const refetch = useCallback(async () => {}, [])

  const addLocation = useCallback(async (): Promise<boolean> => {
    alert('상수 모드에서는 장소 추가가 불가능합니다.')
    return false
  }, [])

  const updateLocation = useCallback(async (): Promise<boolean> => {
    alert('상수 모드에서는 장소 수정이 불가능합니다.')
    return false
  }, [])

  const deleteLocation = useCallback(async (): Promise<boolean> => {
    alert('상수 모드에서는 장소 삭제가 불가능합니다.')
    return false
  }, [])

  const reorderLocations = useCallback(async (): Promise<boolean> => {
    alert('상수 모드에서는 장소 순서 변경이 불가능합니다.')
    return false
  }, [])

  return {
    locations: LOCATIONS,
    exhibitLocations,
    parkLocations,
    exhibitLocationObjects,
    parkLocationObjects,
    getMaxParticipants,
    getLocationsByType,
    isLoading: false,
    error: null,
    refetch,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
  }
}
