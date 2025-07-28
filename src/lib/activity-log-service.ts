import { prisma } from './prisma'
import { ActivityAction, Prisma } from '@prisma/client'
import type { ActivityLogCreateData, ActivityLogFilters, ActivityLogWithRelations } from '@/types'

/**
 * Activity Log Service
 * Handles logging and retrieving user activities throughout the system
 */
export class ActivityLogService {
  /**
   * Log a user activity
   */
  static async log(data: ActivityLogCreateData): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          action: data.action as ActivityAction,
          entity: data.entity,
          entityId: data.entityId,
          entityName: data.entityName,
          description: data.description,
          metadata: data.metadata ? data.metadata as Prisma.InputJsonValue : undefined,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          userId: data.userId,
        },
      })
    } catch (error) {
      console.error('Error logging activity:', error)
      // Don't throw error to prevent activity logging from breaking the main flow
    }
  }

  /**
   * Get activity logs with filters and pagination
   */
  static async getActivityLogs(filters: ActivityLogFilters = {}): Promise<{
    logs: ActivityLogWithRelations[]
    total: number
  }> {
    const {
      userId,
      entity,
      action,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = filters

    const where: {
      userId?: string;
      entity?: string;
      action?: ActivityAction;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {}

    if (userId) where.userId = userId
    if (entity) where.entity = entity
    if (action) where.action = action as ActivityAction
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = dateFrom
      if (dateTo) where.createdAt.lte = dateTo
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({ where }),
    ])

    return { logs, total }
  }

  /**
   * Get activity logs for a specific entity
   */
  static async getEntityActivityLogs(
    entity: string,
    entityId: string,
    limit: number = 20
  ): Promise<ActivityLogWithRelations[]> {
    return prisma.activityLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(userId: string): Promise<{
    totalActivities: number
    activitiesByEntity: Record<string, number>
    activitiesByAction: Record<string, number>
    recentActivities: ActivityLogWithRelations[]
  }> {
    const [totalActivities, activitiesByEntity, activitiesByAction, recentActivities] = await Promise.all([
      // Total activities count
      prisma.activityLog.count({
        where: { userId },
      }),

      // Activities grouped by entity
      prisma.activityLog.groupBy({
        by: ['entity'],
        where: { userId },
        _count: {
          id: true,
        },
      }).then(results => 
        results.reduce((acc, curr) => {
          acc[curr.entity] = curr._count.id
          return acc
        }, {} as Record<string, number>)
      ),

      // Activities grouped by action
      prisma.activityLog.groupBy({
        by: ['action'],
        where: { userId },
        _count: {
          id: true,
        },
      }).then(results => 
        results.reduce((acc, curr) => {
          acc[curr.action] = curr._count.id
          return acc
        }, {} as Record<string, number>)
      ),

      // Recent activities
      prisma.activityLog.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ])

    return {
      totalActivities,
      activitiesByEntity,
      activitiesByAction,
      recentActivities,
    }
  }

  /**
   * Clean up old activity logs (older than specified days)
   */
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    })

    return result.count
  }

  /**
   * Helper methods for common activity logging
   */
  static async logUserAction(
    userId: string,
    action: ActivityAction,
    description: string,
    metadata?: Prisma.InputJsonValue | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: action.toString(),
      entity: 'user',
      entityId: userId,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
    })
  }

  static async logRoomAction(
    userId: string,
    roomId: string,
    roomName: string,
    action: ActivityAction,
    description: string,
    metadata?: Prisma.InputJsonValue | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: action.toString(),
      entity: 'room',
      entityId: roomId,
      entityName: roomName,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
    })
  }

  static async logContractAction(
    userId: string,
    contractId: string,
    tenantName: string,
    action: ActivityAction,
    description: string,
    metadata?: Prisma.InputJsonValue | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: action.toString(),
      entity: 'contract',
      entityId: contractId,
      entityName: tenantName,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
    })
  }

  static async logInvoiceAction(
    userId: string,
    invoiceId: string,
    invoiceNo: string,
    action: ActivityAction,
    description: string,
    metadata?: Prisma.InputJsonValue | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: action.toString(),
      entity: 'invoice',
      entityId: invoiceId,
      entityName: invoiceNo,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
    })
  }

  static async logReceiptAction(
    userId: string,
    receiptId: string,
    receiptNo: string,
    action: ActivityAction,
    description: string,
    metadata?: Prisma.InputJsonValue | null,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: action.toString(),
      entity: 'receipt',
      entityId: receiptId,
      entityName: receiptNo,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
    })
  }
}

/**
 * Helper function to get client IP address from request headers
 */
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }

  // Fallback for local development
  return '127.0.0.1'
}

/**
 * Helper function to get user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

/**
 * Middleware helper to extract common request metadata
 */
export function getRequestMetadata(request: Request) {
  return {
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  }
}
