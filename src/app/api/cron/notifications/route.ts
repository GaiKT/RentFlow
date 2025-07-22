import { NextRequest, NextResponse } from 'next/server';
import { generateReminderNotifications, cleanupOldNotifications, createMonthlyReport } from '@/lib/notification-service';
import { prisma } from '@/lib/prisma';

// GET /api/cron/notifications - Cron job endpoint สำหรับสร้างการแจ้งเตือนอัตโนมัติ
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ cron secret (ถ้ามี) เพื่อความปลอดภัย
    const cronSecret = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (cronSecret !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    console.log('Starting notification generation...');

    // 1. สร้างการแจ้งเตือนต่างๆ
    await generateReminderNotifications();

    // 2. ทำความสะอาดการแจ้งเตือนเก่า (เฉพาะวันที่ 1 ของเดือน)
    const today = new Date();
    if (today.getDate() === 1) {
      await cleanupOldNotifications();
      
      // 3. สร้างรายงานรายเดือน (วันที่ 1 ของเดือน)
      const users = await prisma.user.findMany({
        select: { id: true }
      });

      for (const user of users) {
        await createMonthlyReport(user.id);
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`Notification generation completed in ${executionTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully',
      executionTime: executionTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/cron/notifications - Manual trigger สำหรับการทดสอบ
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'reminders':
        await generateReminderNotifications();
        return NextResponse.json({ success: true, message: 'Reminder notifications generated' });

      case 'cleanup':
        await cleanupOldNotifications();
        return NextResponse.json({ success: true, message: 'Old notifications cleaned up' });

      case 'monthly-report':
        const users = await prisma.user.findMany({ select: { id: true } });
        for (const user of users) {
          await createMonthlyReport(user.id);
        }
        return NextResponse.json({ success: true, message: 'Monthly reports generated' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in manual trigger:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
