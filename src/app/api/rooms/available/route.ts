import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { message: "ไม่พบ token การยืนยันตัวตน" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    // Get all rooms owned by the user
    const allRooms = await prisma.room.findMany({
      where: {
        ownerId: decoded.userId,
      },
      include: {
        contracts: {
          where: {
            status: "ACTIVE",
            endDate: { gte: new Date() }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Filter rooms that don't have active contracts (available rooms)
    const availableRooms = allRooms.filter(room => room.contracts.length === 0);

    return NextResponse.json({
      success: true,
      rooms: availableRooms.map(room => ({
        id: room.id,
        name: room.name,
        address: room.address,
        rent: room.rent,
        deposit: room.deposit,
        description: room.description,
        status: room.status
      }))
    });

  } catch (error) {
    console.error("Error fetching available rooms:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลห้องที่ว่าง" },
      { status: 500 }
    );
  }
}
