'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { customToast } from '@/lib/toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'CONTRACT_EXPIRY' | 'RENT_DUE' | 'PAYMENT_RECEIVED' | 'MAINTENANCE' | 'GENERAL';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unreadCount: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ total: 0, unreadCount: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setStats({
          total: data.total,
          unreadCount: data.unreadCount
        });
      } else if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          notificationId
        }),
      });

      if (response.ok) {
        // อัปเดต state local
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setStats(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
        customToast.success('ทำเครื่องหมายอ่านแล้ว');
      } else {
        customToast.error('เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      customToast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAllAsRead'
        }),
      });

      if (response.ok) {
        // อัปเดต state local
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setStats(prev => ({
          ...prev,
          unreadCount: 0
        }));
        customToast.success('ทำเครื่องหมายอ่านทั้งหมดแล้ว');
      } else {
        customToast.error('เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      customToast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // อัปเดต state local
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setStats(prev => ({
          total: prev.total - 1,
          unreadCount: deletedNotification && !deletedNotification.read 
            ? prev.unreadCount - 1 
            : prev.unreadCount
        }));
        customToast.success('ลบการแจ้งเตือนแล้ว');
      } else {
        customToast.error('เกิดข้อผิดพลาดในการลบ');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      customToast.error('เกิดข้อผิดพลาดในการลบ');
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Polling สำหรับ notifications ใหม่ (ทุก 30 วินาที)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    stats,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
