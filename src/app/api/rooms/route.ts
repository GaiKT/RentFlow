import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { ActivityLogService, getRequestMetadata } from "@/lib/activity-log-service";
import { ActivityAction } from "@prisma/client";

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
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Check for include query parameter
    const { searchParams } = new URL(req.url);
    const includeContracts = searchParams.get('include') === 'contracts';

    const rooms = await prisma.room.findMany({
      where: {
        ownerId: decoded.userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contracts: includeContracts ? {
          select: {
            id: true,
            tenantName: true,
            tenantPhone: true,
            tenantEmail: true,
            rent: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        } : {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            tenantName: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
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

    const { name, description, address, rent, deposit } = await req.json();

    // Validate input
    if (!name || !rent) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลที่จำเป็น (ชื่อห้อง, ค่าเช่า)" },
        { status: 400 }
      );
    }

    if (rent <= 0) {
      return NextResponse.json(
        { message: "ค่าเช่าต้องมากกว่า 0" },
        { status: 400 }
      );
    }

    // Check if room name already exists for this user
    const existingRoom = await prisma.room.findFirst({
      where: { 
        name,
        ownerId: decoded.userId,
      },
    });

    if (existingRoom) {
      return NextResponse.json(
        { message: "ชื่อห้องนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const room = await prisma.room.create({
      data: {
        name,
        description: description || null,
        address: address || null,
        rent: parseFloat(rent),
        deposit: deposit ? parseFloat(deposit) : null,
        status: "AVAILABLE",
        ownerId: decoded.userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the room creation activity
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await ActivityLogService.logRoomAction(
      decoded.userId,
      room.id,
      room.name,
      'ROOM_CREATE' as ActivityAction,
      `สร้างห้องพักใหม่: ${room.name} (ค่าเช่า: ${room.rent} บาท)`,
      { 
        rent: room.rent,
        deposit: room.deposit,
        address: room.address,
        description: room.description 
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      message: "สร้างห้องพักสำเร็จ",
      room,
    });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสร้างห้องพัก" },
      { status: 500 }
    );
  }
}
