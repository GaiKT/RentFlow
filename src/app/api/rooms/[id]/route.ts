import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contracts: {
          orderBy: { createdAt: "desc" },
          include: {
            invoices: {
              select: {
                id: true,
                amount: true,
                status: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลห้องพัก" },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error("Room fetch error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const { name, description, address, rent, deposit, status } = await req.json();

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

    // Check if room exists and user has permission
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลห้องพัก" },
        { status: 404 }
      );
    }

    if (existingRoom.ownerId !== decoded.userId) {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์แก้ไขห้องพักนี้" },
        { status: 403 }
      );
    }

    // Check if new room name conflicts with another room
    if (name !== existingRoom.name) {
      const nameConflict = await prisma.room.findFirst({
        where: {
          name,
          ownerId: decoded.userId,
          NOT: { id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { message: "ชื่อห้องนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        name,
        description: description || null,
        address: address || null,
        rent: parseFloat(rent),
        deposit: deposit ? parseFloat(deposit) : null,
        status: status || existingRoom.status,
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

    return NextResponse.json({
      message: "แก้ไขข้อมูลห้องพักสำเร็จ",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Room update error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลห้องพัก" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    // Check if room exists and user has permission
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        contracts: {
          where: {
            status: "ACTIVE",
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลห้องพัก" },
        { status: 404 }
      );
    }

    if (room.ownerId !== decoded.userId) {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์ลบห้องพักนี้" },
        { status: 403 }
      );
    }

    // Check if room has active contracts
    if (room.contracts.length > 0) {
      return NextResponse.json(
        { message: "ไม่สามารถลบห้องพักที่มีสัญญาเช่าที่ยังใช้งานอยู่" },
        { status: 400 }
      );
    }

    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "ลบข้อมูลห้องพักสำเร็จ",
    });
  } catch (error) {
    console.error("Room deletion error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการลบข้อมูลห้องพัก" },
      { status: 500 }
    );
  }
}
