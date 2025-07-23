import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TestNotificationsPanelProps {
  onRefresh?: () => void;
}

export default function TestNotificationsPanel({ onRefresh }: TestNotificationsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [token, , isClient] = useLocalStorage('token');

  const handleCreateTestNotifications = async (type: string = 'all') => {
    if (!isClient || !token) {
      toast.error('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    
    setLoading(true);
    try {

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`สร้างการแจ้งเตือนทดสอบแล้ว ${data.created} รายการ`);
        
        // Refresh notifications
        if (onRefresh) {
          setTimeout(() => {
            onRefresh();
          }, 500);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error creating test notifications:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างการแจ้งเตือน');
    } finally {
      setLoading(false);
    }
  };

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="bg-base-100 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-primary">🧪 ทดสอบระบบแจ้งเตือน</h3>
        <div className="flex justify-center items-center h-32">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-primary">🧪 ทดสอบระบบแจ้งเตือน</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleCreateTestNotifications('all')}
          disabled={loading || !isClient}
          className="btn btn-primary btn-sm"
        >
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              กำลังสร้าง...
            </>
          ) : (
            '📢 สร้างทุกประเภท'
          )}
        </button>

        <button
          onClick={() => handleCreateTestNotifications('PAYMENT_RECEIVED')}
          disabled={loading || !isClient}
          className="btn btn-success btn-sm"
        >
          💰 ได้รับชำระเงิน
        </button>

        <button
          onClick={() => handleCreateTestNotifications('INVOICE_CREATED')}
          disabled={loading || !isClient}
          className="btn btn-info btn-sm"
        >
          📄 สร้างใบแจ้งหนี้
        </button>

        <button
          onClick={() => handleCreateTestNotifications('CONTRACT_CREATED')}
          disabled={loading || !isClient}
          className="btn btn-secondary btn-sm"
        >
          📝 สร้างสัญญา
        </button>

        <button
          onClick={() => handleCreateTestNotifications('CONTRACT_EXPIRY')}
          disabled={loading || !isClient}
          className="btn btn-warning btn-sm"
        >
          ⏰ สัญญาใกล้หมดอายุ
        </button>

        <button
          onClick={() => handleCreateTestNotifications('RENT_DUE')}
          disabled={loading || !isClient}
          className="btn btn-accent btn-sm"
        >
          💸 ใกล้ครบกำหนด
        </button>

        <button
          onClick={() => handleCreateTestNotifications('INVOICE_OVERDUE')}
          disabled={loading || !isClient}
          className="btn btn-error btn-sm"
        >
          ⚠️ เลยกำหนด
        </button>

        <button
          onClick={() => handleCreateTestNotifications('MAINTENANCE')}
          disabled={loading || !isClient}
          className="btn btn-neutral btn-sm"
        >
          🔧 แจ้งซ่อม
        </button>

        <button
          onClick={() => handleCreateTestNotifications('MONTHLY_REPORT')}
          disabled={loading || !isClient}
          className="btn btn-ghost btn-sm"
        >
          📊 รายงาน
        </button>
      </div>

      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div className="font-bold">วิธีใช้งาน</div>
          <div className="text-sm">
            คลิกปุ่มใดปุ่มหนึ่งเพื่อสร้างการแจ้งเตือนทดสอบ จากนั้นดูในไอคอนแจ้งเตือนที่มุมขวาบนของ Navbar
          </div>
        </div>
      </div>
    </div>
  );
}
