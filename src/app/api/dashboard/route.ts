import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "ไม่พบ token หรือ token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as { userId: string; email: string; role?: string } | null;

    if (!decoded) {
      return NextResponse.json(
        { message: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้" },
        { status: 404 }
      );
    }

    // Get current date ranges
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get comprehensive dashboard statistics
    const [
      totalRooms,
      roomsByStatus,
      activeContracts,
      contractsExpiringSoon,
      invoiceStats,
      receiptStats,
      monthlyRevenue,
      yearlyRevenue,
      monthlyRevenueData,
      recentActivities,
      overdueInvoices,
    ] = await Promise.all([
      // Total rooms count
      prisma.room.count({
        where: { ownerId: user.id },
      }),
      
      // Rooms by status
      prisma.room.groupBy({
        by: ['status'],
        where: { ownerId: user.id },
        _count: { status: true },
      }),
      
      // Active contracts count
      prisma.contract.count({
        where: {
          ownerId: user.id,
          status: "ACTIVE",
        },
      }),
      
      // Contracts expiring soon (within 30 days)
      prisma.contract.count({
        where: {
          ownerId: user.id,
          status: "ACTIVE",
          endDate: {
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Invoice statistics
      prisma.invoice.groupBy({
        by: ['status'],
        where: { ownerId: user.id },
        _count: { status: true },
        _sum: { amount: true },
      }),
      
      // Receipt statistics for current month
      prisma.receipt.aggregate({
        where: {
          ownerId: user.id,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
      
      // Monthly revenue (current month)
      prisma.receipt.aggregate({
        where: {
          ownerId: user.id,
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
        _sum: { amount: true },
      }),
      
      // Yearly revenue
      prisma.receipt.aggregate({
        where: {
          ownerId: user.id,
          createdAt: {
            gte: currentYear,
          },
        },
        _sum: { amount: true },
      }),
      
      // Monthly revenue data for last 7 months
      Promise.all(
        Array.from({ length: 7 }, async (_, i) => {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - (6 - i) + 1, 1);
          
          const revenue = await prisma.receipt.aggregate({
            where: {
              ownerId: user.id,
              createdAt: {
                gte: monthStart,
                lt: monthEnd,
              },
            },
            _sum: { amount: true },
          });
          
          return {
            month: monthStart,
            revenue: revenue._sum.amount || 0,
          };
        })
      ),
      
      // Recent activities from activity logs
      prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          description: true,
          entityName: true,
          createdAt: true,
        },
      }),
      
      // Overdue invoices
      prisma.invoice.count({
        where: {
          ownerId: user.id,
          status: "OVERDUE",
          dueDate: {
            lt: now,
          },
        },
      }),
    ]);

    // Process room status data
    const roomStatusData = roomsByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Process invoice statistics
    const invoiceStatistics = invoiceStats.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = {
        count: item._count.status,
        amount: item._sum.amount || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    // Format monthly revenue data for charts
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const revenueChartData = {
      labels: monthlyRevenueData.map(item => monthNames[item.month.getMonth()]),
      revenue: monthlyRevenueData.map(item => item.revenue),
    };

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      description: activity.description,
      time: getRelativeTime(activity.createdAt),
      type: getActivityType(activity.action),
      icon: getActivityIcon(activity.action),
    }));

    const stats = {
      totalRooms,
      occupiedRooms: roomStatusData.occupied || 0,
      availableRooms: roomStatusData.available || 0,
      maintenanceRooms: roomStatusData.maintenance || 0,
      activeContracts,
      contractsExpiringSoon,
      pendingInvoices: invoiceStatistics.pending?.count || 0,
      paidInvoices: invoiceStatistics.paid?.count || 0,
      overdueInvoices,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      yearlyRevenue: yearlyRevenue._sum.amount || 0,
      totalReceipts: receiptStats._count.id || 0,
      monthlyReceiptAmount: receiptStats._sum.amount || 0,
      revenueChart: revenueChartData,
      roomStatus: {
        available: roomStatusData.available || 0,
        occupied: roomStatusData.occupied || 0,
        maintenance: roomStatusData.maintenance || 0,
        unavailable: roomStatusData.unavailable || 0,
      },
      invoiceStatistics,
    };

    return NextResponse.json({
      user,
      stats,
      recentActivities: formattedActivities,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

// Helper functions
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'เมื่อสักครู่';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} นาทีที่แล้ว`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ชั่วโมงที่แล้ว`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} วันที่แล้ว`;
  }
}

function getActivityType(action: string): 'success' | 'warning' | 'error' | 'info' {
  if (action.includes('CREATE') || action.includes('PAID')) return 'success';
  if (action.includes('OVERDUE') || action.includes('TERMINATE')) return 'error';
  if (action.includes('UPDATE') || action.includes('EXPIR')) return 'warning';
  return 'info';
}

function getActivityIcon(action: string): string {
  if (action.includes('USER')) return '👤';
  if (action.includes('ROOM')) return '🏠';
  if (action.includes('CONTRACT')) return '📝';
  if (action.includes('INVOICE')) return '💰';
  if (action.includes('RECEIPT')) return '🧾';
  return '📌';
}
