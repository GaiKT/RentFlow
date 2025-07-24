# RentFlow - ระบบจัดการห้องพัก

ระบบจัดการห้องพักสำหรับเจ้าของบ้านเช่า ที่ช่วยในการจัดการห้องพัก สัญญาเช่า การออกใบแจ้งหนี้ และใบเสร็จรับเงิน พร้อมระบบแจ้งเตือนอัตโนมัติ

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom JWT Authentication
- **File Storage**: Local file system with multer
- **Containerization**: Docker for PostgreSQL

## ฟีเจอร์หลัก

1. **ระบบ Authentication**: ลงทะเบียน เข้าสู่ระบบ และออกจากระบบ
2. **จัดการห้องพัก**: เพิ่ม แก้ไข ลบ และจัดการสถานะห้องพัก
3. **จัดการสัญญา**: อัปโหลด ดาวน์โหลด และจัดเก็บเอกสารสัญญาแบบดิจิทัล
4. **ระบบการเงิน**: สร้างใบแจ้งหนี้และใบเสร็จรับเงิน พร้อมฟังก์ชันพิมพ์
5. **ระบบแจ้งเตือน**: แจ้งเตือนสัญญาที่ใกล้หมดอายุและการเก็บค่าเช่า

## การติดตั้งและรัน

### 1. เตรียม Database

เริ่มต้น PostgreSQL ด้วย Docker:

```bash
docker-compose up -d
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` เป็น `.env.local`:

```bash
cp .env.example .env.local
```

### 4. สร้าง Database Schema

```bash
npx prisma generate
npx prisma migrate dev --name init
```

หากยังไม่ได้เปิด Docker สามารถใช้ไฟล์ SQL ที่เตรียมไว้:

```bash
# หลังจากเปิด Docker และ PostgreSQL แล้ว
psql -h localhost -U rental_user -d rental_management -f init-database.sql
```

### 5. รันโปรเจค

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## การใช้งาน

1. **หน้าแรก**: แสดงข้อมูลเกี่ยวกับระบบและลิงก์สำหรับเข้าสู่ระบบ
2. **สมัครสมาชิก**: สร้างบัญชีผู้ใช้ใหม่
3. **เข้าสู่ระบบ**: เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
4. **หน้า Dashboard**: ภาพรวมข้อมูลสถิติและลิงก์ไปยังฟีเจอร์ต่างๆ

## โครงสร้างโปรเจค

```
├── src/
│   ├── app/                 # Next.js App Router pages และ API routes
│   │   ├── api/            # API endpoints
│   │   ├── dashboard/      # หน้า dashboard และ sub-pages
│   │   ├── login/          # หน้าเข้าสู่ระบบ
│   │   ├── register/       # หน้าสมัครสมาชิก
│   │   └── page.tsx        # หน้าแรก
│   ├── components/         # React components ที่ใช้ซ้ำได้
│   ├── lib/               # Utility functions และ configurations
│   └── types/             # TypeScript type definitions
├── prisma/                # Database schema และ migrations
├── uploads/               # โฟลเดอร์สำหรับเก็บไฟล์ที่อัปโหลด
├── docker-compose.yml     # Docker configuration สำหรับ PostgreSQL
└── .env.local            # Environment variables
```
