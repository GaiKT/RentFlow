import { NextRequest, NextResponse } from 'next/server'
import { ActivityLogService } from '@/lib/activity-log-service'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/activity-logs/entity/[entity]/[entityId]
 * Get activity logs for a specific entity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; entityId: string }> }
) {
  try {
    const { entity, entityId } = await params;
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    // Check if user has access to this entity
    if (user.role !== 'ADMIN') {
      // Check if the entity belongs to the user
      let hasAccess = false
      
      switch (entity) {
        case 'room':
          const room = await prisma.room.findFirst({
            where: { id: entityId, ownerId: user.id }
          })
          hasAccess = !!room
          break
        case 'contract':
          const contract = await prisma.contract.findFirst({
            where: { id: entityId, ownerId: user.id }
          })
          hasAccess = !!contract
          break
        case 'invoice':
          const invoice = await prisma.invoice.findFirst({
            where: { id: entityId, ownerId: user.id }
          })
          hasAccess = !!invoice
          break
        case 'receipt':
          const receipt = await prisma.receipt.findFirst({
            where: { id: entityId, ownerId: user.id }
          })
          hasAccess = !!receipt
          break
        case 'user':
          hasAccess = entityId === user.id
          break
        default:
          hasAccess = false
      }

      if (!hasAccess) {
        return NextResponse.json(
          { message: "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้" },
          { status: 403 }
        );
      }
    }

    const logs = await ActivityLogService.getEntityActivityLogs(entity, entityId, limit)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching entity activity logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity activity logs' },
      { status: 500 }
    )
  }
}
