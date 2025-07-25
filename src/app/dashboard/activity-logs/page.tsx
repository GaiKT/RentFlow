'use client'

import React, { useState } from 'react'
import { useActivityLogs } from '@/hooks/useActivityLogs'
import { ActivityLogList } from '@/components/ActivityLog'
import { ActivityLogFilters } from '@/components/ActivityLogFilters'
import type { ActivityLogFilters as Filters } from '@/types'

export default function ActivityLogsPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const { logs, total, loading, error, fetchLogs } = useActivityLogs()

  const handleFiltersChange = async (filters: Filters) => {
    setCurrentPage(0)
    await fetchLogs(filters)
  }

  const handlePageChange = async (page: number) => {
    const limit = 50 // Default limit
    const offset = page * limit
    setCurrentPage(page)
    await fetchLogs({ offset, limit })
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content mb-2">
          บันทึกกิจกรรม
        </h1>
        <p className="text-base-content/70">
          ดูประวัติการใช้งานและกิจกรรมทั้งหมดในระบบ
        </p>
      </div>

      <ActivityLogFilters
        onFiltersChange={handleFiltersChange}
        loading={loading}
        showUserFilter={true}
      />

      {error && (
        <div className="alert alert-error mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">
                เกิดข้อผิดพลาด
              </h3>
              <p className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-base-content/70">
            แสดง {logs.length} จาก {total} รายการ
          </p>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || loading}
                className="btn btn-sm btn-ghost disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm text-base-content/70">
                หน้า {currentPage + 1} จาก {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1 || loading}
                className="btn btn-sm btn-ghost disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>

      <ActivityLogList
        logs={logs}
        loading={loading}
        showUser={true}
        emptyMessage="ไม่มีบันทึกกิจกรรม"
      />

      {totalPages > 1 && !loading && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="btn btn-sm btn-outline disabled:opacity-50"
            >
              แรก
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="btn btn-sm btn-outline disabled:opacity-50"
            >
              ก่อนหน้า
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn btn-sm ${
                    pageNum === currentPage
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-sm btn-outline disabled:opacity-50"
            >
              ถัดไป
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="btn btn-sm btn-outline disabled:opacity-50"
            >
              สุดท้าย
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
