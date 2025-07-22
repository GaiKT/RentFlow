import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // ดึงการแจ้งเตือนของผู้ใช้
    const notifications = await prisma.notification.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      notifications,
      total: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    const { action, notificationId } = await request.json();

    if (action === "markAsRead" && notificationId) {
      // อ่านแจ้งเตือนเฉพาะ
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: decoded.userId,
        },
        data: {
          read: true,
        },
      });
    } else if (action === "markAllAsRead") {
      // อ่านทั้งหมด
      await prisma.notification.updateMany({
        where: {
          userId: decoded.userId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json({ message: "อัปเดตการแจ้งเตือนเรียบร้อย" });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ message: "ไม่พบ token การยืนยันตัวตน" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ message: "ไม่พบ ID การแจ้งเตือน" }, { status: 400 });
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: decoded.userId,
      },
    });

    return NextResponse.json({ message: "ลบการแจ้งเตือนเรียบร้อย" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
