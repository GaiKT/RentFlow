'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, 
  ArrowLeft, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const notificationTypeConfig = {
  CONTRACT_EXPIRY: {
    label: 'สัญญาหมดอายุ',
    color: 'badge-warning',
    icon: Calendar,
    bgColor: 'bg-warning/10'
  },
  RENT_DUE: {
    label: 'ครบกำหนดค่าเช่า',
    color: 'badge-error',
    icon: AlertTriangle,
    bgColor: 'bg-error/10'
  },
  PAYMENT_RECEIVED: {
    label: 'ได้รับชำระเงิน',
    color: 'badge-success',
    icon: CheckCircle,
    bgColor: 'bg-success/10'
  },
  MAINTENANCE: {
    label: 'การซ่อมบำรุง',
    color: 'badge-info',
    icon: Settings,
    bgColor: 'bg-info/10'
  },
  GENERAL: {
    label: 'ทั่วไป',
    color: 'badge-neutral',
    icon: Bell,
    bgColor: 'bg-neutral/10'
  }
};

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    stats,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Generate notifications manually
  const handleGenerateNotifications = useCallback(async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // รีเฟรชการแจ้งเตือน
        await fetchNotifications();
        
        // แสดงผลลัพธ์
        if (data.total > 0) {
          alert(`สร้างการแจ้งเตือนใหม่ ${data.total} รายการ`);
        } else {
          alert('ไม่มีการแจ้งเตือนใหม่ที่ต้องสร้าง');
        }
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
      alert('เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน');
    } finally {
      setIsGenerating(false);
    }
  }, [router, fetchNotifications]);

  // Test notification system
  const handleTestNotifications = useCallback(async () => {
    setIsTesting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // ทดสอบ cron job API
      const response = await fetch('/api/cron/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reminders' })
      });

      if (response.ok) {
        await fetchNotifications();
        alert('ทดสอบระบบแจ้งเตือนเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการทดสอบระบบ');
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      alert('เกิดข้อผิดพลาดในการทดสอบระบบ');
    } finally {
      setIsTesting(false);
    }
  }, [router, fetchNotifications]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'เมื่อสักครู่';
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    
    return formatDateTime(dateString);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              การแจ้งเตือน
            </h1>
            <p className="text-base-content/70 mt-2">
              จัดการและดูการแจ้งเตือนทั้งหมด
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button 
            onClick={handleGenerateNotifications}
            className="btn btn-outline"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            สร้างการแจ้งเตือน
          </button>
          
          <button 
            onClick={handleTestNotifications}
            className="btn btn-outline btn-secondary"
            disabled={isTesting}
          >
            {isTesting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            ทดสอบระบบ
          </button>
          
          {stats.unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="btn btn-primary"
            >
              <CheckCircle className="w-4 h-4" />
              อ่านทั้งหมด ({stats.unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stats shadow-lg bg-base-100">
          <div className="stat">
            <div className="stat-figure text-primary">
              <Bell className="w-8 h-8" />
            </div>
            <div className="stat-title">การแจ้งเตือนทั้งหมด</div>
            <div className="stat-value text-primary">{stats.total}</div>
            <div className="stat-desc">รายการ</div>
          </div>
        </div>

        <div className="stats shadow-lg bg-base-100">
          <div className="stat">
            <div className="stat-figure text-error">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="stat-title">ยังไม่ได้อ่าน</div>
            <div className="stat-value text-error">{stats.unreadCount}</div>
            <div className="stat-desc">รายการ</div>
          </div>
        </div>

        <div className="stats shadow-lg bg-base-100">
          <div className="stat">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">อ่านแล้ว</div>
            <div className="stat-value text-success">{stats.total - stats.unreadCount}</div>
            <div className="stat-desc">รายการ</div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title mb-4">รายการการแจ้งเตือน</h2>
          
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-base-content/70 mb-2">
                ไม่มีการแจ้งเตือน
              </h3>
              <p className="text-base-content/50 mb-6">
                ยังไม่มีการแจ้งเตือนในระบบ
              </p>
              <button 
                onClick={handleGenerateNotifications}
                className="btn btn-primary"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                สร้างการแจ้งเตือน
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.GENERAL;
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all ${
                      notification.read 
                        ? 'border-base-300 opacity-60' 
                        : 'border-warning bg-warning/5 shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-base-content mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-base-content/70 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-base-content/50">
                              <div className={`badge ${typeConfig.color} badge-sm`}>
                                {typeConfig.label}
                              </div>
                              <span>{getRelativeTime(notification.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="btn btn-sm btn-success"
                                title="ทำเครื่องหมายว่าอ่านแล้ว"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="btn btn-sm btn-ghost text-error"
                              title="ลบการแจ้งเตือน"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
