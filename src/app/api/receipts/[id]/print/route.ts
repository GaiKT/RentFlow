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

    const html = generatePrintableReceipt(receipt);
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating receipt print:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePrintableReceipt(receipt: any): string {
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
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          background-color: #fff;
          padding: 20px;
        }
        
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border: 2px solid #22c55e;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .receipt-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .receipt-subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .receipt-number {
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 20px;
          margin-top: 15px;
          display: inline-block;
          font-weight: 600;
          font-size: 16px;
        }
        
        .receipt-body {
          padding: 30px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #16a34a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px 30px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .info-value {
          font-weight: 600;
          color: #111827;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin: 20px 0;
        }
        
        .amount-label {
          font-size: 16px;
          color: #16a34a;
          margin-bottom: 10px;
          font-weight: 600;
        }
        
        .amount-value {
          font-size: 32px;
          font-weight: 700;
          color: #15803d;
        }
        
        .payment-status {
          background: #22c55e;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          display: inline-block;
          font-weight: 600;
          margin-top: 15px;
        }
        
        .notes-section {
          background: #f9fafb;
          border-left: 4px solid #22c55e;
          padding: 15px 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .footer {
          border-top: 2px solid #e5e7eb;
          padding: 20px 0;
          text-align: center;
          color: #6b7280;
          font-size: 13px;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50px;
          margin-top: 40px;
          padding-top: 30px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 2px solid #d1d5db;
          width: 200px;
          margin: 30px auto 10px;
        }
        
        .signature-label {
          font-weight: 600;
          color: #374151;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .receipt-container {
            box-shadow: none;
            border: 1px solid #ccc;
          }
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
            </div>
            
            ${receipt.invoice.description ? `
            <div style="margin-top: 15px;">
              <div class="info-label">รายละเอียด</div>
              <div class="info-value">${receipt.invoice.description}</div>
            </div>
            ` : ''}
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
            <div style="margin-top: 10px;">
              ใบเสร็จนี้ออกโดยระบบจัดการทรัพย์สิน
            </div>
          </div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
}
