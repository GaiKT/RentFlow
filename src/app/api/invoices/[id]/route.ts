import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

// GET /api/invoices/[id] - ดึงข้อมูลใบแจ้งหนี้ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params before using in Next.js 15
    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        ownerId: payload.userId,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            address: true,
            rent: true,
          },
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
            tenantPhone: true,
            tenantEmail: true,
            rent: true,
            startDate: true,
            endDate: true,
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
            paidAt: 'desc',
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[id] - อัปเดตสถานะใบแจ้งหนี้
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { status, amount, dueDate, description, paymentMethod, paymentNotes } = body;

    // Await params before using in Next.js 15
    const { id } = await params;

    // Verify invoice ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        ownerId: payload.userId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      status?: InvoiceStatus;
      amount?: number;
      notes?: string | null;
      dueDate?: Date;
      description?: string;
    } = {};
    
    if (status) {
      updateData.status = status as InvoiceStatus;
    }
    
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    }
    
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }

    // If status is being changed to PAID, create a receipt automatically
    let newReceipt = null;
    if (status === 'PAID' && existingInvoice.status !== 'PAID') {
      // Generate receipt number
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');

      const latestReceipt = await prisma.receipt.findFirst({
        where: {
          ownerId: payload.userId,
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

      // Create the receipt
      newReceipt = await prisma.receipt.create({
        data: {
          receiptNo,
          amount: updateData.amount || existingInvoice.amount,
          paidAt: new Date(),
          method: paymentMethod || 'transfer', // Use selected payment method
          notes: paymentNotes || `อัตโนมัติ - ชำระใบแจ้งหนี้ ${existingInvoice.invoiceNo}`,
          invoiceId: existingInvoice.id,
          roomId: existingInvoice.roomId,
          contractId: existingInvoice.contractId,
          ownerId: payload.userId,
        },
      });

      console.log('Auto-created receipt:', newReceipt);
    }

    // Update the invoice
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
        room: {
          select: {
            id: true,
            name: true,
            address: true,
            rent: true,
          },
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
            tenantPhone: true,
            tenantEmail: true,
            rent: true,
            startDate: true,
            endDate: true,
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
            paidAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      ...updatedInvoice,
      newReceipt, // Include the newly created receipt if any
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - ลบใบแจ้งหนี้
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Await params before using in Next.js 15
    const { id } = await params;

    // Verify invoice ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        ownerId: payload.userId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice has receipts (payments)
    const receiptsCount = await prisma.receipt.count({
      where: {
        invoiceId: id,
      },
    });

    if (receiptsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete invoice with existing receipts' },
        { status: 400 }
      );
    }

    // Delete the invoice
    await prisma.invoice.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
