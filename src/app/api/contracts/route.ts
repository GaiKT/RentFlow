import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { notifyContractCreated, notifyRoomStatusChanged } from "@/lib/notification-service";

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
}

// Helper function to verify JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/contracts - Get all contracts for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const contracts = await prisma.contract.findMany({
      where: {
        room: {
          ownerId: payload.userId,
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ contracts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const {
      roomId,
      tenantName,
      tenantPhone,
      tenantEmail,
      startDate,
      endDate,
      rent,
      deposit,
      terms,
      notes,
    } = await request.json();

    // Validation
    const errors: any = {};

    if (!roomId || typeof roomId !== "string") {
      errors.roomId = "Room ID is required";
    }

    if (!tenantName || typeof tenantName !== "string" || tenantName.trim().length === 0) {
      errors.tenantName = "กรุณากรอกชื่อผู้เช่า";
    }

    if (!tenantPhone || typeof tenantPhone !== "string" || tenantPhone.trim().length === 0) {
      errors.tenantPhone = "กรุณากรอกเบอร์โทรศัพท์";
    }

    if (!tenantEmail || typeof tenantEmail !== "string" || tenantEmail.trim().length === 0) {
      errors.tenantEmail = "กรุณากรอกอีเมล";
    } else if (!/\S+@\S+\.\S+/.test(tenantEmail)) {
      errors.tenantEmail = "รูปแบบอีเมลไม่ถูกต้อง";
    }

    if (!startDate || typeof startDate !== "string") {
      errors.startDate = "กรุณาเลือกวันที่เริ่มสัญญา";
    }

    if (!endDate || typeof endDate !== "string") {
      errors.endDate = "กรุณาเลือกวันที่สิ้นสุดสัญญา";
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errors.endDate = "วันที่สิ้นสุดต้องหลังจากวันที่เริ่มสัญญา";
    }

    if (!rent || typeof rent !== "number" || rent <= 0) {
      errors.rent = "กรุณากรอกค่าเช่าที่ถูกต้อง";
    }

    if (deposit !== null && deposit !== undefined && (typeof deposit !== "number" || deposit < 0)) {
      errors.deposit = "กรุณากรอกเงินมัดจำที่ถูกต้อง";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    // Check if room exists and belongs to user
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        ownerId: payload.userId,
      },
    });

    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Check if room has active contract
    const activeContract = await prisma.contract.findFirst({
      where: {
        roomId: roomId,
        status: "ACTIVE",
      },
    });

    if (activeContract) {
      return NextResponse.json(
        { message: "ห้องนี้มีสัญญาเช่าที่ใช้งานอยู่แล้ว" },
        { status: 400 }
      );
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        roomId,
        ownerId: payload.userId,
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
        tenantEmail: tenantEmail.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rent,
        deposit: deposit || null,
        terms: terms?.trim() || null,
        notes: notes?.trim() || null,
        status: "ACTIVE",
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    // Update room status to OCCUPIED
    await prisma.room.update({
      where: { id: roomId },
      data: { status: "OCCUPIED" },
    });

    // สร้างการแจ้งเตือน
    await notifyContractCreated({
      roomName: contract.room.name,
      tenantName: contract.tenantName,
      rent: contract.rent,
      startDate: contract.startDate,
      endDate: contract.endDate,
      ownerId: payload.userId,
    });

    // แจ้งเตือนการเปลี่ยนสถานะห้อง
    await notifyRoomStatusChanged({
      roomName: contract.room.name,
      oldStatus: 'AVAILABLE',
      newStatus: 'OCCUPIED',
      ownerId: payload.userId,
    });

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
