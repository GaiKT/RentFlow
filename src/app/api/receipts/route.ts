import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { notifyPaymentReceived } from "@/lib/notification-service";

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

    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบ
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // ดึงข้อมูลใบเสร็จของผู้ใช้
    const receipts = await prisma.receipt.findMany({
      where: {
        ownerId: user.id,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    console.log('Fetched receipts:', receipts.length, receipts);

    return NextResponse.json({
      receipts: receipts,
      total: receipts.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { invoiceId, amount, paidAt, method, notes } = await request.json();

    // Validation
    if (!invoiceId || !amount || !paidAt || !method) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าใบแจ้งหนี้มีอยู่และเป็นของผู้ใช้
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        ownerId: decoded.userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "ไม่พบใบแจ้งหนี้หรือคุณไม่มีสิทธิ์เข้าถึง" },
        { status: 404 }
      );
    }

    // สร้างเลขที่ใบเสร็จ
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    const latestReceipt = await prisma.receipt.findFirst({
      where: {
        ownerId: decoded.userId,
        receiptNo: {
          startsWith: `REC-${year}${month}`,
        },
      },
      orderBy: {
        receiptNo: 'desc',
      },
    });

    let sequence = 1;
    if (latestReceipt) {
      const lastSequence = parseInt(latestReceipt.receiptNo.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    const receiptNo = `REC-${year}${month}-${String(sequence).padStart(4, '0')}`;

    // สร้างใบเสร็จ
    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        amount: parseFloat(amount),
        paidAt: new Date(paidAt),
        method,
        notes,
        invoiceId,
        roomId: invoice.room.id,
        contractId: invoice.contract?.id,
        ownerId: decoded.userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
          },
        },
      },
    });

    // อัพเดทสถานะใบแจ้งหนี้เป็น PAID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    });

    // สร้างการแจ้งเตือน
    await notifyPaymentReceived({
      receiptNo: receipt.receiptNo,
      amount: receipt.amount,
      roomName: receipt.room.name,
      tenantName: receipt.contract?.tenantName,
      ownerId: decoded.userId,
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Error creating receipt:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}