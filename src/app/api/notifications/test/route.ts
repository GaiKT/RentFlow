import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createNotification, NotificationTypeLabels } from '@/lib/notification-service';
import { NotificationType } from '@prisma/client';

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

    const { type } = await request.json();

    // สร้างการแจ้งเตือนทดสอบสำหรับแต่ละประเภท
    const testNotifications = [
      {
        title: '💰 ทดสอบ - ได้รับชำระเงิน',
        message: 'ได้รับชำระเงิน ฿15,000 จากห้อง 101 (คุณสมชาย) ใบเสร็จ #REC-202407-0001',
        type: NotificationType.PAYMENT_RECEIVED,
        userId: payload.userId
      },
      {
        title: '📄 ทดสอบ - สร้างใบแจ้งหนี้ใหม่',
        message: 'สร้างใบแจ้งหนี้ #INV-202407-0001 จำนวน ฿15,000 สำหรับห้อง 101 (คุณสมชาย) ครบกำหนดชำระ 31 ก.ค. 2025',
        type: NotificationType.INVOICE_CREATED,
        userId: payload.userId
      },
      {
        title: '📝 ทดสอบ - สร้างสัญญาเช่าใหม่',
        message: 'สร้างสัญญาเช่าห้อง 102 กับ คุณสมหญิง ค่าเช่า ฿12,000/เดือน ระยะเวลา 23/7/2025 - 22/7/2026',
        type: NotificationType.CONTRACT_CREATED,
        userId: payload.userId
      },
      {
        title: '📋 ทดสอบ - สัญญาใกล้หมดอายุ',
        message: 'สัญญาเช่าห้อง 103 กับ คุณสมศักดิ์ จะหมดอายุในอีก 7 วัน (30/7/2025)',
        type: NotificationType.CONTRACT_EXPIRY,
        userId: payload.userId
      },
      {
        title: '💰 ทดสอบ - ใกล้ครบกำหนดชำระ',
        message: 'ใบแจ้งหนี้ #INV-202407-0002 ห้อง 104 (คุณสมปอง) ครบกำหนดชำระในอีก 3 วัน (26/7/2025) จำนวน ฿18,000',
        type: NotificationType.RENT_DUE,
        userId: payload.userId
      },
      {
        title: '⚠️ ทดสอบ - ใบแจ้งหนี้เลยกำหนด',
        message: 'ใบแจ้งหนี้ #INV-202406-0010 ห้อง 105 (คุณสมใจ) เลยกำหนดชำระแล้ว 5 วัน จำนวน ฿16,500',
        type: NotificationType.INVOICE_OVERDUE,
        userId: payload.userId
      },
      {
        title: '🏠 ทดสอบ - เปลี่ยนสถานะห้อง',
        message: 'ห้อง 106 เปลี่ยนสถานะจาก "ว่าง" เป็น "มีผู้เช่า"',
        type: NotificationType.ROOM_STATUS_CHANGED,
        userId: payload.userId
      },
      {
        title: '🔧 ทดสอบ - แจ้งซ่อมบำรุง',
        message: 'ห้อง 107 ต้องการซ่อมบำรุง: ก๊อกน้ำรั่ว (ความสำคัญ: สูง)',
        type: NotificationType.MAINTENANCE,
        userId: payload.userId
      },
      {
        title: '📊 ทดสอบ - รายงานรายเดือน',
        message: 'รายงาน กรกฎาคม 2025: รายรับ ฿125,000 | ใบแจ้งหนี้ 8 ใบ | ใบเสร็จ 7 ใบ | เลยกำหนด 1 ใบ',
        type: NotificationType.MONTHLY_REPORT,
        userId: payload.userId
      }
    ];

    // สร้างการแจ้งเตือนตามประเภทที่กำหนด หรือสร้างทั้งหมด
    let notificationsToCreate = testNotifications;
    
    if (type && type !== 'all') {
      notificationsToCreate = testNotifications.filter(n => n.type === type);
    }

    // สร้างการแจ้งเตือนทีละตัว
    for (const notification of notificationsToCreate) {
      await createNotification(notification);
    }

    return NextResponse.json({
      success: true,
      message: `สร้างการแจ้งเตือนทดสอบแล้ว ${notificationsToCreate.length} รายการ`,
      created: notificationsToCreate.length,
      types: notificationsToCreate.map(n => n.type)
    });

  } catch (error) {
    console.error('Error creating test notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
