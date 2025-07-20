"use client";

import { 
  Home, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building,
  Receipt,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "primary" | "secondary" | "accent" | "success" | "warning" | "error" | "info";
}

export function StatCard({ title, value, description, icon, trend, color }: StatCardProps) {
  const iconBgClasses = {
    primary: "bg-primary/20 text-primary",
    secondary: "bg-secondary/20 text-secondary",
    accent: "bg-accent/20 text-accent",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    error: "bg-error/20 text-error",
    info: "bg-info/20 text-info",
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-base-content/70 mb-1">
              {title}
            </div>
            <div className="text-3xl font-bold text-base-content mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {description && (
              <div className="text-sm text-base-content/60">
                {description}
              </div>
            )}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend.isPositive ? 'text-success' : 'text-error'
              }`}>
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-base-content/60">จากเดือนที่แล้ว</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${iconBgClasses[color]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuickStatsProps {
  stats: {
    totalRooms: number;
    occupiedRooms: number;
    activeContracts: number;
    pendingInvoices: number;
    unpaidInvoices: number;
    monthlyRevenue: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  const occupancyRate = stats.totalRooms > 0 ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="ห้องพักทั้งหมด"
        value={stats.totalRooms}
        description={`ห้องที่เช่าแล้ว: ${stats.occupiedRooms}`}
        icon={<Building className="w-8 h-8" />}
        color="primary"
        trend={{
          value: 5.2,
          isPositive: true
        }}
      />
      
      <StatCard
        title="อัตราการเช่า"
        value={`${occupancyRate.toFixed(1)}%`}
        description={`${stats.occupiedRooms}/${stats.totalRooms} ห้อง`}
        icon={<Home className="w-8 h-8" />}
        color="success"
        trend={{
          value: 2.1,
          isPositive: true
        }}
      />
      
      <StatCard
        title="สัญญาที่ใช้งาน"
        value={stats.activeContracts}
        description={`ใบแจ้งหนี้รอชำระ: ${stats.pendingInvoices}`}
        icon={<FileText className="w-8 h-8" />}
        color="info"
      />
      
      <StatCard
        title="รายได้เดือนนี้"
        value={`฿${stats.monthlyRevenue.toLocaleString()}`}
        description={`ค้างชำระ: ${stats.unpaidInvoices} รายการ`}
        icon={<DollarSign className="w-8 h-8" />}
        color="accent"
        trend={{
          value: 12.5,
          isPositive: true
        }}
      />
    </div>
  );
}

interface ActivityCardProps {
  title: string;
  items: Array<{
    id: string;
    description: string;
    time: string;
    type: "success" | "warning" | "error" | "info";
  }>;
}

export function ActivityCard({ title, items }: ActivityCardProps) {
  const typeIcons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    warning: <AlertCircle className="w-5 h-5 text-warning" />,
    error: <AlertCircle className="w-5 h-5 text-error" />,
    info: <Receipt className="w-5 h-5 text-info" />,
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg font-bold mb-4">{title}</h3>
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                {typeIcons[item.type]}
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-base-content/60">{item.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-base-content/60">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ไม่มีกิจกรรมล่าสุด</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
