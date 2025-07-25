'use client'

import React from 'react'
import { useEntityActivityLogs } from '@/hooks/useActivityLogs'
import { ActivityLogList } from './ActivityLog'

interface EntityActivityLogsPanelProps {
  entity: string
  entityId: string
  entityName?: string
  title?: string
  limit?: number
  className?: string
}

export function EntityActivityLogsPanel({
  entity,
  entityId,
  entityName,
  title,
  limit = 10,
  className = ''
}: EntityActivityLogsPanelProps) {
  const { logs, loading, error, refresh } = useEntityActivityLogs(entity, entityId, limit)

  const getDefaultTitle = () => {
    const entityMap: Record<string, string> = {
      room: 'ประวัติกิจกรรมห้องพัก',
      contract: 'ประวัติกิจกรรมสัญญา',
      invoice: 'ประวัติกิจกรรมใบแจ้งหนี้',
      receipt: 'ประวัติกิจกรรมใบเสร็จ',
      user: 'ประวัติกิจกรรมผู้ใช้'
    }
    return entityMap[entity] || 'ประวัติกิจกรรม'
  }

  return (
    <div className={`card bg-base-100 shadow-sm border border-base-300 ${className}`}>
      <div className="px-6 py-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-base-content">
              {title || getDefaultTitle()}
            </h3>
            {entityName && (
              <p className="text-sm text-base-content/60 mt-1">
                {entityName}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="btn btn-sm btn-ghost disabled:opacity-50"
          >
            {loading ? '🔄' : '⟳'} รีเฟรช
          </button>
        </div>
      </div>

      <div className="p-0">
        {error && (
          <div className="m-4 alert alert-error">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <ActivityLogList
          logs={logs}
          loading={loading}
          showUser={true}
          emptyMessage="ไม่มีประวัติกิจกรรม"
        />

        {logs.length >= limit && (
          <div className="p-4 border-t border-base-300 text-center">
            <p className="text-sm text-base-content/50">
              แสดง {limit} รายการล่าสุด
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface ActivityLogsSummaryProps {
  entity: string
  entityId: string
  className?: string
}

export function ActivityLogsSummary({
  entity,
  entityId,
  className = ''
}: ActivityLogsSummaryProps) {
  const { logs, loading } = useEntityActivityLogs(entity, entityId, 3)

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-base-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-base-300 rounded w-1/2"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={`text-sm text-base-content/50 ${className}`}>
        ไม่มีกิจกรรมล่าสุด
      </div>
    )
  }

  const lastActivity = logs[0]
  const remainingCount = logs.length - 1

  return (
    <div className={className}>
      <div className="text-sm">
        <span className="text-base-content/60">กิจกรรมล่าสุด:</span>
        <span className="ml-2 font-medium text-base-content">
          {lastActivity.description}
        </span>
      </div>
      {remainingCount > 0 && (
        <div className="text-xs text-base-content/50 mt-1">
          และอีก {remainingCount} กิจกรรม
        </div>
      )}
    </div>
  )
}
