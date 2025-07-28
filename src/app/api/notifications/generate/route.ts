import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // ค้นหาสัญญาที่ใกล้หมดอายุ (30 วัน, 7 วัน, 1 วัน)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // ค้นหาใบแจ้งหนี้ที่ใกล้ครบกำหนดชำระ
    const upcomingInvoices = await prisma.invoice.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: thirtyDaysLater,
          gte: now,
        },
      },
      include: {
        room: true,
        contract: true,
        owner: true,
      },
    });

    // สร้างการแจ้งเตือนสำหรับแต่ละใบแจ้งหนี้
    for (const invoice of upcomingInvoices) {
      const daysUntilDue = Math.ceil((new Date(invoice.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let notificationTitle = '';
      let notificationMessage = '';
      const notificationType = 'RENT_DUE' as const;

      if (daysUntilDue <= 1) {
        notificationTitle = 'ครบกำหนดชำระค่าเช่าวันนี้!';
        notificationMessage = `ใบแจ้งหนี้ ${invoice.invoiceNo} ของห้อง ${invoice.room.name} ครบกำหนดชำระวันนี้ จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoice.amount)}`;
      } else if (daysUntilDue <= 7) {
        notificationTitle = 'ใกล้ครบกำหนดชำระค่าเช่า';
        notificationMessage = `ใบแจ้งหนี้ ${invoice.invoiceNo} ของห้อง ${invoice.room.name} จะครบกำหนดชำระในอีก ${daysUntilDue} วัน จำนวน ${new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(invoice.amount)}`;
      } else if (daysUntilDue <= 30) {
        notificationTitle = 'แจ้งเตือนค่าเช่าล่วงหน้า';
        notificationMessage = `ใบแจ้งหนี้ ${invoice.invoiceNo} ของห้อง ${invoice.room.name} จะครบกำหนดชำระในอีก ${daysUntilDue} วัน`;
      }

      // ตรวจสอบว่ามีการแจ้งเตือนสำหรับใบแจ้งหนี้นี้แล้วหรือยัง
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: invoice.ownerId,
          title: notificationTitle,
          message: {
            contains: invoice.invoiceNo,
          },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // ภายใน 24 ชั่วโมงที่ผ่านมา
          },
        },
      });

      // ถ้าไม่มีการแจ้งเตือนแล้ว ให้สร้างใหม่
      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            userId: invoice.ownerId,
            read: false,
          },
        });
      }
    }

    // ค้นหาสัญญาที่ใกล้หมดอายุ
    const upcomingContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lte: thirtyDaysLater,
          gte: now,
        },
      },
      include: {
        room: true,
        owner: true,
      },
    });

    // สร้างการแจ้งเตือนสำหรับสัญญาที่ใกล้หมดอายุ
    for (const contract of upcomingContracts) {
      const daysUntilExpiry = Math.ceil((new Date(contract.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let notificationTitle = '';
      let notificationMessage = '';
      const notificationType = 'CONTRACT_EXPIRY' as const;

      if (daysUntilExpiry <= 1) {
        notificationTitle = 'สัญญาเช่าหมดอายุวันนี้!';
        notificationMessage = `สัญญาเช่าของห้อง ${contract.room.name} (ผู้เช่า: ${contract.tenantName}) จะหมดอายุวันนี้`;
      } else if (daysUntilExpiry <= 7) {
        notificationTitle = 'สัญญาเช่าใกล้หมดอายุ';
        notificationMessage = `สัญญาเช่าของห้อง ${contract.room.name} (ผู้เช่า: ${contract.tenantName}) จะหมดอายุในอีก ${daysUntilExpiry} วัน`;
      } else if (daysUntilExpiry <= 30) {
        notificationTitle = 'แจ้งเตือนสัญญาเช่าล่วงหน้า';
        notificationMessage = `สัญญาเช่าของห้อง ${contract.room.name} (ผู้เช่า: ${contract.tenantName}) จะหมดอายุในอีก ${daysUntilExpiry} วัน`;
      }

      // ตรวจสอบว่ามีการแจ้งเตือนสำหรับสัญญานี้แล้วหรือยัง
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: contract.ownerId,
          title: notificationTitle,
          message: {
            contains: contract.room.name,
          },
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            userId: contract.ownerId,
            read: false,
          },
        });
      }
    }

    // นับจำนวนการแจ้งเตือนที่สร้างแล้ว
    const totalInvoiceNotifications = upcomingInvoices.length;
    const totalContractNotifications = upcomingContracts.length;

    return NextResponse.json({
      message: 'สร้างการแจ้งเตือนเรียบร้อย',
      invoiceNotifications: totalInvoiceNotifications,
      contractNotifications: totalContractNotifications,
      total: totalInvoiceNotifications + totalContractNotifications,
    });
  } catch (error) {
    console.error("Error creating notifications:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
