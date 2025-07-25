'use client'

import React, { useState } from 'react'
import type { ActivityLogFilters } from '@/types'

interface ActivityLogFiltersProps {
  onFiltersChange: (filters: ActivityLogFilters) => void
  loading?: boolean
  showUserFilter?: boolean
}

export function ActivityLogFilters({ 
  onFiltersChange, 
  loading = false,
  showUserFilter = false 
}: ActivityLogFiltersProps) {
  const [filters, setFilters] = useState<ActivityLogFilters>({
    limit: 50,
    offset: 0,
  })

  const handleFilterChange = (key: keyof ActivityLogFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, offset: 0 } // Reset offset when filters change
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateChange = (key: 'dateFrom' | 'dateTo', value: string) => {
    const date = value ? new Date(value) : undefined
    handleFilterChange(key, date)
  }

  const clearFilters = () => {
    const newFilters: ActivityLogFilters = { limit: 50, offset: 0 }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const entityOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'user', label: 'ผู้ใช้' },
    { value: 'room', label: 'ห้อง' },
    { value: 'contract', label: 'สัญญา' },
    { value: 'invoice', label: 'ใบแจ้งหนี้' },
    { value: 'receipt', label: 'ใบเสร็จ' },
  ]

  const actionOptions = [
    { value: '', label: 'ทั้งหมด' },
    // User actions
    { value: 'USER_LOGIN', label: 'เข้าสู่ระบบ' },
    { value: 'USER_LOGOUT', label: 'ออกจากระบบ' },
    { value: 'USER_REGISTER', label: 'สมัครสมาชิก' },
    { value: 'USER_PROFILE_UPDATE', label: 'อัปเดตโปรไฟล์' },
    { value: 'USER_PASSWORD_CHANGE', label: 'เปลี่ยนรหัสผ่าน' },
    // Room actions
    { value: 'ROOM_CREATE', label: 'สร้างห้อง' },
    { value: 'ROOM_UPDATE', label: 'อัปเดตห้อง' },
    { value: 'ROOM_DELETE', label: 'ลบห้อง' },
    { value: 'ROOM_STATUS_CHANGE', label: 'เปลี่ยนสถานะห้อง' },
    // Contract actions
    { value: 'CONTRACT_CREATE', label: 'สร้างสัญญา' },
    { value: 'CONTRACT_UPDATE', label: 'อัปเดตสัญญา' },
    { value: 'CONTRACT_DELETE', label: 'ลบสัญญา' },
    { value: 'CONTRACT_TERMINATE', label: 'ยกเลิกสัญญา' },
    { value: 'CONTRACT_RENEW', label: 'ต่อสัญญา' },
    // Invoice actions
    { value: 'INVOICE_CREATE', label: 'สร้างใบแจ้งหนี้' },
    { value: 'INVOICE_UPDATE', label: 'อัปเดตใบแจ้งหนี้' },
    { value: 'INVOICE_DELETE', label: 'ลบใบแจ้งหนี้' },
    { value: 'INVOICE_MARK_PAID', label: 'ทำเครื่องหมายชำระแล้ว' },
    { value: 'INVOICE_MARK_OVERDUE', label: 'ทำเครื่องหมายเกินกำหนด' },
    // Receipt actions
    { value: 'RECEIPT_CREATE', label: 'สร้างใบเสร็จ' },
    { value: 'RECEIPT_UPDATE', label: 'อัปเดตใบเสร็จ' },
    { value: 'RECEIPT_DELETE', label: 'ลบใบเสร็จ' },
  ]

  return (
    <div className="card bg-base-100 shadow-sm mb-6">
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">ประเภทเอนทิตี</span>
            </label>
            <select
              value={filters.entity || ''}
              onChange={(e) => handleFilterChange('entity', e.target.value || undefined)}
              className="select select-bordered w-full"
              disabled={loading}
            >
              {entityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">การกระทำ</span>
            </label>
            <select
              value={filters.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value || undefined)}
              className="select select-bordered w-full"
              disabled={loading}
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">วันที่เริ่มต้น</span>
            </label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="input input-bordered w-full"
              disabled={loading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">วันที่สิ้นสุด</span>
            </label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="input input-bordered w-full"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">จำนวนต่อหน้า</span>
              </label>
              <select
                value={filters.limit || 50}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="select select-bordered"
                disabled={loading}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <button
            onClick={clearFilters}
            className="btn btn-ghost"
            disabled={loading}
          >
            ล้างตัวกรอง
          </button>
        </div>
      </div>
    </div>
  )
}
