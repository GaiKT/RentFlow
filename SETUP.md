# คำแนะนำการตั้งค่า Docker และ Database

## ขั้นตอนการเตรียม PostgreSQL Database

### 1. ติดตั้ง Docker Desktop
- ดาวน์โหลดและติดตั้ง Docker Desktop จาก https://www.docker.com/products/docker-desktop
- เปิด Docker Desktop และรอให้ระบบเริ่มต้น

### 2. เริ่มต้น PostgreSQL Database
เปิด Terminal/PowerShell ที่โฟลเดอร์โปรเจค และรันคำสั่ง:

```bash
docker-compose up -d
```

ตรวจสอบว่า Database รันแล้ว:
```bash
docker ps
```

### 3. Generate Prisma Client และ Migrate Database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

หากมีปัญหาในการ migrate สามารถใช้ไฟล์ SQL ที่เตรียมไว้:
```bash
# เข้าไปใน PostgreSQL container
docker exec -it rental_management_db psql -U rental_user -d rental_management

# หรือใช้ไฟล์ SQL โดยตรง
psql -h localhost -U rental_user -d rental_management -f init-database.sql
```

### 4. เริ่มต้นโปรเจค
```bash
npm run dev
```

## ข้อมูล Database

- **Host**: localhost
- **Port**: 5432
- **Database**: rental_management
- **Username**: rental_user
- **Password**: rental_password

## การจัดการ Docker

### หยุด Database
```bash
docker-compose down
```

### ลบ Database (ลบข้อมูลทั้งหมด)
```bash
docker-compose down -v
```

### ดูข้อมูล Database
```bash
# เข้าไปใน PostgreSQL
docker exec -it rental_management_db psql -U rental_user -d rental_management

# ดูตารางทั้งหมด
\dt

# ออกจาก PostgreSQL
\q
```

## Troubleshooting

### ปัญหา Docker ไม่เริ่มต้น
- ตรวจสอบว่า Docker Desktop ทำงานอยู่
- ตรวจสอบว่า Port 5432 ไม่ถูกใช้งานโดยโปรแกรมอื่น

### ปัญหา Database Connection
- ตรวจสอบ `.env.local` ว่าตรงกับการตั้งค่าใน `docker-compose.yml`
- รอ Database ประมาณ 30 วินาที หลังจาก `docker-compose up`

### ปัญหา Prisma
- ลบ `node_modules` และ `package-lock.json` แล้วติดตั้งใหม่
- รัน `npx prisma generate` ใหม่
