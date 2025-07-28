import { User, Room, Contract, Document, Invoice, Receipt, Notification, ActivityLog, Prisma } from '@prisma/client'

export type UserWithRelations = User & {
  rooms?: Room[]
  contracts?: Contract[]
  invoices?: Invoice[]
  receipts?: Receipt[]
  notifications?: Notification[]
}

export type RoomWithRelations = Room & {
  owner?: User
  contracts?: Contract[]
  invoices?: Invoice[]
  receipts?: Receipt[]
}

export type ContractWithRelations = Contract & {
  room?: Room
  owner?: User
  documents?: Document[]
  invoices?: Invoice[]
  receipts?: Receipt[]
}

export type InvoiceWithRelations = Invoice & {
  room?: Room
  contract?: Contract
  owner?: User
  receipts?: Receipt[]
}

export type ReceiptWithRelations = Receipt & {
  invoice?: Invoice
  room?: Room
  contract?: Contract
  owner?: User
}

export type NotificationWithRelations = Notification & {
  user?: User
}

export type ActivityLogWithRelations = ActivityLog & {
  user?: {
    id: string
    name: string
    email: string
    profileImage: string | null
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface RoomFormData {
  name: string
  description?: string
  address?: string
  rent: number
  deposit?: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE'
}

export interface ContractFormData {
  roomId: string
  startDate: Date
  endDate: Date
  rent: number
  deposit?: number
  tenantName: string
  tenantPhone?: string
  tenantEmail?: string
  notes?: string
}

export interface InvoiceFormData {
  roomId: string
  contractId?: string
  amount: number
  dueDate: Date
  description?: string
}

export interface ReceiptFormData {
  invoiceId: string
  amount: number
  method: string
  notes?: string
}

// Activity Log types
export interface ActivityLogCreateData {
  action: string
  entity: string
  entityId: string
  entityName?: string
  description: string
  metadata?: Prisma.InputJsonValue | null
  ipAddress?: string
  userAgent?: string
  userId: string
}

export interface ActivityLogFilters {
  userId?: string
  entity?: string
  action?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}
