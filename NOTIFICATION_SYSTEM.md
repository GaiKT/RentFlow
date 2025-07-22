# ระบบแจ้งเตือนอัตโนมัติ (Notification System)

ระบบแจ้งเตือนที่ครอบคลุมทุกกิจกรรมสำคัญในระบบจัดการอสังหาริมทรัพย์

## 🚀 คุณสมบัติหลัก

### การแจ้งเตือนอัตโนมัติ
- ✅ **ได้รับชำระเงิน** - เมื่อมีการสร้างใบเสร็จ
- ✅ **สร้างใบแจ้งหนี้** - เมื่อมีการสร้างใบแจ้งหนี้ใหม่  
- ✅ **สร้างสัญญาเช่า** - เมื่อมีการทำสัญญาใหม่
- ✅ **สัญญาใกล้หมดอายุ** - แจ้งเตือนล่วงหน้า 30, 7, 1 วัน
- ✅ **ใกล้ครบกำหนดชำระ** - แจ้งเตือนล่วงหน้า 30, 7, 1 วัน  
- ✅ **เลยกำหนดชำระ** - เมื่อใบแจ้งหนี้เกินกำหนด
- ✅ **เปลี่ยนสถานะห้อง** - เมื่อมีการเปลี่ยนสถานะห้อง
- ✅ **การบำรุงรักษา** - แจ้งเตือนการซ่อมแซม
- ✅ **รายงานรายเดือน** - สรุปผลประกอบการรายเดือน
- ✅ **สิ้นสุดสัญญา** - เมื่อสัญญาสิ้นสุดลง

### ประเภทการแจ้งเตือน (NotificationType)

| ประเภท | คำอธิบาย | ไอคอน | สี |
|--------|----------|-------|-----|
| `CONTRACT_EXPIRY` | สัญญาใกล้หมดอายุ | 📋 | warning |
| `RENT_DUE` | ใกล้ครบกำหนดชำระ | 💰 | info |
| `PAYMENT_RECEIVED` | ได้รับชำระเงิน | ✅ | success |
| `INVOICE_CREATED` | สร้างใบแจ้งหนี้ | 📄 | info |
| `CONTRACT_CREATED` | สร้างสัญญาใหม่ | 📝 | success |
| `CONTRACT_TERMINATED` | สิ้นสุดสัญญา | ❌ | error |
| `INVOICE_OVERDUE` | เลยกำหนดชำระ | ⚠️ | error |
| `ROOM_STATUS_CHANGED` | เปลี่ยนสถานะห้อง | 🏠 | info |
| `MAINTENANCE` | บำรุงรักษา | 🔧 | warning |
| `MONTHLY_REPORT` | รายงานรายเดือน | 📊 | info |
| `GENERAL` | ทั่วไป | 📢 | info |

## 🛠️ การใช้งาน

### 1. Notification Service (`/lib/notification-service.ts`)

```typescript
import { 
  createNotification, 
  notifyPaymentReceived, 
  generateReminderNotifications 
} from '@/lib/notification-service';

// สร้างการแจ้งเตือนใหม่
await createNotification({
  title: 'แจ้งเตือนใหม่',
  message: 'รายละเอียดการแจ้งเตือน',
  type: 'GENERAL',
  userId: 'user-id'
});

// แจ้งเตือนเมื่อได้รับชำระเงิน
await notifyPaymentReceived({
  receiptNo: 'REC-202407-0001',
  amount: 15000,
  roomName: 'ห้อง 101',
  tenantName: 'คุณสมชาย',
  ownerId: 'owner-id'
});
```

### 2. API Endpoints

#### GET `/api/notifications`
ดึงข้อมูลการแจ้งเตือนของผู้ใช้

#### PUT `/api/notifications`  
อัปเดตสถานะการอ่านการแจ้งเตือน

#### DELETE `/api/notifications`
ลบการแจ้งเตือน

#### POST `/api/notifications/generate`
สร้างการแจ้งเตือนอัตโนมัติ

#### GET/POST `/api/cron/notifications`
Cron job สำหรับรันการแจ้งเตือนอัตโนมัติ

### 3. React Components

#### NotificationDropdown
```tsx
import NotificationDropdown from '@/components/NotificationDropdown';

// ใช้ใน Navbar
<NotificationDropdown />
```

#### useNotifications Hook
```tsx
import { useNotifications } from '@/hooks/useNotifications';

const {
  notifications,
  stats,
  loading,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = useNotifications();
```

## ⚙️ การตั้งค่า Cron Job

### 1. Manual Testing
```bash
# ทดสอบการสร้างการแจ้งเตือน
curl -X POST http://localhost:3000/api/cron/notifications \
  -H "Content-Type: application/json" \
  -d '{"action": "reminders"}'
```

### 2. Production Cron Job
```bash
# รันทุกวันเวลา 9:00 น.
0 9 * * * curl -X GET http://your-domain.com/api/cron/notifications \
  -H "Authorization: Bearer your-cron-secret"
```

### 3. Environment Variables
```env
# .env.local
CRON_SECRET=your-secure-cron-secret
```

## 📱 User Interface

### 1. Notification Dropdown (Navbar)
- แสดงการแจ้งเตือนล่าสุด 10 รายการ
- แสดงจำนวนการแจ้งเตือนที่ยังไม่อ่าน
- ปุ่มอ่านทั้งหมด และลบการแจ้งเตือน
- รีเฟรชอัตโนมัติทุก 30 วินาที

### 2. Notifications Dashboard (`/dashboard/notifications`)
- แสดงสถิติการแจ้งเตือนทั้งหมด
- กรองตามประเภทและสถานะ
- จัดการการแจ้งเตือนแบบเป็นกลุ่ม
- ปุ่มทดสอบระบบแจ้งเตือน

## 🔧 การพัฒนาและปรับแต่ง

### เพิ่มประเภทการแจ้งเตือนใหม่

1. **เพิ่มใน Prisma Schema**
```prisma
enum NotificationType {
  // ... existing types
  NEW_NOTIFICATION_TYPE
}
```

2. **เพิ่มใน NotificationTypeLabels**
```typescript
export const NotificationTypeLabels = {
  // ... existing labels
  NEW_NOTIFICATION_TYPE: {
    label: 'ป้ายกำกับใหม่',
    icon: '🆕',
    color: 'info'
  }
};
```

3. **สร้างฟังก์ชันแจ้งเตือน**
```typescript
export async function notifyNewType(data: {
  // ข้อมูลที่ต้องการ
  ownerId: string;
}): Promise<void> {
  await createNotification({
    title: 'หัวข้อการแจ้งเตือน',
    message: 'รายละเอียดการแจ้งเตือน',
    type: NotificationType.NEW_NOTIFICATION_TYPE,
    userId: data.ownerId
  });
}
```

### การเชื่อมโยงกับกิจกรรม

เพิ่มการแจ้งเตือนใน API endpoints ที่เกี่ยวข้อง:

```typescript
import { notifyNewType } from '@/lib/notification-service';

// ใน API handler
await notifyNewType({
  ownerId: userId,
  // ข้อมูลอื่นๆ
});
```

## 🔍 การ Debug และ Monitoring

### 1. Log Files
ระบบจะ log การทำงานใน console:
```
Created 5 reminder notifications
Cleaned up 10 old notifications  
Monthly reports generated for 3 users
```

### 2. การทดสอบ
- ใช้ปุ่ม "ทดสอบระบบ" ใน Notifications Dashboard
- เรียก API `/api/notifications/generate` manual
- ตรวจสอบฐานข้อมูล notifications table

### 3. Performance
- การแจ้งเตือนเก่าจะถูกลบอัตโนมัติหลัง 30 วัน
- รีเฟรชการแจ้งเตือนทุก 30 วินาทีเท่านั้น
- ใช้ bulk operations สำหรับประสิทธิภาพ

## 📋 TODO / Features ที่ควรเพิ่ม

- [ ] **Email Notifications** - ส่งแจ้งเตือนทางอีเมล
- [ ] **Push Notifications** - แจ้งเตือนแบบ push บนมือถือ
- [ ] **SMS Notifications** - ส่งแจ้งเตือนทาง SMS
- [ ] **การตั้งค่าการแจ้งเตือน** - ให้ผู้ใช้เลือกประเภทที่ต้องการได้รับ
- [ ] **การจัดกลุ่มการแจ้งเตือน** - จัดกลุ่มตามประเภทหรือห้อง
- [ ] **การแจ้งเตือนแบบ Real-time** - ใช้ WebSocket หรือ Server-Sent Events
- [ ] **การแจ้งเตือนตามความสำคัญ** - แบ่งระดับความสำคัญ
- [ ] **รายงานการแจ้งเตือน** - สถิติและรายงานการแจ้งเตือน

## 🚦 การใช้งานในโปรดักชัน

1. **ตั้งค่า Cron Job** บนเซิร์ฟเวอร์
2. **กำหนด CRON_SECRET** ที่ปลอดภัย
3. **ตรวจสอบ Database Performance** 
4. **กำหนด Rate Limiting** สำหรับ API
5. **ตั้งค่า Monitoring และ Alerting**
6. **สำรองข้อมูลการแจ้งเตือน**

---

✨ **ระบบแจ้งเตือนพร้อมใช้งานแล้ว!** สามารถทดสอบได้ที่หน้า Dashboard → การแจ้งเตือน
