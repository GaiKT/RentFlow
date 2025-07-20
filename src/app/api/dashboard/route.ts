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

    // Get dashboard statistics
    const [
      totalRooms,
      occupiedRooms,
      activeContracts,
      pendingInvoices,
      unpaidInvoices,
      monthlyRevenue,
    ] = await Promise.all([
      // Total rooms count
      prisma.room.count({
        where: { ownerId: user.id },
      }),
      // Occupied rooms count
      prisma.room.count({
        where: {
          ownerId: user.id,
          status: "OCCUPIED",
        },
      }),
      // Active contracts count
      prisma.contract.count({
        where: {
          ownerId: user.id,
          status: "ACTIVE",
        },
      }),
      // Pending invoices count
      prisma.invoice.count({
        where: {
          ownerId: user.id,
          status: "PENDING",
        },
      }),
      // Unpaid invoices count
      prisma.invoice.count({
        where: {
          ownerId: user.id,
          status: "OVERDUE",
        },
      }),
      // Monthly revenue (sum of paid invoices this month)
      prisma.invoice.aggregate({
        where: {
          ownerId: user.id,
          status: "PAID",
          issuedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const stats = {
      totalRooms,
      occupiedRooms,
      activeContracts,
      pendingInvoices,
      unpaidInvoices,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
    };

    return NextResponse.json({
      user,
      stats,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
