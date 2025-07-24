/**
 * Notification Service - ระบบจัดการการแจ้งเตือนอัตโนมัติ
 * สำหรับระบบจัดการอสังหาริมทรัพย์
 */
import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

export interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
}

export const NotificationTypeLabels = {
  [NotificationType.CONTRACT_EXPIRY]: {
    label: 'สัญญาใกล้หมดอายุ',
    icon: '📋',
    color: 'warning'
  },
  [NotificationType.RENT_DUE]: {
    label: 'ใกล้ครบกำหนดชำระ',
    icon: '💰',
    color: 'info'
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    label: 'ได้รับชำระเงิน',
    icon: '✅',
    color: 'success'
  },
  [NotificationType.MAINTENANCE]: {
    label: 'บำรุงรักษา',
    icon: '🔧',
    color: 'warning'
  },
  [NotificationType.GENERAL]: {
    label: 'ทั่วไป',
    icon: '📢',
    color: 'info'
  },
  [NotificationType.INVOICE_CREATED]: {
    label: 'สร้างใบแจ้งหนี้',
    icon: '📄',
    color: 'info'
  },
  [NotificationType.CONTRACT_CREATED]: {
    label: 'สร้างสัญญาใหม่',
    icon: '📝',
    color: 'success'
  },
  [NotificationType.CONTRACT_TERMINATED]: {
    label: 'สิ้นสุดสัญญา',
    icon: '❌',
    color: 'error'
  },
  [NotificationType.INVOICE_OVERDUE]: {
    label: 'เลยกำหนดชำระ',
    icon: '⚠️',
    color: 'error'
  },
  [NotificationType.ROOM_STATUS_CHANGED]: {
    label: 'เปลี่ยนสถานะห้อง',
    icon: '🏠',
    color: 'info'
  },
  [NotificationType.MONTHLY_REPORT]: {
    label: 'รายงานรายเดือน',
    icon: '📊',
    color: 'info'
  }
};

/**
 * สร้างการแจ้งเตือนใหม่
 */
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        read: false
      }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * สร้างการแจ้งเตือนแบบเป็นกลุ่ม
 */
export async function createBulkNotifications(notifications: NotificationData[]): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: notifications.map(notif => ({
        title: notif.title,
        message: notif.message,
        type: notif.type,
        userId: notif.userId,
        read: false
      }))
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
}

/**
 * แจ้งเตือนเมื่อได้รับชำระเงิน
 */
export async function notifyPaymentReceived(receiptData: {
  receiptNo: string;
  amount: number;
  roomName: string;
  tenantName?: string;
  ownerId: string;
}): Promise<void> {
  const notification: NotificationData = {
    title: 'ได้รับชำระเงินแล้ว',
    message: `ได้รับชำระเงิน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(receiptData.amount)} จากห้อง ${receiptData.roomName}${receiptData.tenantName ? ` (${receiptData.tenantName})` : ''} ใบเสร็จ #${receiptData.receiptNo}`,
    type: NotificationType.PAYMENT_RECEIVED,
    userId: receiptData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนเมื่อสร้างใบแจ้งหนี้
 */
export async function notifyInvoiceCreated(invoiceData: {
  invoiceNo: string;
  amount: number;
  roomName: string;
  tenantName?: string;
  dueDate: Date;
  ownerId: string;
}): Promise<void> {
  const dueDateStr = invoiceData.dueDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const notification: NotificationData = {
    title: 'สร้างใบแจ้งหนี้ใหม่',
    message: `สร้างใบแจ้งหนี้ #${invoiceData.invoiceNo} จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoiceData.amount)} สำหรับห้อง ${invoiceData.roomName}${invoiceData.tenantName ? ` (${invoiceData.tenantName})` : ''} ครบกำหนดชำระ ${dueDateStr}`,
    type: NotificationType.INVOICE_CREATED,
    userId: invoiceData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนเมื่อสร้างสัญญาใหม่
 */
export async function notifyContractCreated(contractData: {
  roomName: string;
  tenantName: string;
  rent: number;
  startDate: Date;
  endDate: Date;
  ownerId: string;
}): Promise<void> {
  const startDateStr = contractData.startDate.toLocaleDateString('th-TH');
  const endDateStr = contractData.endDate.toLocaleDateString('th-TH');

  const notification: NotificationData = {
    title: 'สร้างสัญญาเช่าใหม่',
    message: `สร้างสัญญาเช่าห้อง ${contractData.roomName} กับ ${contractData.tenantName} ค่าเช่า ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(contractData.rent)}/เดือน ระยะเวลา ${startDateStr} - ${endDateStr}`,
    type: NotificationType.CONTRACT_CREATED,
    userId: contractData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนเมื่อสิ้นสุดสัญญา
 */
export async function notifyContractTerminated(contractData: {
  roomName: string;
  tenantName: string;
  endDate: Date;
  reason?: string;
  ownerId: string;
}): Promise<void> {
  const endDateStr = contractData.endDate.toLocaleDateString('th-TH');

  const notification: NotificationData = {
    title: 'สิ้นสุดสัญญาเช่า',
    message: `สัญญาเช่าห้อง ${contractData.roomName} กับ ${contractData.tenantName} สิ้นสุดแล้ว (${endDateStr})${contractData.reason ? ` เหตุผล: ${contractData.reason}` : ''}`,
    type: NotificationType.CONTRACT_TERMINATED,
    userId: contractData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนเมื่อใบแจ้งหนี้เลยกำหนด
 */
export async function notifyInvoiceOverdue(invoiceData: {
  invoiceNo: string;
  amount: number;
  roomName: string;
  tenantName?: string;
  dueDate: Date;
  daysPastDue: number;
  ownerId: string;
}): Promise<void> {
  const dueDateStr = invoiceData.dueDate.toLocaleDateString('th-TH');

  const notification: NotificationData = {
    title: 'ใบแจ้งหนี้เลยกำหนด',
    message: `ใบแจ้งหนี้ #${invoiceData.invoiceNo} ห้อง ${invoiceData.roomName}${invoiceData.tenantName ? ` (${invoiceData.tenantName})` : ''} เลยกำหนดชำระแล้ว ${invoiceData.daysPastDue} วัน (กำหนดชำระ: ${dueDateStr}) จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoiceData.amount)}`,
    type: NotificationType.INVOICE_OVERDUE,
    userId: invoiceData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนเมื่อเปลี่ยนสถานะห้อง
 */
export async function notifyRoomStatusChanged(roomData: {
  roomName: string;
  oldStatus: string;
  newStatus: string;
  ownerId: string;
}): Promise<void> {
  const statusLabels: Record<string, string> = {
    'AVAILABLE': 'ว่าง',
    'OCCUPIED': 'มีผู้เช่า',
    'MAINTENANCE': 'ปรับปรุงซ่อมแซม',
    'UNAVAILABLE': 'ไม่พร้อมใช้งาน'
  };

  const notification: NotificationData = {
    title: 'เปลี่ยนสถานะห้อง',
    message: `ห้อง ${roomData.roomName} เปลี่ยนสถานะจาก "${statusLabels[roomData.oldStatus] || roomData.oldStatus}" เป็น "${statusLabels[roomData.newStatus] || roomData.newStatus}"`,
    type: NotificationType.ROOM_STATUS_CHANGED,
    userId: roomData.ownerId
  };

  await createNotification(notification);
}

/**
 * แจ้งเตือนการบำรุงรักษา
 */
export async function notifyMaintenance(maintenanceData: {
  roomName: string;
  issue: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  ownerId: string;
}): Promise<void> {
  const priorityLabels = {
    'LOW': 'ต่ำ',
    'MEDIUM': 'กลาง', 
    'HIGH': 'สูง',
    'URGENT': 'เร่งด่วน'
  };

  const priorityIcons = {
    'LOW': '🔧',
    'MEDIUM': '🔧',
    'HIGH': '⚠️',
    'URGENT': '🚨'
  };

  const notification: NotificationData = {
    title: `${priorityIcons[maintenanceData.priority]} แจ้งซ่อมบำรุง`,
    message: `ห้อง ${maintenanceData.roomName} ต้องการซ่อมบำรุง: ${maintenanceData.issue} (ความสำคัญ: ${priorityLabels[maintenanceData.priority]})`,
    type: NotificationType.MAINTENANCE,
    userId: maintenanceData.ownerId
  };

  await createNotification(notification);
}

/**
 * สร้างรายงานรายเดือนอัตโนมัติ
 */
export async function createMonthlyReport(userId: string): Promise<void> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get monthly statistics
    const [totalRevenue, totalInvoices, totalReceipts, overdueInvoices] = await Promise.all([
      // Total revenue this month
      prisma.receipt.aggregate({
        where: {
          ownerId: userId,
          paidAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        },
        _sum: {
          amount: true
        }
      }),
      // Total invoices created this month
      prisma.invoice.count({
        where: {
          ownerId: userId,
          issuedAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        }
      }),
      // Total receipts this month
      prisma.receipt.count({
        where: {
          ownerId: userId,
          paidAt: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        }
      }),
      // Overdue invoices
      prisma.invoice.count({
        where: {
          ownerId: userId,
          status: 'OVERDUE'
        }
      })
    ]);

    const monthName = now.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    const revenue = totalRevenue._sum.amount || 0;

    const notification: NotificationData = {
      title: 'รายงานประจำเดือน',
      message: `รายงาน ${monthName}: รายรับ ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(revenue)} | ใบแจ้งหนี้ ${totalInvoices} ใบ | ใบเสร็จ ${totalReceipts} ใบ${overdueInvoices > 0 ? ` | เลยกำหนด ${overdueInvoices} ใบ` : ''}`,
      type: NotificationType.MONTHLY_REPORT,
      userId: userId
    };

    await createNotification(notification);
  } catch (error) {
    console.error('Error creating monthly report:', error);
  }
}

/**
 * สร้างการแจ้งเตือนสำหรับสัญญาที่ใกล้หมดอายุและใบแจ้งหนี้ที่ใกล้ครบกำหนด
 */
export async function generateReminderNotifications(): Promise<void> {
  try {
    const now = new Date();
    const notifications: NotificationData[] = [];

    // Contract expiry reminders (30, 7, 1 days before)
    const contractReminders = await Promise.all([
      // 30 days before
      prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          owner: { select: { id: true } }
        }
      }),
      // 7 days before
      prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          owner: { select: { id: true } }
        }
      }),
      // 1 day before
      prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          owner: { select: { id: true } }
        }
      })
    ]);

    const reminderDays = [30, 7, 1];
    contractReminders.forEach((contracts, index) => {
      const days = reminderDays[index];
      contracts.forEach((contract) => {
        const endDateStr = contract.endDate.toLocaleDateString('th-TH');
        notifications.push({
          title: `สัญญาใกล้หมดอายุ (${days} วัน)`,
          message: `สัญญาเช่าห้อง ${contract.room.name} กับ ${contract.tenantName} จะหมดอายุในอีก ${days} วัน (${endDateStr})`,
          type: NotificationType.CONTRACT_EXPIRY,
          userId: contract.owner.id
        });
      });
    });

    // Invoice due reminders (30, 7, 1 days before)
    const invoiceReminders = await Promise.all([
      // 30 days before
      prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          contract: { select: { tenantName: true } },
          owner: { select: { id: true } }
        }
      }),
      // 7 days before
      prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          contract: { select: { tenantName: true } },
          owner: { select: { id: true } }
        }
      }),
      // 1 day before
      prisma.invoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000),
            lte: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          room: { select: { name: true } },
          contract: { select: { tenantName: true } },
          owner: { select: { id: true } }
        }
      })
    ]);

    invoiceReminders.forEach((invoices, index) => {
      const days = reminderDays[index];
      invoices.forEach((invoice) => {
        const dueDateStr = invoice.dueDate.toLocaleDateString('th-TH');
        notifications.push({
          title: `ใกล้ครบกำหนดชำระ (${days} วัน)`,
          message: `ใบแจ้งหนี้ #${invoice.invoiceNo} ห้อง ${invoice.room.name}${invoice.contract?.tenantName ? ` (${invoice.contract.tenantName})` : ''} ครบกำหนดชำระในอีก ${days} วัน (${dueDateStr}) จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoice.amount)}`,
          type: NotificationType.RENT_DUE,
          userId: invoice.owner.id
        });
      });
    });

    // Check for overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: now
        }
      },
      include: {
        room: { select: { name: true } },
        contract: { select: { tenantName: true } },
        owner: { select: { id: true } }
      }
    });

    // Process overdue invoices
    for (const invoice of overdueInvoices) {
      const daysPastDue = Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue > 0) {
        notifications.push({
          title: 'ใบแจ้งหนี้เลยกำหนด',
          message: `ใบแจ้งหนี้ #${invoice.invoiceNo} ห้อง ${invoice.room.name}${invoice.contract?.tenantName ? ` (${invoice.contract.tenantName})` : ''} เลยกำหนดชำระแล้ว ${daysPastDue} วัน จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoice.amount)}`,
          type: NotificationType.INVOICE_OVERDUE,
          userId: invoice.owner.id
        });

        // Update invoice status to OVERDUE
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'OVERDUE' }
        });
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      console.log(`Created ${notifications.length} reminder notifications`);
    }

  } catch (error) {
    console.error('Error generating reminder notifications:', error);
  }
}

/**
 * ลบการแจ้งเตือนเก่า (เก่ากว่า 30 วัน)
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    console.log(`Cleaned up ${result.count} old notifications`);
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
  }
}

/**
 * ดึงสถิติการแจ้งเตือนของผู้ใช้
 */
export async function getNotificationStats(userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
}> {
  try {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId }
      }),
      prisma.notification.count({
        where: { userId, read: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true }
      })
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach(item => {
      typeStats[item.type] = item._count.type;
    });

    return { total, unread, byType: typeStats };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { total: 0, unread: 0, byType: {} };
  }
}
