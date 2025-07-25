import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { notifyInvoiceCreated } from '@/lib/notification-service';
import { createActivityLogger, ACTIVITY_DESCRIPTIONS } from '@/lib/activity-logger';

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

// GET /api/invoices - ดึงรายการใบแจ้งหนี้ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    // Build where clause
    const whereClause: any = {
      ownerId: payload.userId,
    };
    
    // Add status filter if provided
    if (statusParam) {
      const statusList = statusParam.split(',').map(s => s.trim());
      if (statusList.length === 1) {
        whereClause.status = statusList[0];
      } else {
        whereClause.status = { in: statusList };
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - สร้างใบแจ้งหนี้ใหม่
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, contractId, amount, dueDate, description } = body;

    // Validate required fields
    if (!roomId || !contractId || !amount || !dueDate || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify room ownership
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        ownerId: payload.userId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      );
    }

    // Verify contract exists and belongs to the room
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        roomId: roomId,
        ownerId: payload.userId,
        status: 'ACTIVE',
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found or not active' },
        { status: 404 }
      );
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the latest invoice number for this year-month
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        ownerId: payload.userId,
        invoiceNo: {
          startsWith: `INV-${year}${month}`,
        },
      },
      orderBy: {
        invoiceNo: 'desc',
      },
    });

    let sequence = 1;
    if (latestInvoice) {
      const lastSequence = parseInt(latestInvoice.invoiceNo.split('-')[2] || '0');
      sequence = lastSequence + 1;
    }

    const invoiceNo = `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;

    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        description,
        status: 'PENDING',
        roomId,
        contractId,
        ownerId: payload.userId,
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

    // สร้างการแจ้งเตือน
    await notifyInvoiceCreated({
      invoiceNo: invoice.invoiceNo,
      amount: invoice.amount,
      roomName: invoice.room.name,
      tenantName: invoice.contract?.tenantName,
      dueDate: invoice.dueDate,
      ownerId: payload.userId,
    });

    // Log activity
    const activityLogger = createActivityLogger(payload.userId, request);
    await activityLogger.logInvoiceAction(
      invoice.id,
      invoice.invoiceNo,
      'INVOICE_CREATE' as any,
      ACTIVITY_DESCRIPTIONS.INVOICE_CREATE(invoice.invoiceNo, invoice.amount),
      {
        roomName: invoice.room.name,
        tenantName: invoice.contract?.tenantName,
        amount: invoice.amount,
        dueDate: invoice.dueDate,
      }
    );

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
