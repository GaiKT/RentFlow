'use client'

import React from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { ActivityLogWithRelations } from '@/types'

interface ActivityLogItemProps {
  log: ActivityLogWithRelations
  showUser?: boolean
}

export function ActivityLogItem({ log, showUser = true }: ActivityLogItemProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return '🔐'
      case 'USER_LOGOUT':
        return '🚪'
      case 'USER_REGISTER':
        return '👋'
      case 'USER_PROFILE_UPDATE':
        return '👤'
      case 'USER_PASSWORD_CHANGE':
        return '🔑'
      case 'ROOM_CREATE':
        return '🏠'
      case 'ROOM_UPDATE':
        return '✏️'
      case 'ROOM_DELETE':
        return '🗑️'
      case 'ROOM_STATUS_CHANGE':
        return '🔄'
      case 'CONTRACT_CREATE':
        return '📝'
      case 'CONTRACT_UPDATE':
        return '📋'
      case 'CONTRACT_DELETE':
        return '❌'
      case 'CONTRACT_TERMINATE':
        return '🔚'
      case 'INVOICE_CREATE':
        return '💰'
      case 'INVOICE_UPDATE':
        return '📄'
      case 'INVOICE_MARK_PAID':
        return '✅'
      case 'INVOICE_MARK_OVERDUE':
        return '⚠️'
      case 'RECEIPT_CREATE':
        return '🧾'
      case 'RECEIPT_UPDATE':
        return '📝'
      default:
        return '📌'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
      case 'USER_REGISTER':
        return 'text-success'
      case 'USER_LOGOUT':
        return 'text-base-content/70'
      case 'ROOM_CREATE':
      case 'CONTRACT_CREATE':
      case 'INVOICE_CREATE':
      case 'RECEIPT_CREATE':
        return 'text-info'
      case 'ROOM_UPDATE':
      case 'CONTRACT_UPDATE':
      case 'INVOICE_UPDATE':
      case 'RECEIPT_UPDATE':
      case 'USER_PROFILE_UPDATE':
        return 'text-warning'
      case 'ROOM_DELETE':
      case 'CONTRACT_DELETE':
      case 'CONTRACT_TERMINATE':
        return 'text-error'
      case 'INVOICE_MARK_PAID':
        return 'text-success'
      case 'INVOICE_MARK_OVERDUE':
        return 'text-warning'
      default:
        return 'text-base-content/70'
    }
  }

  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      USER_LOGIN: 'เข้าสู่ระบบ',
      USER_LOGOUT: 'ออกจากระบบ',
      USER_REGISTER: 'สมัครสมาชิก',
      USER_PROFILE_UPDATE: 'อัปเดตโปรไฟล์',
      USER_PASSWORD_CHANGE: 'เปลี่ยนรหัสผ่าน',
      ROOM_CREATE: 'สร้างห้อง',
      ROOM_UPDATE: 'อัปเดตห้อง',
      ROOM_DELETE: 'ลบห้อง',
      ROOM_STATUS_CHANGE: 'เปลี่ยนสถานะห้อง',
      CONTRACT_CREATE: 'สร้างสัญญา',
      CONTRACT_UPDATE: 'อัปเดตสัญญา',
      CONTRACT_DELETE: 'ลบสัญญา',
      CONTRACT_TERMINATE: 'ยกเลิกสัญญา',
      CONTRACT_RENEW: 'ต่อสัญญา',
      INVOICE_CREATE: 'สร้างใบแจ้งหนี้',
      INVOICE_UPDATE: 'อัปเดตใบแจ้งหนี้',
      INVOICE_DELETE: 'ลบใบแจ้งหนี้',
      INVOICE_MARK_PAID: 'ทำเครื่องหมายชำระแล้ว',
      INVOICE_MARK_OVERDUE: 'ทำเครื่องหมายเกินกำหนด',
      RECEIPT_CREATE: 'สร้างใบเสร็จ',
      RECEIPT_UPDATE: 'อัปเดตใบเสร็จ',
      RECEIPT_DELETE: 'ลบใบเสร็จ',
    }
    return actionMap[action] || action
  }

  return (
    <div className="flex items-start space-x-3 p-4 border-b border-base-300 hover:bg-base-200 transition-colors">
      <div className="flex-shrink-0">
        <span className="text-2xl">{getActionIcon(log.action)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${getActionColor(log.action)}`}>
              {formatActionText(log.action)}
            </span>
            {log.entityName && (
              <span className="text-sm text-base-content/60">
                ({log.entityName})
              </span>
            )}
          </div>
          <time className="text-xs text-base-content/50">
            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: th })}
          </time>
        </div>
        
        <p className="text-sm text-base-content/80 mt-1">
          {log.description}
        </p>
        
        {showUser && log.user && (
          <div className="flex items-center space-x-2 mt-2">
            {log.user.profileImage && (
              <img
                src={log.user.profileImage}
                alt={log.user.name}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-xs text-base-content/50">
              โดย {log.user.name}
            </span>
          </div>
        )}
        
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-base-content/50 cursor-pointer hover:text-base-content/70">
              รายละเอียดเพิ่มเติม
            </summary>
            <pre className="text-xs text-base-content/60 mt-1 bg-base-200 p-2 rounded overflow-x-auto">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

interface ActivityLogListProps {
  logs: ActivityLogWithRelations[]
  loading?: boolean
  showUser?: boolean
  emptyMessage?: string
}

export function ActivityLogList({ 
  logs, 
  loading = false, 
  showUser = true,
  emptyMessage = 'ไม่มีข้อมูลกิจกรรม'
}: ActivityLogListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 text-base-content/50">
        <div className="text-4xl mb-2">📋</div>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      {logs.map((log) => (
        <ActivityLogItem 
          key={log.id} 
          log={log} 
          showUser={showUser}
        />
      ))}
    </div>
  )
}
