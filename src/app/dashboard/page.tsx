"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import { Navbar } from "@/components/Navbar";
import { QuickStats, ActivityCard } from "@/components/StatCards";
import { RevenueChart, RoomStatusChart, PaymentTrendChart } from "@/components/Charts";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  activeContracts: number;
  pendingInvoices: number;
  unpaidInvoices: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchDashboardData = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setStats(data.stats);
      } else {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDashboardData(token);
  }, [router, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    customToast.logoutSuccess();
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  // Mock data for charts
  const revenueData = {
    labels: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."],
    revenue: [45000, 52000, 48000, 61000, 55000, 67000, 73000],
  };

  const roomStatusData = {
    available: stats ? stats.totalRooms - stats.occupiedRooms : 2,
    occupied: stats?.occupiedRooms || 8,
    maintenance: 1,
    unavailable: 0,
  };

  const paymentTrendData = {
    labels: ["สัปดาห์ 1", "สัปดาห์ 2", "สัปดาห์ 3", "สัปดาห์ 4"],
    paid: [12, 15, 18, 14],
    pending: [3, 2, 1, 4],
  };

  const recentActivities = [
    {
      id: "1",
      description: "ได้รับชำระเงินจากห้อง 101",
      time: "5 นาทีที่แล้ว",
      type: "success" as const,
    },
    {
      id: "2",
      description: "สัญญาห้อง 205 ใกล้หมดอายุ",
      time: "1 ชั่วโมงที่แล้ว",
      type: "warning" as const,
    },
    {
      id: "3",
      description: "สร้างใบแจ้งหนี้ใหม่ห้อง 303",
      time: "2 ชั่วโมงที่แล้ว",
      type: "info" as const,
    },
    {
      id: "4",
      description: "ผู้เช่าห้อง 102 ย้ายออก",
      time: "1 วันที่แล้ว",
      type: "error" as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content/70">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={user} onLogout={handleLogout} notificationCount={3} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                ยินดีต้อนรับ, {user.name}
              </h1>
              <p className="text-base-content/70 text-lg">
                ภาพรวมการจัดการห้องพักของคุณในวันนี้
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <div className="text-sm text-base-content/60">
                อัปเดตล่าสุด: {new Date().toLocaleString("th-TH")}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <RevenueChart data={revenueData} />
            </div>
          </div>

          {/* Room Status Chart */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <RoomStatusChart data={roomStatusData} />
            </div>
          </div>
        </div>

        {/* Payment Trend and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Payment Trend Chart */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <PaymentTrendChart data={paymentTrendData} />
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <ActivityCard title="กิจกรรมล่าสุด" items={recentActivities} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold mb-6">การดำเนินการด่วน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/rooms"
                className="btn btn-lg bg-gradient-to-r from-primary to-blue-600 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">จัดการห้องพัก</div>
                  <div className="text-sm opacity-90">เพิ่ม แก้ไข ดูรายละเอียด</div>
                </div>
              </Link>

              <Link
                href="/dashboard/contracts"
                className="btn btn-lg bg-gradient-to-r from-secondary to-green-600 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">จัดการสัญญา</div>
                  <div className="text-sm opacity-90">อัปโหลดและจัดการเอกสาร</div>
                </div>
              </Link>

              <Link
                href="/dashboard/invoices"
                className="btn btn-lg bg-gradient-to-r from-accent to-orange-600 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">ใบแจ้งหนี้</div>
                  <div className="text-sm opacity-90">สร้างและจัดการใบแจ้งหนี้</div>
                </div>
              </Link>

              <Link
                href="/dashboard/receipts"
                className="btn btn-lg bg-gradient-to-r from-info to-cyan-600 text-white border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">ใบเสร็จ</div>
                  <div className="text-sm opacity-90">สร้างและพิมพ์ใบเสร็จ</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
