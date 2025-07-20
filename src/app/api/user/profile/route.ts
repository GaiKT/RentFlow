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
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลผู้ใช้" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

    const { name, phone, profileImage } = await req.json();

    // Validate input
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { message: "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (phone && phone.length > 0 && !/^[0-9-+\s()]+$/.test(phone)) {
      return NextResponse.json(
        { message: "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        profileImage: profileImage || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "อัปเดตโปรไฟล์สำเร็จ",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์" },
      { status: 500 }
    );
  }
}
