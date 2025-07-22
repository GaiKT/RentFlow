import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import puppeteer from 'puppeteer';

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

    const pdfBuffer = await generateReceiptPDF(receipt);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receipt.receiptNo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateReceiptPDF(receipt: any): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    const html = generatePDFHTML(receipt);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function generatePDFHTML(receipt: any): string {
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'เงินสด',
      transfer: 'โอนเงิน',
      mobile: 'Mobile Banking',
      other: 'อื่นๆ'
    };
    return methods[method as keyof typeof methods] || 'อื่นๆ';
  };

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ใบเสร็จ ${receipt.receiptNo}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          background-color: #fff;
          padding: 15px;
        }
        
        .receipt-container {
          max-width: 100%;
          margin: 0 auto;
          background: #fff;
          border: 2px solid #22c55e;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 25px;
          text-align: center;
        }
        
        .receipt-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        
        .receipt-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .receipt-number {
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 16px;
          margin-top: 12px;
          display: inline-block;
          font-weight: 600;
          font-size: 14px;
        }
        
        .receipt-body {
          padding: 25px;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #16a34a;
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 25px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 3px;
          font-weight: 500;
        }
        
        .info-value {
          font-weight: 600;
          color: #111827;
          font-size: 12px;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 15px 0;
        }
        
        .amount-label {
          font-size: 14px;
          color: #16a34a;
          margin-bottom: 8px;
          font-weight: 600;
        }
        
        .amount-value {
          font-size: 28px;
          font-weight: 700;
          color: #15803d;
        }
        
        .payment-status {
          background: #22c55e;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          display: inline-block;
          font-weight: 600;
          margin-top: 12px;
          font-size: 12px;
        }
        
        .notes-section {
          background: #f9fafb;
          border-left: 3px solid #22c55e;
          padding: 12px 16px;
          border-radius: 6px;
          margin: 15px 0;
        }
        
        .footer {
          border-top: 1px solid #e5e7eb;
          padding: 15px 0;
          text-align: center;
          color: #6b7280;
          font-size: 11px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
          padding-top: 25px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1px solid #d1d5db;
          width: 150px;
          margin: 25px auto 8px;
        }
        
        .signature-label {
          font-weight: 600;
          color: #374151;
          font-size: 11px;
        }
        
        .full-width {
          grid-column: 1 / -1;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <div class="receipt-title">ใบเสร็จรับเงิน</div>
          <div class="receipt-subtitle">RECEIPT</div>
          <div class="receipt-number">เลขที่ ${receipt.receiptNo}</div>
        </div>
        
        <div class="receipt-body">
          <!-- ข้อมูลผู้รับเงิน -->
          <div class="section">
            <div class="section-title">ข้อมูลผู้รับเงิน</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">ชื่อ</div>
                <div class="info-value">${receipt.owner.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">อีเมล</div>
                <div class="info-value">${receipt.owner.email}</div>
              </div>
              ${receipt.owner.phone ? `
              <div class="info-item">
                <div class="info-label">เบอร์โทรศัพท์</div>
                <div class="info-value">${receipt.owner.phone}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- ข้อมูลผู้ชำระเงิน -->
          <div class="section">
            <div class="section-title">ข้อมูลผู้ชำระเงิน</div>
            <div class="info-grid">
              ${receipt.contract ? `
              <div class="info-item">
                <div class="info-label">ชื่อผู้เช่า</div>
                <div class="info-value">${receipt.contract.tenantName}</div>
              </div>
              ${receipt.contract.tenantPhone ? `
              <div class="info-item">
                <div class="info-label">เบอร์โทรศัพท์</div>
                <div class="info-value">${receipt.contract.tenantPhone}</div>
              </div>
              ` : ''}
              ${receipt.contract.tenantEmail ? `
              <div class="info-item">
                <div class="info-label">อีเมล</div>
                <div class="info-value">${receipt.contract.tenantEmail}</div>
              </div>
              ` : ''}
              ` : `
              <div class="info-item">
                <div class="info-label">ผู้ชำระเงิน</div>
                <div class="info-value">-</div>
              </div>
              `}
              <div class="info-item">
                <div class="info-label">ห้อง</div>
                <div class="info-value">${receipt.room.name}</div>
              </div>
            </div>
          </div>
          
          <!-- รายละเอียดการชำระ -->
          <div class="section">
            <div class="section-title">รายละเอียดการชำระเงิน</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">เลขที่ใบแจ้งหนี้</div>
                <div class="info-value">${receipt.invoice.invoiceNo}</div>
              </div>
              <div class="info-item">
                <div class="info-label">วันที่ครบกำหนดชำระ</div>
                <div class="info-value">${formatDate(receipt.invoice.dueDate)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">วันที่ชำระเงิน</div>
                <div class="info-value">${formatDateTime(receipt.paidAt)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">วิธีการชำระ</div>
                <div class="info-value">${getPaymentMethodLabel(receipt.method)}</div>
              </div>
              ${receipt.invoice.description ? `
              <div class="info-item full-width">
                <div class="info-label">รายละเอียด</div>
                <div class="info-value">${receipt.invoice.description}</div>
              </div>
              ` : ''}
            </div>
          </div>
          
          <!-- จำนวนเงิน -->
          <div class="amount-section">
            <div class="amount-label">จำนวนเงินที่ชำระ</div>
            <div class="amount-value">${formatCurrency(receipt.amount)}</div>
            <div class="payment-status">✓ ชำระเงินเรียบร้อยแล้ว</div>
          </div>
          
          ${receipt.notes ? `
          <div class="notes-section">
            <div class="info-label">หมายเหตุ</div>
            <div class="info-value">${receipt.notes}</div>
          </div>
          ` : ''}
          
          <!-- ลายเซ็น -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">ผู้รับเงิน</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">ผู้ชำระเงิน</div>
            </div>
          </div>
          
          <div class="footer">
            <div>วันที่ออกใบเสร็จ: ${formatDateTime(receipt.createdAt)}</div>
            <div style="margin-top: 8px;">
              ใบเสร็จนี้ออกโดยระบบจัดการทรัพย์สิน
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
