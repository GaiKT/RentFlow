import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const receipt = await prisma.receipt.findFirst({
      where: {
        id,
        ownerId: payload.userId
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        contract: {
          select: {
            id: true,
            tenantName: true,
            tenantPhone: true,
            tenantEmail: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            dueDate: true,
            description: true,
            issuedAt: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
