import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/activity-log-service'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activity-logs
 * Get activity logs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "ไม่พบ token หรือ token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Get user details to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      userId: searchParams.get('userId') || undefined,
      entity: searchParams.get('entity') || undefined,
      action: searchParams.get('action') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    // If not admin, only show user's own activities
    if (user.role !== 'ADMIN') {
      filters.userId = user.id
    }

    const result = await ActivityLogService.getActivityLogs(filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/activity-logs
 * Clean up old activity logs (Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "ไม่พบ token หรือ token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Get user details to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url)
    const daysToKeep = searchParams.get('daysToKeep') 
      ? parseInt(searchParams.get('daysToKeep')!) 
      : 90

    const deletedCount = await ActivityLogService.cleanupOldLogs(daysToKeep)

    return NextResponse.json({
      message: `Successfully deleted ${deletedCount} old activity logs`,
      deletedCount,
    })
  } catch (error) {
    console.error('Error cleaning up activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to clean up activity logs' },
      { status: 500 }
    )
  }
}
