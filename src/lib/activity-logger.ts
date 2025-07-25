import { ActivityLogService, getRequestMetadata } from '@/lib/activity-log-service'
import { ActivityAction } from '@prisma/client'

/**
 * Utility class for easy activity logging integration
 */
export class ActivityLogger {
  private userId: string
  private ipAddress?: string
  private userAgent?: string

  constructor(userId: string, request?: Request) {
    this.userId = userId
    if (request) {
      const metadata = getRequestMetadata(request)
      this.ipAddress = metadata.ipAddress
      this.userAgent = metadata.userAgent
    }
  }

  async logUserAction(
    action: ActivityAction,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.logUserAction(
      this.userId,
      action,
      description,
      metadata,
      this.ipAddress,
      this.userAgent
    )
  }

  async logRoomAction(
    roomId: string,
    roomName: string,
    action: ActivityAction,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.logRoomAction(
      this.userId,
      roomId,
      roomName,
      action,
      description,
      metadata,
      this.ipAddress,
      this.userAgent
    )
  }

  async logContractAction(
    contractId: string,
    tenantName: string,
    action: ActivityAction,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.logContractAction(
      this.userId,
      contractId,
      tenantName,
      action,
      description,
      metadata,
      this.ipAddress,
      this.userAgent
    )
  }

  async logInvoiceAction(
    invoiceId: string,
    invoiceNo: string,
    action: ActivityAction,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.logInvoiceAction(
      this.userId,
      invoiceId,
      invoiceNo,
      action,
      description,
      metadata,
      this.ipAddress,
      this.userAgent
    )
  }

  async logReceiptAction(
    receiptId: string,
    receiptNo: string,
    action: ActivityAction,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.logReceiptAction(
      this.userId,
      receiptId,
      receiptNo,
      action,
      description,
      metadata,
      this.ipAddress,
      this.userAgent
    )
  }

  async logCustomAction(
    entity: string,
    entityId: string,
    entityName: string,
    action: string,
    description: string,
    metadata?: any
  ) {
    await ActivityLogService.log({
      action,
      entity,
      entityId,
      entityName,
      description,
      metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      userId: this.userId,
    })
  }
}

/**
 * Helper function to create an ActivityLogger instance from request
 */
export function createActivityLogger(userId: string, request?: Request): ActivityLogger {
  return new ActivityLogger(userId, request)
}

/**
 * Activity logging constants for consistency
 */
export const ACTIVITY_DESCRIPTIONS = {
  // User activities
  USER_LOGIN: (name: string) => `ผู้ใช้ ${name} เข้าสู่ระบบ`,
  USER_LOGOUT: (name: string) => `ผู้ใช้ ${name} ออกจากระบบ`,
  USER_REGISTER: (name: string) => `ผู้ใช้ ${name} สมัครสมาชิกใหม่`,
  USER_PROFILE_UPDATE: (name: string) => `ผู้ใช้ ${name} อัปเดตโปรไฟล์`,
  USER_PASSWORD_CHANGE: (name: string) => `ผู้ใช้ ${name} เปลี่ยนรหัสผ่าน`,

  // Room activities
  ROOM_CREATE: (name: string, rent: number) => `สร้างห้องพักใหม่: ${name} (ค่าเช่า: ${rent} บาท)`,
  ROOM_UPDATE: (name: string) => `อัปเดตข้อมูลห้องพัก: ${name}`,
  ROOM_DELETE: (name: string) => `ลบห้องพัก: ${name}`,
  ROOM_STATUS_CHANGE: (name: string, oldStatus: string, newStatus: string) => 
    `เปลี่ยนสถานะห้องพัก ${name} จาก ${oldStatus} เป็น ${newStatus}`,

  // Contract activities
  CONTRACT_CREATE: (tenantName: string, roomName: string) => 
    `สร้างสัญญาเช่าใหม่สำหรับ ${tenantName} ห้อง ${roomName}`,
  CONTRACT_UPDATE: (tenantName: string) => `อัปเดตสัญญาเช่าของ ${tenantName}`,
  CONTRACT_DELETE: (tenantName: string) => `ลบสัญญาเช่าของ ${tenantName}`,
  CONTRACT_TERMINATE: (tenantName: string) => `ยกเลิกสัญญาเช่าของ ${tenantName}`,
  CONTRACT_RENEW: (tenantName: string) => `ต่อสัญญาเช่าของ ${tenantName}`,

  // Invoice activities
  INVOICE_CREATE: (invoiceNo: string, amount: number) => 
    `สร้างใบแจ้งหนี้ ${invoiceNo} จำนวน ${amount} บาท`,
  INVOICE_UPDATE: (invoiceNo: string) => `อัปเดตใบแจ้งหนี้ ${invoiceNo}`,
  INVOICE_DELETE: (invoiceNo: string) => `ลบใบแจ้งหนี้ ${invoiceNo}`,
  INVOICE_MARK_PAID: (invoiceNo: string) => `ทำเครื่องหมายใบแจ้งหนี้ ${invoiceNo} เป็นชำระแล้ว`,
  INVOICE_MARK_OVERDUE: (invoiceNo: string) => `ทำเครื่องหมายใบแจ้งหนี้ ${invoiceNo} เป็นเกินกำหนด`,
  INVOICE_PDF_GENERATE: (invoiceNo: string) => `สร้างไฟล์ PDF ใบแจ้งหนี้ ${invoiceNo}`,
  INVOICE_PRINT: (invoiceNo: string) => `พิมพ์ใบแจ้งหนี้ ${invoiceNo}`,

  // Receipt activities
  RECEIPT_CREATE: (receiptNo: string, amount: number) => 
    `สร้างใบเสร็จ ${receiptNo} จำนวน ${amount} บาท`,
  RECEIPT_UPDATE: (receiptNo: string) => `อัปเดตใบเสร็จ ${receiptNo}`,
  RECEIPT_DELETE: (receiptNo: string) => `ลบใบเสร็จ ${receiptNo}`,
  RECEIPT_PDF_GENERATE: (receiptNo: string) => `สร้างไฟล์ PDF ใบเสร็จ ${receiptNo}`,
  RECEIPT_PRINT: (receiptNo: string) => `พิมพ์ใบเสร็จ ${receiptNo}`,
}
