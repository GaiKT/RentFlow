import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/activity-log-service'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activity-logs/stats/[userId]
 * Get user activity statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // Check if user has access to the requested stats
    if (user.role !== 'ADMIN' && user.id !== userId) {
      return NextResponse.json(
        { message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
        { status: 403 }
      );
    }

    const stats = await ActivityLogService.getUserActivityStats(userId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user activity stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user activity stats' },
      { status: 500 }
    )
  }
}
