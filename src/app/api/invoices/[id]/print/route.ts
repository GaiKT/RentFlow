import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
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

// GET /api/invoices/[id]/print - พิมพ์ใบแจ้งหนี้
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
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate HTML for printing
    const html = generatePrintableInvoice(invoice);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating printable invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePrintableInvoice(invoice: any): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusLabels = {
    PENDING: 'รอชำระ',
    PAID: 'ชำระแล้ว',
    OVERDUE: 'เกินกำหนด',
    CANCELLED: 'ยกเลิก'
  };

  return `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ใบแจ้งหนี้ ${invoice.invoiceNo}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: 'Sarabun', sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-info h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 28px;
        }
        
        .company-info p {
            margin: 5px 0;
            color: #666;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-info h2 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        
        .invoice-number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        
        .details-section {
            margin: 30px 0;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .detail-group h3 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
        }
        
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        
        .detail-value {
            color: #333;
        }
        
        .amount-section {
            background: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        
        .amount-section h3 {
            color: #2563eb;
            margin: 0 0 15px 0;
        }
        
        .amount-value {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status.pending { background: #fef3c7; color: #d97706; }
        .status.paid { background: #d1fae5; color: #059669; }
        .status.overdue { background: #fee2e2; color: #dc2626; }
        .status.cancelled { background: #f3f4f6; color: #6b7280; }
        
        .description-section {
            margin: 30px 0;
        }
        
        .description-section h3 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
        }
        
        .description-text {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
            border-left: 4px solid #2563eb;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
        }
        
        .print-button:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="no-print">
            <button class="print-button" onclick="window.print()">🖨️ พิมพ์เอกสาร</button>
        </div>
        
        <div class="header">
            <div class="company-info">
                <h1>${invoice.owner.name || 'ระบบจัดการอสังหาริมทรัพย์'}</h1>
                <p>📧 ${invoice.owner.email}</p>
            </div>
            <div class="invoice-info">
                <h2>ใบแจ้งหนี้</h2>
                <div class="invoice-number">${invoice.invoiceNo}</div>
                <p>วันที่ออก: ${formatDate(invoice.issuedAt)}</p>
                <div class="status ${invoice.status.toLowerCase()}">${statusLabels[invoice.status as keyof typeof statusLabels]}</div>
            </div>
        </div>

        <div class="details-section">
            <div class="details-grid">
                <div class="detail-group">
                    <h3>🏠 ข้อมูลห้องพัก</h3>
                    <div class="detail-item">
                        <span class="detail-label">ชื่อห้อง:</span>
                        <span class="detail-value">${invoice.room.name}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ค่าเช่าต่อเดือน:</span>
                        <span class="detail-value">${formatCurrency(invoice.room.rent)}</span>
                    </div>
                    ${invoice.room.address ? `
                    <div class="detail-item">
                        <span class="detail-label">ที่อยู่:</span>
                        <span class="detail-value">${invoice.room.address}</span>
                    </div>
                    ` : ''}
                </div>

                ${invoice.contract ? `
                <div class="detail-group">
                    <h3>👤 ข้อมูลผู้เช่า</h3>
                    <div class="detail-item">
                        <span class="detail-label">ชื่อผู้เช่า:</span>
                        <span class="detail-value">${invoice.contract.tenantName}</span>
                    </div>
                    ${invoice.contract.tenantPhone ? `
                    <div class="detail-item">
                        <span class="detail-label">เบอร์โทร:</span>
                        <span class="detail-value">${invoice.contract.tenantPhone}</span>
                    </div>
                    ` : ''}
                    ${invoice.contract.tenantEmail ? `
                    <div class="detail-item">
                        <span class="detail-label">อีเมล:</span>
                        <span class="detail-value">${invoice.contract.tenantEmail}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>

            <div class="amount-section">
                <h3>💰 จำนวนเงินที่ต้องชำระ</h3>
                <div class="amount-value">${formatCurrency(invoice.amount)}</div>
                <p><strong>ครบกำหนดชำระ:</strong> ${formatDate(invoice.dueDate)}</p>
            </div>

            <div class="description-section">
                <h3>📝 รายละเอียด</h3>
                <div class="description-text">
                    ${invoice.description}
                </div>
            </div>
        </div>

        <div class="footer">
            <p>เอกสารนี้ออกโดยระบบจัดการอสังหาริมทรัพย์</p>
            <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
        </div>
    </div>

    <script>
        // Auto print when opened from print button
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('autoprint') === 'true') {
            window.onload = function() {
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        }
    </script>
</body>
</html>
  `;
}
