'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-context';
import { Bell, Check, X } from 'lucide-react';
import { NotificationTypeLabels } from '@/lib/notification-service';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [token, , isClient] = useLocalStorage('token');

  // ดึงข้อมูลการแจ้งเตือน
  const fetchNotifications = async () => {
    if (!session?.user || !isClient || !token) return;

    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // อ่านการแจ้งเตือน
  const markAsRead = async (notificationId: string) => {
    if (!isClient || !token) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
          read: true,
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // อ่านทั้งหมด
  const markAllAsRead = async () => {
    if (!isClient || !token) return;
    
    try {
      setLoading(true);
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: unreadIds,
          read: true,
        }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // ลบการแจ้งเตือน
  const deleteNotification = async (notificationId: string) => {
    if (!isClient || !token) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (response.ok) {
        const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // โหลดข้อมูลเมื่อเริ่มต้น
  useEffect(() => {
    fetchNotifications();
  }, [session?.user, isClient, token]);

  // รีเฟรชทุก 30 วินาที
  useEffect(() => {
    if (!isClient || !token) return;
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session?.user, isClient, token]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'เพิ่งจะ';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
  };

  const getNotificationIcon = (type: string) => {
    const config = NotificationTypeLabels[type as keyof typeof NotificationTypeLabels];
    if (config?.icon) return config.icon;

    // Fallback icons
    switch (type) {
      case 'RENT_DUE':
      case 'PAYMENT_RECEIVED':
        return '💰';
      case 'CONTRACT_EXPIRY':
      case 'CONTRACT_CREATED':
      case 'CONTRACT_TERMINATED':
        return '📋';
      case 'INVOICE_CREATED':
      case 'INVOICE_OVERDUE':
        return '📄';
      case 'ROOM_STATUS_CHANGED':
        return '🏠';
      case 'MAINTENANCE':
        return '🔧';
      case 'MONTHLY_REPORT':
        return '📊';
      default:
        return '📢';
    }
  };

  const getBadgeColor = (type: string) => {
    const config = NotificationTypeLabels[type as keyof typeof NotificationTypeLabels];
    if (config?.color) return `badge-${config.color}`;
    return 'badge-info';
  };

  if (!session?.user) return null;

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="dropdown dropdown-end">
        <div 
          tabIndex={0} 
          role="button" 
          className="btn btn-ghost btn-circle relative"
        >
          <Bell className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="dropdown dropdown-end relative" style={{ zIndex: 10000 }}>
      <div 
        tabIndex={0} 
        role="button" 
        className="btn btn-ghost btn-circle relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="badge badge-error badge-sm absolute -top-1 -right-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      
      <div 
        tabIndex={0}
        className="dropdown-content card card-compact w-96 p-0 shadow-xl bg-base-100 border border-base-300"
        style={{ 
          zIndex: 10000,
          position: 'absolute',
          top: '100%',
          right: 0,
          transform: 'translateY(8px)'
        }}
      >
        <div className="card-body p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 className="font-semibold text-lg">การแจ้งเตือน</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="btn btn-ghost btn-xs"
                  title="อ่านทั้งหมด"
                >
                  <Check className="w-3 h-3" />
                </button>
              )}
              <Link href="/dashboard/notifications" className="btn btn-ghost btn-xs">
                ดูทั้งหมด
              </Link>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-base-content/60">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-base-200 hover:bg-base-50 ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${
                          !notification.read ? 'text-base-content' : 'text-base-content/70'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex gap-1 flex-shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="btn btn-ghost btn-xs opacity-60 hover:opacity-100"
                              title="ทำเครื่องหมายว่าอ่านแล้ว"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="btn btn-ghost btn-xs opacity-60 hover:opacity-100 hover:text-error"
                            title="ลบ"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <p className={`text-xs mt-1 ${
                        !notification.read ? 'text-base-content/80' : 'text-base-content/60'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge ${getBadgeColor(notification.type)} badge-xs`}>
                          {NotificationTypeLabels[notification.type as keyof typeof NotificationTypeLabels]?.label || notification.type}
                        </span>
                        <span className="text-xs text-base-content/50">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-3 border-t border-base-300 text-center">
              <Link href="/dashboard/notifications" className="btn btn-ghost btn-sm w-full">
                ดูการแจ้งเตือนทั้งหมด ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
