import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import puppeteer from 'puppeteer';

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

// GET /api/invoices/[id]/pdf - ดาวน์โหลด PDF ใบแจ้งหนี้
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

    // Generate PDF using Puppeteer
    const pdfBuffer = await generateInvoicePDF(invoice);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateInvoicePDF(invoice: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set the HTML content
    const html = generatePDFHTML(invoice);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generatePDFHTML(invoice: any): string {
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
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 50px;
            border-bottom: 4px solid #2563eb;
            padding-bottom: 30px;
        }
        
        .company-info h1 {
            color: #2563eb;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 15px;
        }
        
        .company-info p {
            margin: 8px 0;
            color: #666;
            font-size: 16px;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-info h2 {
            color: #2563eb;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .invoice-number {
            font-size: 20px;
            font-weight: 700;
            color: #333;
            margin-bottom: 10px;
        }
        
        .status {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status.pending { background: #fef3c7; color: #d97706; border: 2px solid #f59e0b; }
        .status.paid { background: #d1fae5; color: #059669; border: 2px solid #10b981; }
        .status.overdue { background: #fee2e2; color: #dc2626; border: 2px solid #ef4444; }
        .status.cancelled { background: #f3f4f6; color: #6b7280; border: 2px solid #9ca3af; }
        
        .details-section {
            margin: 40px 0;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
        }
        
        .detail-group h3 {
            color: #2563eb;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }
        
        .detail-group h3::before {
            content: '';
            width: 8px;
            height: 30px;
            background: #2563eb;
            margin-right: 12px;
            border-radius: 4px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .detail-label {
            font-weight: 600;
            color: #666;
            flex: 1;
        }
        
        .detail-value {
            color: #333;
            font-weight: 500;
            text-align: right;
            flex: 1;
        }
        
        .amount-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 3px solid #2563eb;
            border-radius: 16px;
            padding: 30px;
            margin: 40px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .amount-section h3 {
            color: #2563eb;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .amount-value {
            font-size: 48px;
            font-weight: 800;
            color: #2563eb;
            margin: 15px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .due-date {
            font-size: 18px;
            font-weight: 600;
            color: #dc2626;
            margin-top: 15px;
        }
        
        .description-section {
            margin: 40px 0;
        }
        
        .description-section h3 {
            color: #2563eb;
            font-size: 20px;
            font-weight: 600;
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        
        .description-text {
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 6px solid #2563eb;
            font-size: 16px;
            line-height: 1.8;
        }
        
        .footer {
            margin-top: 60px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 2px solid #e5e7eb;
            padding-top: 30px;
        }
        
        .footer p {
            margin: 5px 0;
        }
        
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 100px;
            color: rgba(37, 99, 235, 0.05);
            font-weight: 900;
            z-index: -1;
            user-select: none;
        }
    </style>
</head>
<body>
    <div class="watermark">INVOICE</div>
    
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <h1>${invoice.owner.name || 'ระบบจัดการอสังหาริมทรัพย์'}</h1>
                <p>📧 ${invoice.owner.email}</p>
            </div>
            <div class="invoice-info">
                <h2>ใบแจ้งหนี้</h2>
                <div class="invoice-number">${invoice.invoiceNo}</div>
                <p style="margin: 10px 0; color: #666;">วันที่ออก: ${formatDate(invoice.issuedAt)}</p>
                <div class="status ${invoice.status.toLowerCase()}">${statusLabels[invoice.status as keyof typeof statusLabels]}</div>
            </div>
        </div>

        <div class="details-section">
            <div class="details-grid">
                <div class="detail-group">
                    <h3>ข้อมูลห้องพัก</h3>
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
                    <h3>ข้อมูลผู้เช่า</h3>
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
                <div class="due-date">⏰ ครบกำหนดชำระ: ${formatDate(invoice.dueDate)}</div>
            </div>

            <div class="description-section">
                <h3>📝 รายละเอียด</h3>
                <div class="description-text">
                    ${invoice.description}
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>เอกสารนี้ออกโดยระบบจัดการอสังหาริมทรัพย์</strong></p>
            <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            <p style="margin-top: 15px; font-style: italic;">หากมีข้อสงสัยกรุณาติดต่อ: ${invoice.owner.email}</p>
        </div>
    </div>
</body>
</html>
  `;
}
