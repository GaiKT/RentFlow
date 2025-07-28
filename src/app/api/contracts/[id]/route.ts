import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ContractStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

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

// GET /api/contracts/[id] - Get contract by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ownerId: payload.userId,
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
            invoiceNo: true,
            amount: true,
            status: true,
            dueDate: true,
            issuedAt: true,
          },
          orderBy: {
            dueDate: "desc",
          },
        },
        receipts: {
          select: {
            id: true,
            receiptNo: true,
            amount: true,
            paidAt: true,
            method: true,
          },
          orderBy: {
            paidAt: "desc",
          },
        },
        documents: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            description: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json({ contract }, { status: 200 });
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/contracts/[id] - Update contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
      tenantName,
      tenantPhone,
      tenantEmail,
      startDate,
      endDate,
      rent,
      deposit,
      terms,
      notes,
      status,
    } = await request.json();

    // Validation
    const errors: Record<string, string> = {};

    if (tenantName !== undefined && (!tenantName || typeof tenantName !== "string" || tenantName.trim().length === 0)) {
      errors.tenantName = "กรุณากรอกชื่อผู้เช่า";
    }

    if (tenantPhone !== undefined && (!tenantPhone || typeof tenantPhone !== "string" || tenantPhone.trim().length === 0)) {
      errors.tenantPhone = "กรุณากรอกเบอร์โทรศัพท์";
    }

    if (tenantEmail !== undefined) {
      if (!tenantEmail || typeof tenantEmail !== "string" || tenantEmail.trim().length === 0) {
        errors.tenantEmail = "กรุณากรอกอีเมล";
      } else if (!/\S+@\S+\.\S+/.test(tenantEmail)) {
        errors.tenantEmail = "รูปแบบอีเมลไม่ถูกต้อง";
      }
    }

    if (startDate !== undefined && (!startDate || typeof startDate !== "string")) {
      errors.startDate = "กรุณาเลือกวันที่เริ่มสัญญา";
    }

    if (endDate !== undefined && (!endDate || typeof endDate !== "string")) {
      errors.endDate = "กรุณาเลือกวันที่สิ้นสุดสัญญา";
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      errors.endDate = "วันที่สิ้นสุดต้องหลังจากวันที่เริ่มสัญญา";
    }

    if (rent !== undefined && (!rent || typeof rent !== "number" || rent <= 0)) {
      errors.rent = "กรุณากรอกค่าเช่าที่ถูกต้อง";
    }

    if (deposit !== undefined && deposit !== null && (typeof deposit !== "number" || deposit < 0)) {
      errors.deposit = "กรุณากรอกเงินมัดจำที่ถูกต้อง";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ message: "Validation failed", errors }, { status: 400 });
    }

    // Check if contract exists and belongs to user
    const existingContract = await prisma.contract.findFirst({
      where: {
        id,
        ownerId: payload.userId,
      },
    });

    if (!existingContract) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      tenantName?: string;
      tenantPhone?: string;
      tenantEmail?: string;
      startDate?: Date;
      endDate?: Date;
      rent?: number;
      deposit?: number;
      terms?: string | null;
      notes?: string | null;
      status?: ContractStatus;
    } = {};
    if (tenantName !== undefined) updateData.tenantName = tenantName.trim();
    if (tenantPhone !== undefined) updateData.tenantPhone = tenantPhone.trim();
    if (tenantEmail !== undefined) updateData.tenantEmail = tenantEmail.trim();
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (rent !== undefined) updateData.rent = rent;
    if (deposit !== undefined) updateData.deposit = deposit;
    if (terms !== undefined) updateData.terms = terms?.trim() || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (status !== undefined) updateData.status = status as ContractStatus;

    // Update contract
    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ contract }, { status: 200 });
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/contracts/[id] - Delete contract
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Check if contract exists and belongs to user
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        ownerId: payload.userId,
      },
      include: {
        room: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ message: "Contract not found" }, { status: 404 });
    }

    // Delete contract (cascade will handle related records)
    await prisma.contract.delete({
      where: { id },
    });

    // Update room status to AVAILABLE if this was the active contract
    if (contract.status === "ACTIVE") {
      await prisma.room.update({
        where: { id: contract.roomId },
        data: { status: "AVAILABLE" },
      });
    }

    return NextResponse.json({ message: "Contract deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
