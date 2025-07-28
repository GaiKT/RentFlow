"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  Receipt,
  CreditCard,
  Plus,
  Calendar,
  CheckCircle,
  Activity,
} from "lucide-react";
import { RevenueChart } from "@/components/Charts";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  activeContracts: number;
  contractsExpiringSoon: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalReceipts: number;
  monthlyReceiptAmount: number;
  revenueChart: {
    labels: string[];
    revenue: number[];
  };
  roomStatus: {
    available: number;
    occupied: number;
    maintenance: number;
    unavailable: number;
  };
  invoiceStatistics: Record<string, { count: number; amount: number }>;
}

interface RecentActivity {
  id: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info';
  icon?: string;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  count?: number;
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
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDashboardData(token);
  }, [router, fetchDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
          <p className="text-base-content/70">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user || !stats) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  // ใช้ข้อมูลจริงจาก API
  const averageMonthlyRevenue = stats.revenueChart.revenue.length > 0 
    ? stats.revenueChart.revenue.reduce((a, b) => a + b, 0) / stats.revenueChart.revenue.length
    : 0;

  // Quick Actions with real data
  const quickActions: QuickAction[] = [
    {
      title: "เพิ่มห้องใหม่",
      description: "เพิ่มห้องพักใหม่ในระบบ",
      href: "/dashboard/rooms/create",
      icon: <Building className="w-8 h-8" />,
      color: "btn-primary",
      count: stats.availableRooms,
    },
    {
      title: "สร้างสัญญา",
      description: "จัดทำสัญญาเช่าใหม่",
      href: "/dashboard/contracts/create",
      icon: <FileText className="w-8 h-8" />,
      color: "btn-success",
      count: stats.activeContracts,
    },
    {
      title: "ออกใบแจ้งหนี้",
      description: "สร้างใบแจ้งหนี้สำหรับผู้เช่า",
      href: "/dashboard/invoices/create",
      icon: <Receipt className="w-8 h-8" />,
      color: "btn-warning",
      count: stats.pendingInvoices,
    },
    {
      title: "ออกใบเสร็จ",
      description: "สร้างใบเสร็จรับเงิน",
      href: "/dashboard/receipts/create",
      icon: <CreditCard className="w-8 h-8" />,
      color: "btn-info",
      count: stats.totalReceipts,
    },
  ];

  // Get recent activities from API (these would come from the activity log)
  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      description: `ได้รับชำระเงินจำนวน ${formatCurrency(stats.monthlyReceiptAmount)}`,
      time: "เมื่อไม่นานนี้",
      type: "success" as RecentActivity['type'],
      icon: "💰",
    },
    {
      id: "2",
      description: `มีสัญญาที่จะหมดอายุ ${stats.contractsExpiringSoon} ฉบับ`,
      time: "วันนี้",
      type: "warning" as RecentActivity['type'],
      icon: "⚠️",
    },
    {
      id: "3",
      description: `ใบแจ้งหนี้ค้างชำระ ${stats.overdueInvoices} ใบ`,
      time: "วันนี้",
      type: (stats.overdueInvoices > 0 ? "error" : "info") as RecentActivity['type'],
      icon: stats.overdueInvoices > 0 ? "🚨" : "📄",
    },
    {
      id: "4",
      description: `ห้องว่างพร้อมให้เช่า ${stats.availableRooms} ห้อง`,
      time: "อัปเดตล่าสุด",
      type: "info" as RecentActivity['type'],
      icon: "🏠",
    },
  ].filter(activity => {
    // Filter out activities with zero counts
    if (activity.id === "2" && stats.contractsExpiringSoon === 0) return false;
    if (activity.id === "3" && stats.overdueInvoices === 0) return false;
    if (activity.id === "4" && stats.availableRooms === 0) return false;
    return true;
  });

  const getActivityBadgeColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'success': return 'badge-success';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-error';
      default: return 'badge-info';
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-base-content mb-2">
                ยินดีต้อนรับ, <span className="text-primary">{user.name}</span>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Rooms */}
          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-primary">
              <Building className="w-8 h-8" />
            </div>
            <div className="stat-title">ห้องทั้งหมด</div>
            <div className="stat-value text-primary">{stats.totalRooms}</div>
            <div className="stat-desc">ห้องพัก</div>
          </div>

          {/* Occupied Rooms */}
          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-success">
              <Users className="w-8 h-8" />
            </div>
            <div className="stat-title">ห้องที่มีผู้เช่า</div>
            <div className="stat-value text-success">{stats.occupiedRooms}</div>
            <div className="stat-desc">
              จาก {stats.totalRooms} ห้อง ({Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}%)
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-accent">
              <DollarSign className="w-8 h-8" />
            </div>
            <div className="stat-title">รายได้เดือนนี้</div>
            <div className="stat-value text-accent">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-desc">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              รายได้ประจำเดือน
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-warning">
              <Clock className="w-8 h-8" />
            </div>
            <div className="stat-title">ใบแจ้งหนี้รอชำระ</div>
            <div className="stat-value text-warning">{stats.pendingInvoices}</div>
            <div className="stat-desc">
              {stats.overdueInvoices > 0 && (
                <span className="text-error">เลยกำหนด {stats.overdueInvoices} ใบ</span>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <TrendingUp className="w-6 h-6" />
                รายได้รายเดือน
              </h2>
              <div className="mb-4">
                <div className="stats stats-horizontal shadow w-full">
                  <div className="stat">
                    <div className="stat-title text-xs">เดือนนี้</div>
                    <div className="stat-value text-lg text-success">{formatCurrency(stats.monthlyRevenue)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title text-xs">เฉลี่ย/เดือน</div>
                    <div className="stat-value text-lg text-info">{formatCurrency(averageMonthlyRevenue)}</div>
                  </div>
                </div>
              </div>
              <RevenueChart data={stats.revenueChart} />
            </div>
          </div>

          {/* Room Status Chart */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                <Building className="w-6 h-6" />
                สถานะห้องพัก
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="stat bg-success/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-success">ห้องที่มีผู้เช่า</div>
                  <div className="stat-value text-lg text-success">{stats.roomStatus.occupied}</div>
                </div>
                <div className="stat bg-info/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-info">ห้องว่าง</div>
                  <div className="stat-value text-lg text-info">{stats.roomStatus.available}</div>
                </div>
                <div className="stat bg-warning/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-warning">ซ่อมบำรุง</div>
                  <div className="stat-value text-lg text-warning">{stats.roomStatus.maintenance}</div>
                </div>
                <div className="stat bg-error/10 rounded-lg p-3">
                  <div className="stat-title text-xs text-error">ไม่พร้อมใช้</div>
                  <div className="stat-value text-lg text-error">{stats.roomStatus.unavailable}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-6">
                <Plus className="w-6 h-6" />
                การดำเนินการด่วน
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {quickActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{action.icon}</div>
                      <div>
                        <h3 className="font-semibold text-base-content">{action.title}</h3>
                        <p className="text-sm text-base-content/70">{action.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {action.count !== undefined && (
                        <div className="badge badge-primary">{action.count}</div>
                      )}
                      <button 
                        onClick={() => router.push(action.href)}
                        className={`btn btn-sm ${action.color}`}
                      >
                        ไป
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-6">
                <Activity className="w-6 h-6" />
                กิจกรรมล่าสุด
              </h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-base-200 transition-colors">
                    <div className="text-xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-base-content">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-base-content/60">{activity.time}</span>
                        <div className={`badge badge-xs ${getActivityBadgeColor(activity.type)}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-base-content/60">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ยังไม่มีกิจกรรมล่าสุด</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-info">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="stat-title">สัญญาใกล้หมดอายุ</div>
            <div className="stat-value text-info">{stats.contractsExpiringSoon}</div>
            <div className="stat-desc">ใน 30 วันข้างหน้า</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">ใบแจ้งหนี้ชำระแล้ว</div>
            <div className="stat-value text-success">{stats.paidInvoices}</div>
            <div className="stat-desc">ในเดือนนี้</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-2xl border border-base-300">
            <div className="stat-figure text-accent">
              <Receipt className="w-8 h-8" />
            </div>
            <div className="stat-title">รายได้ปีนี้</div>
            <div className="stat-value text-accent">{formatCurrency(stats.yearlyRevenue)}</div>
            <div className="stat-desc">รวมทั้งปี</div>
          </div>
        </div>
      </div>
    </div>
  );
}
