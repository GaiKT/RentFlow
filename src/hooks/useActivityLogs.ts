import { useState, useEffect } from 'react'
import { useAuthFetch } from './useAuthFetch'
import type { ActivityLogWithRelations, ActivityLogFilters } from '@/types'

interface UseActivityLogsResult {
  logs: ActivityLogWithRelations[]
  total: number
  loading: boolean
  error: string | null
  fetchLogs: (filters?: ActivityLogFilters) => Promise<void>
  refresh: () => Promise<void>
}

export function useActivityLogs(initialFilters?: ActivityLogFilters): UseActivityLogsResult {
  const [logs, setLogs] = useState<ActivityLogWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ActivityLogFilters>(initialFilters || {})

  const authFetch = useAuthFetch()

  const fetchLogs = async (filters?: ActivityLogFilters) => {
    setLoading(true)
    setError(null)

    try {
      const filtersToUse = filters || currentFilters
      setCurrentFilters(filtersToUse)

      const queryParams = new URLSearchParams()
      
      if (filtersToUse.userId) queryParams.append('userId', filtersToUse.userId)
      if (filtersToUse.entity) queryParams.append('entity', filtersToUse.entity)
      if (filtersToUse.action) queryParams.append('action', filtersToUse.action)
      if (filtersToUse.dateFrom) queryParams.append('dateFrom', filtersToUse.dateFrom.toISOString())
      if (filtersToUse.dateTo) queryParams.append('dateTo', filtersToUse.dateTo.toISOString())
      if (filtersToUse.limit) queryParams.append('limit', filtersToUse.limit.toString())
      if (filtersToUse.offset) queryParams.append('offset', filtersToUse.offset.toString())

      const response = await authFetch(`/api/activity-logs?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs')
      }

      const data = await response.json()
      
      if (data.logs) {
        setLogs(data.logs)
        setTotal(data.total || 0)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity logs')
      console.error('Error fetching activity logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchLogs(currentFilters)
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return {
    logs,
    total,
    loading,
    error,
    fetchLogs,
    refresh,
  }
}

interface UseEntityActivityLogsResult {
  logs: ActivityLogWithRelations[]
  loading: boolean
  error: string | null
  fetchLogs: () => Promise<void>
  refresh: () => Promise<void>
}

export function useEntityActivityLogs(
  entity: string,
  entityId: string,
  limit: number = 20
): UseEntityActivityLogsResult {
  const [logs, setLogs] = useState<ActivityLogWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authFetch = useAuthFetch()

  const fetchLogs = async () => {
    if (!entity || !entityId) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('limit', limit.toString())

      const response = await authFetch(
        `/api/activity-logs/entity/${entity}/${entityId}?${queryParams.toString()}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch entity activity logs')
      }

      const data = await response.json()
      
      if (data.logs) {
        setLogs(data.logs)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entity activity logs')
      console.error('Error fetching entity activity logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchLogs()
  }

  useEffect(() => {
    fetchLogs()
  }, [entity, entityId, limit])

  return {
    logs,
    loading,
    error,
    fetchLogs,
    refresh,
  }
}

interface UseUserActivityStatsResult {
  stats: {
    totalActivities: number
    activitiesByEntity: Record<string, number>
    activitiesByAction: Record<string, number>
    recentActivities: ActivityLogWithRelations[]
  } | null
  loading: boolean
  error: string | null
  fetchStats: () => Promise<void>
  refresh: () => Promise<void>
}

export function useUserActivityStats(userId: string): UseUserActivityStatsResult {
  const [stats, setStats] = useState<{
    totalActivities: number
    activitiesByEntity: Record<string, number>
    activitiesByAction: Record<string, number>
    recentActivities: ActivityLogWithRelations[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authFetch = useAuthFetch()

  const fetchStats = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await authFetch(`/api/activity-logs/stats/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user activity stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user activity stats')
      console.error('Error fetching user activity stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const refresh = async () => {
    await fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [userId])

  return {
    stats,
    loading,
    error,
    fetchStats,
    refresh,
  }
}
